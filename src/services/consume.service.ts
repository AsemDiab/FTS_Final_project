import { createHash } from "node:crypto";

import {
  getAccountPlanQuery,
  isUserInAccountQuery,
} from "../db/queries/accounts.js";

import {
  getConsumptionByRequestIdQuery,
  insertConsumptionQuery,
} from "../db/queries/consumption.js";

import { getPlanByIdQuery } from "../db/queries/plans.js";

import {
  getAccountMonthlyUsageQuery,
  getUserMonthlyUsageQuery,
} from "../db/queries/usage.js";

import { getUserPlanQuery } from "../db/queries/users.js";

import { IdempotencyKeyReusedError } from "../errors/domain-errors.js";
import { NotFoundError, UnauthorizedError } from "../errors/http-errors.js";

type QuotaResult = {
  allowed: boolean;
  reason?: "monthly_limit" | "per_request_limit";
  scope?: "account" | "user";
  limits?: {
    quota: number;
    used: number;
    requested: number;
  };
};

function createRequestHash(userId: string, units: number): string {
  // Include every field that changes the meaning of the request.
  const canonicalPayload = JSON.stringify({
    userId,
    units,
  });

  return createHash("sha256").update(canonicalPayload).digest("hex");
}

async function checkIdempotency(
  accountId: string,
  userId: string,
  units: number,
  requestId: string,
  requestHash: string,
) {
  const existing = await getConsumptionByRequestIdQuery(accountId, requestId);

  if (!existing) {
    return null;
  }

  // Prefer comparing the canonical request hash.
  if (existing.request_hash !== requestHash) {
    throw new IdempotencyKeyReusedError();
  }

  // The hash covers userId and units.
  // Return the original accepted or rejected result.
  return existing;
}

async function checkAccountQuota(
  accountId: string,
  units: number,
  monthStart: Date,
  nextMonthStart: Date,
): Promise<QuotaResult> {
  const planId = await getAccountPlanQuery(accountId);

  if (!planId) {
    throw new NotFoundError("NOT_FOUND", "Account plan not found");
  }

  const plan = await getPlanByIdQuery(planId);

  if (!plan) {
    throw new NotFoundError("NOT_FOUND", "Plan not found");
  }

  const usage = await getAccountMonthlyUsageQuery(
    accountId,
    monthStart,
    nextMonthStart,
  );

  // Your usage summary query returns consumedUnits.
  const used = usage.consumedUnits;

  if (units > plan.rateLimit) {
    return {
      allowed: false,
      reason: "per_request_limit",
      scope: "account",
      limits: {
        quota: plan.quota,
        used,
        requested: units,
      },
    };
  }

  if (used + units > plan.quota) {
    return {
      allowed: false,
      reason: "monthly_limit",
      scope: "account",
      limits: {
        quota: plan.quota,
        used,
        requested: units,
      },
    };
  }

  return { allowed: true };
}

async function checkUserQuota(
  accountId: string,
  userId: string,
  units: number,
  monthStart: Date,
  nextMonthStart: Date,
): Promise<QuotaResult> {
  const planId = await getUserPlanQuery(userId);

  if (!planId) {
    throw new NotFoundError("NOT_FOUND", "User plan not found");
  }

  const plan = await getPlanByIdQuery(planId);

  if (!plan) {
    throw new NotFoundError("NOT_FOUND", "User plan not found");
  }

  const usage = await getUserMonthlyUsageQuery(
    accountId,
    userId,
    monthStart,
    nextMonthStart,
  );

  const used = usage.consumedUnits;

  if (units > plan.rateLimit) {
    return {
      allowed: false,
      reason: "per_request_limit",
      scope: "user",
      limits: {
        quota: plan.quota,
        used,
        requested: units,
      },
    };
  }

  if (used + units > plan.quota) {
    return {
      allowed: false,
      reason: "monthly_limit",
      scope: "user",
      limits: {
        quota: plan.quota,
        used,
        requested: units,
      },
    };
  }

  return { allowed: true };
}

async function recordConsumption(data: {
  accountId: string;
  userId: string;
  apiKeyId: string;
  requestId: string;
  requestHash: string;
  units: number;
  result: QuotaResult;
}) {
  const rejected = !data.result.allowed;

  return insertConsumptionQuery({
    accountId: data.accountId,
    userId: data.userId,
    apiKeyId: data.apiKeyId,
    requestId: data.requestId,
    requestHash: data.requestHash,
    requestedUnits: data.units,
    consumedUnits: rejected ? 0 : data.units,
    outcome: rejected ? "rejected" : "accepted",
    rejectionScope: rejected ? (data.result.scope ?? null) : null,
    rejectionReason: rejected ? (data.result.reason ?? null) : null,
  });
}

export async function consumeService(
  accountId: string,
  apiKeyId: string,
  userId: string,
  requestId: string,
  units: number,
) {
  console.log(`input = ${accountId}: string,
  ${apiKeyId}: string,
  ${userId}: string,
  ${requestId}: string,
  ${units}: number,`);
  const requestHash = createRequestHash(userId, units);

  // 1. Idempotency: return the original result on a retry.
  const existing = await checkIdempotency(
    accountId,
    userId,
    units,
    requestId,
    requestHash,
  );

  if (existing) {
    return existing;
  }

  // 2. Verify that the user belongs to this account.
  const userBelongsToAccount = await isUserInAccountQuery(accountId, userId);

  if (!userBelongsToAccount) {
    throw new UnauthorizedError("User is not part of the account.");
  }

  // 3. Calculate current UTC calendar month boundaries.
  const now = new Date();

  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  // 4. Check both independent quota levels.
  const accountResult = await checkAccountQuota(
    accountId,
    units,
    monthStart,
    nextMonthStart,
  );

  const userResult = await checkUserQuota(
    accountId,
    userId,
    units,
    monthStart,
    nextMonthStart,
  );

  // 5. Record one rejected row if either quota fails.
  // Account rejection takes precedence if both fail.
  const failedResult = !accountResult.allowed
    ? accountResult
    : !userResult.allowed
      ? userResult
      : null;

  if (failedResult) {
    return recordConsumption({
      accountId,
      userId,
      apiKeyId,
      requestId,
      requestHash,
      units,
      result: failedResult,
    });
  }

  // 6. Both quota checks passed. Record accepted consumption.
  return recordConsumption({
    accountId,
    userId,
    apiKeyId,
    requestId,
    requestHash,
    units,
    result: { allowed: true },
  });
}
