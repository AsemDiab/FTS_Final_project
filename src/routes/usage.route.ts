import { Router } from "express";

import {
  getAccountUsageSummaryController,
  getAccountUsageHistoryController,
} from "../controller/usage.controller.js";

import { apiKeyAuth } from "../middleware/api-key-auth.js";

export const usageRouter = Router();

usageRouter.use(apiKeyAuth);

// Account-level usage
usageRouter.get("/history", getAccountUsageHistoryController);
usageRouter.get("/", getAccountUsageSummaryController);

export default usageRouter;
