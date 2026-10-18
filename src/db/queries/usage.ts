import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "../index.js";
import { usageTable } from "../schema/usage.js";

// 1. Create a usage history record
export async function createUsageQuery(data: typeof usageTable.$inferInsert) {
  const [usage] = await db.insert(usageTable).values(data).returning();

  return usage;
}

// 2. Find a request by account and request ID
// Used to check idempotency before processing a retry.
export async function getUsageByRequestIdQuery(
  accountId: string,
  requestId: string,
) {
  const [usage] = await db
    .select()
    .from(usageTable)
    .where(
      and(
        eq(usageTable.accountId, accountId),
        eq(usageTable.requestId, requestId),
      ),
    )
    .limit(1);

  return usage ?? null;
}

// 3. Find a usage record by ID within an account
export async function getUsageByIdQuery(accountId: string, usageId: string) {
  const [usage] = await db
    .select()
    .from(usageTable)
    .where(and(eq(usageTable.accountId, accountId), eq(usageTable.id, usageId)))
    .limit(1);

  return usage ?? null;
}

// 4. Get usage history for an account
export async function getAccountUsageHistoryQuery(
  accountId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(usageTable)
    .where(eq(usageTable.accountId, accountId))
    .orderBy(desc(usageTable.createdAt), desc(usageTable.id))
    .limit(limit)
    .offset(offset);
}

// 5. Get usage history for a specific user
export async function getUserUsageHistoryQuery(
  accountId: string,
  userId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select()
    .from(usageTable)
    .where(
      and(eq(usageTable.accountId, accountId), eq(usageTable.userId, userId)),
    )
    .orderBy(desc(usageTable.createdAt), desc(usageTable.id))
    .limit(limit)
    .offset(offset);
}

// 6. Get account usage totals for a UTC calendar month
export async function getAccountMonthlyUsageQuery(
  accountId: string,
  monthStart: Date,
  nextMonthStart: Date,
) {
  const [result] = await db
    .select({
      requestedUnits: sql<number>`coalesce(sum(${usageTable.requestedUnits}), 0)::int`,
      consumedUnits: sql<number>`coalesce(sum(${usageTable.consumedUnits}), 0)::int`,
      acceptedRequests: sql<number>`count(*) filter (where ${usageTable.outcome} = 'accepted')::int`,
      rejectedRequests: sql<number>`count(*) filter (where ${usageTable.outcome} = 'rejected')::int`,
    })
    .from(usageTable)
    .where(
      and(
        eq(usageTable.accountId, accountId),
        gte(usageTable.createdAt, monthStart),
        lt(usageTable.createdAt, nextMonthStart),
      ),
    );

  return result;
}

// 7. Get user usage totals for a UTC calendar month
export async function getUserMonthlyUsageQuery(
  accountId: string,
  userId: string,
  monthStart: Date,
  nextMonthStart: Date,
) {
  const [result] = await db
    .select({
      requestedUnits: sql<number>`coalesce(sum(${usageTable.requestedUnits}), 0)::int`,
      consumedUnits: sql<number>`coalesce(sum(${usageTable.consumedUnits}), 0)::int`,
      acceptedRequests: sql<number>`count(*) filter (where ${usageTable.outcome} = 'accepted')::int`,
      rejectedRequests: sql<number>`count(*) filter (where ${usageTable.outcome} = 'rejected')::int`,
    })
    .from(usageTable)
    .where(
      and(
        eq(usageTable.accountId, accountId),
        eq(usageTable.userId, userId),
        gte(usageTable.createdAt, monthStart),
        lt(usageTable.createdAt, nextMonthStart),
      ),
    );

  return result;
}
