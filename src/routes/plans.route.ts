import { Router } from "express";
import { getPlans } from "../controller/plans.controller.js";

export const plansRouter = Router();
plansRouter.get("/", getPlans);
