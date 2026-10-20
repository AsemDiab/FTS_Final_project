import { Router } from "express";

import {
  getAccountUsageSummaryController,
  getAccountUsageHistoryController,
} from "../controller/usage.controller.js";

import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { consumeController } from "../controller/consume.controller.js";
import { consumeValidationMiddleware } from "../middleware/consume-validation.middleware.js";

export const usageRouter = Router();

usageRouter.use(apiKeyAuth);

// Account-level usage
usageRouter.get("/history", getAccountUsageHistoryController);
usageRouter.get("/", getAccountUsageSummaryController);

usageRouter.post("/consume", consumeValidationMiddleware, consumeController);
export default usageRouter;
