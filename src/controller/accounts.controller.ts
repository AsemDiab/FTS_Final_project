import { Request, Response } from "express";
import { getAccountsQuery } from "../db/queries/accounts.js";
import { BadRequestError, NotFoundError } from "../errors/http-errors.js";
import {
  createAccountService,
  createNewApiKeyService,
  getAccountByApiKeyService,
  getAPIKeysService,
  revokeApiKeyService,
} from "../services/account.service.js";
import { generateApiKey } from "../utils/api-key.js";
import { createApiKeyQuery } from "../db/queries/apiKeys.js";

export async function getAccountsContoller(req: Request, res: Response) {
  const accounts = await getAccountsQuery();
  res.status(200).json({ message: "Get accounts", data: accounts });
}

export async function createAccountController(req: Request, res: Response) {
  const { name, planId } = req.body;
  // Validate input
  if (!name || !planId) {
    throw new BadRequestError("Name and planId are required");
  }

  // Create new account
  const newAccount = await createAccountService({ name, planId });
  res.status(201).json({ message: "Account created", data: newAccount });
}

export async function getAccountByApiKeyController(
  req: Request,
  res: Response,
) {
  console.log("Received request to get account by API key", req.headers);
  const apiKey = req.get("x-api-key");
  console.log("API Key received:", apiKey);
  if (!apiKey) {
    throw new BadRequestError("API key is required");
  }

  const account = await getAccountByApiKeyService(apiKey);
  console.log("Account found:", account);
  if (!account) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  res.status(200).json({ message: "Account found", data: account });
}

export async function getAccountAPIKeysController(req: Request, res: Response) {
  const apiKey = req.get("x-api-key");
  if (!apiKey) {
    throw new BadRequestError("API key is required");
  }

  const keys = await getAPIKeysService(apiKey);

  if (!keys) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  res.status(200).json({ message: "API keys found", data: keys });
}

export async function createNewApiKeyController(req: Request, res: Response) {
  const apiKey = req.get("x-api-key");
  if (!apiKey) {
    throw new BadRequestError("API key is required");
  }

  const account = await getAccountByApiKeyService(apiKey);
  if (!account) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  const data = await createNewApiKeyService(account.id);
  res.status(201).json({ message: "API key created", data });
}

export async function revokeApiKeyController(req: Request, res: Response) {
  const apiKey = req.get("x-api-key");
  if (!apiKey) {
    throw new BadRequestError("API key is required");
  }

  const account = await getAccountByApiKeyService(apiKey);
  if (!account) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  const { keyId } = req.params;
  await revokeApiKeyService(keyId, account.id);
  res.status(200).json({ message: "API key revoked" });
}
