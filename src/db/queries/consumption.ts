import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { usageTable } from "../schema.js";

type InsertConsumptionData = {
  accountId: string;
  userId: string;
  apiKeyId: string;
  requestId: string;
  requestHash: string;
  requestedUnits: number;
  consumedUnits: number;
  outcome: "accepted" | "rejected";
  rejectionScope: "account" | "user" | null;
  rejectionReason: "monthly_limit" | "per_request_limit" | null;
};

export async function insertConsumptionQuery(data: InsertConsumptionData) {
  const [consumption] = await db
    .insert(usageTable)
    .values({
      accountId: data.accountId,
      userId: data.userId,
      apiKeyId: data.apiKeyId,
      requestId: data.requestId,
      requestHash: data.requestHash,
      requestedUnits: data.requestedUnits,
      consumedUnits: data.consumedUnits,
      outcome: data.outcome,
      rejectionScope: data.rejectionScope,
      rejectionReason: data.rejectionReason,
    })
    .returning();

  return consumption;
}

export async function getConsumptionByRequestIdQuery(
  accountId: string,
  requestId: string,
) {
  const [consumption] = await db
    .select()
    .from(usageTable)
    .where(
      and(
        eq(usageTable.accountId, accountId),
        eq(usageTable.requestId, requestId),
      ),
    )
    .limit(1);

  return consumption ?? null;
}
