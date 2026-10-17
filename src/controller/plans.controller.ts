import { Request, Response } from "express";
import { createPlanQuery, getPlansQuery } from "../db/queries/plans.js";
import { createPlanBody } from "../validation/plans.schema.js";

export async function getPlans(req: Request, res: Response) {
  const ownedByAccountId = req.query.ownedByAccountId ?? ("" as string | null);
  // Fetch plans from the database
  const plans = await getPlansQuery(ownedByAccountId);
  res.status(200).json({ message: "Get plans", data: plans });
}

export async function createPlan(req: Request, res: Response) {
  const data = req.body;
  const validatedData = createPlanBody.parse(data);

  const newPlan = await createPlanQuery(validatedData);

  res.status(201).json({ message: "Plan created", data: newPlan });
}
