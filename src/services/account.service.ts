import {
  createAccountQuery,
  getAccountByIdQuery,
} from "../db/queries/accounts.js";
import {
  createApiKeyQuery,
  getAccountIDByApiKeyQuery,
  getApiKeysByAccountIdQuery,
  revokeApiKeyQuery,
} from "../db/queries/apiKeys.js";
import { getPlanByIdQuery } from "../db/queries/plans.js";
import { NotFoundError } from "../errors/http-errors.js";
import { generateApiKey } from "../utils/api-key.js";

export async function createAccountService(data: {
  name: string;
  planId: string;
}): Promise<any> {
  const { name, planId } = data;

  const plan = await getPlanByIdQuery(planId);
  if (!plan) {
    throw new NotFoundError("PLAN_NOT_FOUND", "Plan not found");
  }

  const newAccountData = { name, planId };
  const newAccount = await createAccountQuery(newAccountData);

  const { rawKey, keyHash } = generateApiKey();
  const apiKey = await createApiKeyQuery({
    keyHash,
    keyPrefix: rawKey.slice(0, 16),
    accountId: newAccount.id,
  });
  const accountWithPlan = {
    ...newAccount,
    plan,
    apiKey: { ...apiKey, rawKey },
  };

  return accountWithPlan;
}

export async function getAccountByApiKeyService(apiKey: string) {
  const accountID = await getAccountIDByApiKeyQuery(apiKey);
  console.log("Account ID retrieved:", accountID);
  if (!accountID) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  const account = await getAccountByIdQuery(accountID);
  console.log("Account retrieved:", account);
  if (!account) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }
  return account;
}

export async function getAPIKeysService(apiKey: string) {
  const accountID = await getAccountIDByApiKeyQuery(apiKey);
  if (!accountID) {
    throw new NotFoundError("ACCOUNT_NOT_FOUND", "Account not found");
  }

  const keys = await getApiKeysByAccountIdQuery(accountID);
  return keys;
}

export async function createNewApiKeyService(accountId: string) {
  const { rawKey, keyHash } = generateApiKey();
  const newApiKey = await createApiKeyQuery({
    keyHash,
    keyPrefix: rawKey.slice(0, 16),
    accountId,
  });
  return { ...newApiKey, rawKey };
}

export async function revokeApiKeyService(keyId: string, accountId: string) {
  await revokeApiKeyQuery(keyId, accountId);
}
