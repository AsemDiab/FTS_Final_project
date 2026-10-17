import { Router } from "express";
import { getPlans, createPlan } from "../controller/plans.controller.js";

export const plansRouter = Router();

plansRouter.get("/", getPlans);
plansRouter.post("/", createPlan); // Assuming you have a createPlan function in your controller
