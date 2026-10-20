import type { Request, Response, NextFunction } from "express";
import { consumeService } from "../services/consume.service.js";
import { getAccountId } from "./usage.controller.js";
import { getAccountByIdQuery } from "../db/queries/accounts.js";
import { UnauthorizedError } from "../errors/http-errors.js";
import { getApiKeyByHashQuery } from "../db/queries/apiKeys.js";
import { createHash } from "node:crypto";

export async function consumeController(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, requestId, units } = req.body;

  // These values must be set by your API key authentication middleware.
  const accountId = getAccountId(req);
  if (!accountId) throw new UnauthorizedError();
  const apiKeyRecord = await getApiKeyByHashQuery(
    createHash("sha256").update(req.header("x-api-key")).digest("hex"),
  );

  if (!apiKeyRecord) throw new UnauthorizedError();

  const result = await consumeService(
    accountId,
    apiKeyRecord.id,
    userId,
    requestId,
    units,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}
