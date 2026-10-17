import { Router } from "express";
import {
  getPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controller/plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/", getPlans);
plansRouter.post("/", createPlan);
plansRouter.get("/:planId", getPlanById);
plansRouter.put("/:planId", updatePlan);
plansRouter.delete("/:planId", deletePlan);
