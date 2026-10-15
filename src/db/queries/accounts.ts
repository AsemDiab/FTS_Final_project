import { db } from "../index.js";
import { accountsTable } from "../schema.js";

export async function getAccountsQuery(): Promise<any[]> {
  const accounts = await db.select().from(accountsTable);
  return accounts;
}
