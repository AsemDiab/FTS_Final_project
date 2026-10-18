import { db } from "../index.js";
import { accountsTable, Plan, plansTable } from "../schema.js";
import { eq, or, isNull } from "drizzle-orm";

export async function getPlansQuery(ownedByAccountId: string | null) {
  return db
    .select()
    .from(plansTable)
    .where(
      or(
        isNull(plansTable.ownerAccountId),
        ...(ownedByAccountId
          ? [eq(plansTable.ownerAccountId, ownedByAccountId)]
          : []),
      ),
    );
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

export async function getPlanByIdQuery(planId: string): Promise<any | null> {
  const plan = await db
    .select()
    .from(plansTable)
    .where(eq(plansTable.id, planId))
    .limit(1)
    .then((rows: Plan[]) => rows[0] || null);

  return plan;
}

export async function updatePlanQuery(
  planId: string,
  planData: Partial<Plan>,
): Promise<any | null> {
  const [updatedPlan] = await db
    .update(plansTable)
    .set(planData)
    .where(eq(plansTable.id, planId))
    .returning();
  return updatedPlan || null;
}

export async function deletePlanQuery(planId: string): Promise<boolean> {
  const deletedCount = await db
    .delete(plansTable)
    .where(eq(plansTable.id, planId))
    .execute();

  return deletedCount > 0;
}
