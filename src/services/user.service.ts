import {
  insertUser,
  findUsersByAccountId,
  findUserById,
  updateUserPlan,
} from "../db/queries/users.js";

import { getPlanByIdQuery } from "../db/queries/plans.js";
import { AppError } from "../errors/app-error.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/http-errors.js";
import { getAccountIDByApiKeyQuery } from "../db/queries/apiKeys.js";
import { Plan } from "../db/schema.js";
import { getUserUsageHistoryQuery } from "../db/queries/usage.js";

// POST /api/v1/users
export async function createUserService(data: {
  apiKey: string;
  name: string;
  planId: string;
}) {
  const accountId = await getAccountIDByApiKeyQuery(data.apiKey);

  if (!accountId) {
    throw new NotFoundError(
      "ACCOUNT_NOT_FOUND",
      "There is no account associated with the provided API key",
    );
  }

  const plan: Plan = await getPlanByIdQuery(data.planId);

  if (!plan) {
    throw new NotFoundError("PLAN_NOT_FOUND", "Plan not found");
  }

  if (!plan.isSystem && plan.ownerAccountId !== accountId) {
    throw new UnauthorizedError(
      "The specified plan is not available for this account",
    );
  }

  if (plan.type !== "user") {
    throw new BadRequestError("INVALID_PLAN_TYPE", "A user plan is required");
  }

  return insertUser({
    accountId: accountId,
    name: data.name,
    planId: data.planId,
  });
}

// GET /api/v1/users
export async function getUsersService(data: { accountId: string }) {
  return findUsersByAccountId(data.accountId);
}

// GET /api/v1/users/:userId
export async function getUserByIdService(data: {
  accountId: string;
  userId: string;
}) {
  const user = await findUserById(data.accountId, data.userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
}

// PATCH /api/v1/users/:userId/plan
export async function changeUserPlanService(data: {
  accountId: string;
  userId: string;
  planId: string;
}) {
  const user = await updateUserPlan(data.accountId, data.userId, data.planId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
}

export async function getUserUsageService(data: {
  accountId: string;
  userId: string;
}) {
  const user = await findUserById(data.accountId, data.userId);

  if (!user) {
    throw new NotFoundError("USER_NOT_FOUND", "User not found");
  }

  const usage = await getUserUsageHistoryQuery(data.accountId, data.userId);
  return usage;
}
