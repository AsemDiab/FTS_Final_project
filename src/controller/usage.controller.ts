import type { Request, Response, NextFunction } from "express";

import {
  getAccountUsageSummaryService,
  getAccountUsageHistoryService,
  getUserUsageSummaryService,
  getUserUsageHistoryService,
} from "../services/usage.service.js";

import { BadRequestError, UnauthorizedError } from "../errors/http-errors.js";

function asyncHandler(
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function getAccountId(res: Response): string {
  const accountId: unknown = res.locals.accountId;

  if (typeof accountId !== "string" || !accountId) {
    throw new UnauthorizedError();
  }

  return accountId;
}

function getOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${field} must be provided as a single value`);
  }

  return value;
}

function getOptionalInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }

  return parsed;
}

// GET /api/v1/usage?period=2026-10
export const getAccountUsageSummaryController = asyncHandler(
  async (req, res) => {
    const accountId = getAccountId(res);
    const period = getOptionalString(req.query.period, "period");

    const summary = await getAccountUsageSummaryService(accountId, period);

    res.status(200).json({
      success: true,
      data: summary,
    });
  },
);

// GET /api/v1/usage/history?page=1&limit=20
export const getAccountUsageHistoryController = asyncHandler(
  async (req, res) => {
    const accountId = getAccountId(res);

    const page = getOptionalInteger(req.query.page, "page");
    const limit = getOptionalInteger(req.query.limit, "limit");

    const history = await getAccountUsageHistoryService(accountId, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...history,
    });
  },
);

// GET /api/v1/users/:userId/usage?period=2026-10
export const getUserUsageSummaryController = asyncHandler(async (req, res) => {
  const accountId = getAccountId(res);
  const userId = req.params.userId;
  const period = getOptionalString(req.query.period, "period");

  const summary = await getUserUsageSummaryService(accountId, userId, period);

  res.status(200).json({
    success: true,
    data: summary,
  });
});

// GET /api/v1/users/:userId/usage/history?page=1&limit=20
export const getUserUsageHistoryController = asyncHandler(async (req, res) => {
  const accountId = getAccountId(res);
  const userId = req.params.userId;

  const page = getOptionalInteger(req.query.page, "page");
  const limit = getOptionalInteger(req.query.limit, "limit");

  const history = await getUserUsageHistoryService(accountId, userId, {
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    ...history,
  });
});
