import { Router } from "express";
import {
  changeUserPlan,
  createUser,
  getUserById,
  getUsers,
  getUserUsage,
} from "../controller/users.controller.js";
import {
  getUserUsageHistoryController,
  getUserUsageSummaryController,
} from "../controller/usage.controller.js";
import { apiKeyAuth } from "../middleware/api-key-auth.js";

export const userRouter = Router();

userRouter.post("/", createUser);

userRouter.get("/", getUsers);

userRouter.get("/:userId", getUserById);

userRouter.patch("/:userId/plan", changeUserPlan);

// Individual user usage
userRouter.get(
  "/:userId/usage/history",
  apiKeyAuth,
  getUserUsageHistoryController,
);

userRouter.get("/:userId/usage", apiKeyAuth, getUserUsageSummaryController);
