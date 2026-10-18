import { db } from "../db/index.js";
import { apiKeysTable } from "../db/schema.js";
import { eq, and, isNull, or, gt, desc } from "drizzle-orm";

export async function createApiKeyQuery(data: {
  keyHash: string;
  keyPrefix: string;
  accountId: string;
  expiresAt?: Date | null;
}) {
  const [apiKey] = await db
    .insert(apiKeysTable)
    .values({
      keyHash: data.keyHash,
      keyPrefix: data.keyPrefix,
      accountId: data.accountId,
      expiresAt: data.expiresAt ?? null,
    })
    .returning({
      id: apiKeysTable.id,
      keyPrefix: apiKeysTable.keyPrefix,
      accountId: apiKeysTable.accountId,
      createdAt: apiKeysTable.createdAt,
      expiresAt: apiKeysTable.expiresAt,
    });

  return apiKey;
}

export async function getApiKeyByHashQuery(keyHash: string) {
  const [apiKey] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, keyHash))
    .limit(1);

  return apiKey ?? null;
}

export async function getApiKeysByAccountIdQuery(accountId: string) {
  return db
    .select({
      id: apiKeysTable.id,
      keyPrefix: apiKeysTable.keyPrefix,
      accountId: apiKeysTable.accountId,
      createdAt: apiKeysTable.createdAt,
      expiresAt: apiKeysTable.expiresAt,
      revokedAt: apiKeysTable.revokedAt,
    })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.accountId, accountId))
    .orderBy(desc(apiKeysTable.createdAt));
}

export async function revokeApiKeyQuery(apiKeyId: string, accountId: string) {
  const [apiKey] = await db
    .update(apiKeysTable)
    .set({
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(apiKeysTable.id, apiKeyId),
        eq(apiKeysTable.accountId, accountId),
        isNull(apiKeysTable.revokedAt),
      ),
    )
    .returning({
      id: apiKeysTable.id,
      revokedAt: apiKeysTable.revokedAt,
    });

  return apiKey ?? null;
}

export async function revokeAllApiKeysQuery(accountId: string) {
  return db
    .update(apiKeysTable)
    .set({
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(apiKeysTable.accountId, accountId),
        isNull(apiKeysTable.revokedAt),
      ),
    )
    .returning({
      id: apiKeysTable.id,
      revokedAt: apiKeysTable.revokedAt,
    });
}

export async function getActiveApiKeysByAccountIdQuery(accountId: string) {
  const now = new Date();

  return db
    .select({
      id: apiKeysTable.id,
      keyPrefix: apiKeysTable.keyPrefix,
      createdAt: apiKeysTable.createdAt,
      expiresAt: apiKeysTable.expiresAt,
    })
    .from(apiKeysTable)
    .where(
      and(
        eq(apiKeysTable.accountId, accountId),
        isNull(apiKeysTable.revokedAt),
        or(isNull(apiKeysTable.expiresAt), gt(apiKeysTable.expiresAt, now)),
      ),
    )
    .orderBy(desc(apiKeysTable.createdAt));
}
