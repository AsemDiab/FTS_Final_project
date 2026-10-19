// src/middleware/api-key-auth.ts

import { createHash } from "node:crypto";
import type { RequestHandler } from "express";

import { UnauthorizedError } from "../errors/http-errors.js";
import { getAccountIDByApiKeyQuery } from "../db/queries/apiKeys.js";

export const apiKeyAuth: RequestHandler = async (req, res, next) => {
  console.log(
    "API Key Auth Middleware: Checking for API key in request headers...",
    req.headers,
  );
  const apiKey = req.header("x-api-key");
  console.log("API Key Auth Middleware: API key found:", apiKey);
  if (!apiKey) {
    throw new UnauthorizedError();
  }

  const accountId = await getAccountIDByApiKeyQuery(apiKey);

  if (!accountId) {
    throw new UnauthorizedError("Invalid API key provided");
  }

  // The authenticated account ID is trusted by downstream handlers.
  res.locals.accountId = accountId;

  next();
};
