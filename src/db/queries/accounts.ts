import { db } from "../index.js";
import { accountsTable } from "../schema.js";
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
