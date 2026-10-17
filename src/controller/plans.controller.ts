import { Request, Response } from "express";
import {
  createPlanQuery,
  deletePlanQuery,
  getPlanByIdQuery,
  getPlansQuery,
  updatePlanQuery,
} from "../db/queries/plans.js";
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

export async function getPlanById(req: Request, res: Response) {
  const planId = req.params.planId;
  const plan = await getPlanByIdQuery(planId);
  res.status(200).json({ message: "Get plan by ID", data: plan });
}

export async function updatePlan(req: Request, res: Response) {
  const planId = req.params.planId;
  const data = req.body;

  const updatedPlan = await updatePlanQuery(planId, data);
  res.status(200).json({ message: "Plan updated", data: updatedPlan });
}

export async function deletePlan(req: Request, res: Response) {
  const planId = req.params.planId;
  const deleted = await deletePlanQuery(planId);
  res.status(200).json({ message: "Plan deleted", data: { deleted } });
}
