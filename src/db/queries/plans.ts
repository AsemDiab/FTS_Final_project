import { db } from "../index.js";
import { accountsTable, plansTable } from "../schema.js";

export async function getPlansQuery(): Promise<any[]> {
  const plans = await db.select().from(plansTable);
  return plans;
}
