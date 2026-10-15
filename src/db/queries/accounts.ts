import { db } from "../index.js";
import { accountsTable } from "../schema.js";

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
