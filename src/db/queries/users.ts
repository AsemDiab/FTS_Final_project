import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { usersTable } from "../schema/users.js";

// Create a user under an account.
export async function insertUser(data: {
  accountId: string;
  name: string;
  planId: string;
}) {
  const [user] = await db
    .insert(usersTable)
    .values({
      accountId: data.accountId,
      name: data.name,
      planId: data.planId,
    })
    .returning();

  return user;
}

// List users belonging to an account.
export async function findUsersByAccountId(accountId: string) {
  return db
    .select()
    .from(usersTable)
    .where(eq(usersTable.accountId, accountId))
    .orderBy(usersTable.createdAt);
}

// Find one user belonging to an account.
export async function findUserById(accountId: string, userId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.accountId, accountId), eq(usersTable.id, userId)))
    .limit(1);

  return user ?? null;
}

// Update a user's assigned plan within an account.
export async function updateUserPlan(
  accountId: string,
  userId: string,
  planId: string,
) {
  const [user] = await db
    .update(usersTable)
    .set({ planId })
    .where(and(eq(usersTable.accountId, accountId), eq(usersTable.id, userId)))
    .returning();

  return user ?? null;
}

export async function getUserPlanQuery(userId: string) {
  const [user] = await db
    .select({ planId: usersTable.planId })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user?.planId ?? null;
}
