import { db } from "../index.js";
import { accountsTable, usersTable } from "../schema.js";
import { eq } from "drizzle-orm";
export async function getAccountsQuery(): Promise<any[]> {
  const accounts = await db.select().from(accountsTable);
  return accounts;
}

export async function createAccountQuery(data: {
  name: string;
  planId: string;
}): Promise<any> {
  const [newAccount] = await db.insert(accountsTable).values(data).returning();
  return newAccount;
}

export async function getAccountByIdQuery(accountID: string) {
  const [account] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, accountID))
    .limit(1);
  return account || null;
}

export async function isUserInAccountQuery(
  accountId: string,
  userId: string,
): Promise<boolean> {
  console.log(accountId);
  console.log(userId);
  const [users] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.accountId, accountId.trim()))
    .limit(1);
  if (!users) {
    return false;
  }
  const userIds = users.id || [];
  console.log("userIds: ", userIds);
  return userIds.includes(userId);
}

export async function getAccountPlanQuery(accountId: string): Promise<any> {
  const [account] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, accountId))
    .limit(1);
  return account ? account.planId : null;
}
