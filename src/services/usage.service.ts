import {
  getAccountUsageHistoryQuery,
  getUserUsageHistoryQuery,
  getAccountMonthlyUsageQuery,
  getUserMonthlyUsageQuery,
} from "../db/queries/usage.js";

import { NotFoundError, ValidationError } from "../errors/index.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_PAGE = 1;

type HistoryPagination = {
  page?: number;
  limit?: number;
};

function validateHistoryPagination(input: HistoryPagination) {
  const page = input.page ?? DEFAULT_PAGE;
  const limit = input.limit ?? DEFAULT_LIMIT;

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ValidationError(
      [{ field: "page", message: "page must be a positive integer" }],
      "INVALID_PAGINATION",
      "Invalid pagination parameters",
    );
  }

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError(
      [
        {
          field: "limit",
          message: `limit must be between 1 and ${MAX_LIMIT}`,
        },
      ],
      "INVALID_PAGINATION",
      "Invalid pagination parameters",
    );
  }

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    throw new ValidationError(
      [{ field: "page", message: "page is too large" }],
      "INVALID_PAGINATION",
      "Invalid pagination parameters",
    );
  }

  return { page, limit, offset };
}

/**
 * Returns UTC calendar-month boundaries.
 * period format: YYYY-MM.
 * Defaults to the current UTC month.
 */
function getUtcMonthRange(period?: string) {
  const now = new Date();

  const currentPeriod = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}`;

  const selectedPeriod = period ?? currentPeriod;

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedPeriod)) {
    throw new ValidationError(
      [
        {
          field: "period",
          message: "period must use YYYY-MM format",
        },
      ],
      "INVALID_MONTH",
      "Invalid reporting period",
    );
  }

  const [year, month] = selectedPeriod.split("-").map(Number);

  // Avoid JavaScript Date's special handling of years 0–99.
  const monthStart = new Date(0);
  monthStart.setUTCFullYear(year, month - 1, 1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const nextMonthStart = new Date(0);
  nextMonthStart.setUTCFullYear(year, month, 1);
  nextMonthStart.setUTCHours(0, 0, 0, 0);

  return {
    period: selectedPeriod,
    monthStart,
    nextMonthStart,
  };
}

// GET /api/v1/usage
export async function getAccountUsageSummaryService(
  accountId: string,
  period?: string,
) {
  const range = getUtcMonthRange(period);

  const totals = await getAccountMonthlyUsageQuery(
    accountId,
    range.monthStart,
    range.nextMonthStart,
  );

  return {
    scope: "account" as const,
    period: range.period,
    ...totals,
  };
}

// GET /api/v1/usage/history
export async function getAccountUsageHistoryService(
  accountId: string,
  pagination: HistoryPagination,
) {
  const { page, limit, offset } = validateHistoryPagination(pagination);

  const records = await getAccountUsageHistoryQuery(accountId, limit, offset);

  return {
    data: records,
    pagination: {
      page,
      limit,
      hasMore: records.length === limit,
    },
  };
}

// GET /api/v1/users/:userId/usage
export async function getUserUsageSummaryService(
  accountId: string,
  userId: string,
  period?: string,
) {
  if (!userId) {
    throw new ValidationError(
      [{ field: "userId", message: "userId is required" }],
      "VALIDATION_ERROR",
      "Invalid user ID",
    );
  }

  const range = getUtcMonthRange(period);

  const totals = await getUserMonthlyUsageQuery(
    accountId,
    userId,
    range.monthStart,
    range.nextMonthStart,
  );

  return {
    scope: "user" as const,
    userId,
    period: range.period,
    ...totals,
  };
}

// GET /api/v1/users/:userId/usage/history
export async function getUserUsageHistoryService(
  accountId: string,
  userId: string,
  pagination: HistoryPagination,
) {
  if (!userId) {
    throw new ValidationError(
      [{ field: "userId", message: "userId is required" }],
      "VALIDATION_ERROR",
      "Invalid user ID",
    );
  }

  const { page, limit, offset } = validateHistoryPagination(pagination);

  const records = await getUserUsageHistoryQuery(
    accountId,
    userId,
    limit,
    offset,
  );

  return {
    userId,
    data: records,
    pagination: {
      page,
      limit,
      hasMore: records.length === limit,
    },
  };
}
