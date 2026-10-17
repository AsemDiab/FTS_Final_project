import { db } from "../index.js";
import { accountsTable, plansTable } from "../schema.js";
import { eq, or } from "drizzle-orm";
export async function getPlansQuery(
  ownedByAccountId: string | null,
): Promise<any[]> {
  const plans = await db
    .select()
    .from(plansTable)
    .where(
      or(
        eq(plansTable.ownerAccountId, ownedByAccountId),
        eq(plansTable.isSystem, true),
      ),
    );

  return plans;
}

export async function createPlanQuery(planData: any): Promise<any> {
  const ownerAccountId = planData.ownerAccountId ?? null;
  const isSystem = ownerAccountId === null || ownerAccountId === undefined;
  const [newPlan] = await db
    .insert(plansTable)
    .values({ ...planData, ownerAccountId, isSystem })
    .returning();
  return newPlan;
}
