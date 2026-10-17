import { Request, Response } from "express";
import { getPlansQuery } from "../db/queries/plans.js";

export async function getPlans(req: Request, res: Response) {
  // Fetch plans from the database
  const plans = await getPlansQuery();
  res.status(200).json({ message: "Get plans", data: plans });
}
