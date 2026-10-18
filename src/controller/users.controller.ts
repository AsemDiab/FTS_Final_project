import type { Request, Response } from "express";
import {
  changeUserPlanService,
  createUserService,
  getUserByIdService,
  getUsersService,
} from "../services/user.service.js";
import { BadRequestError } from "../errors/http-errors.js";

// POST /api/v1/users
export async function createUser(req: Request, res: Response): Promise<void> {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") {
    throw new BadRequestError("Missing or invalid API key");
  }
  const { name, planId } = req.body;

  const user = await createUserService({
    apiKey,
    name,
    planId,
  });

  res.status(201).json({
    message: "User created successfully",
    data: user,
  });
}

// GET /api/v1/users
export async function getUsers(req: Request, res: Response): Promise<void> {
  const accountId = req.body.accountId;

  console.log("Account ID retrieved from request:", accountId);
  if (!accountId) {
    throw new BadRequestError("Account ID is missing in the request");
  }
  const users = await getUsersService({
    accountId,
  });

  res.status(200).json({
    data: users,
  });
}

// GET /api/v1/users/:userId
export async function getUserById(req: Request, res: Response): Promise<void> {
  const accountId = req.body.accountId;
  const { userId } = req.params;

  const user = await getUserByIdService({
    accountId,
    userId,
  });

  res.status(200).json({
    data: user,
  });
}

// PATCH /api/v1/users/:userId/plan
export async function changeUserPlan(
  req: Request,
  res: Response,
): Promise<void> {
  const accountId = req.body.accountId;
  const { userId } = req.params;
  const { planId } = req.body;

  const user = await changeUserPlanService({
    accountId,
    userId,
    planId,
  });

  res.status(200).json({
    message: "User plan updated successfully",
    data: user,
  });
}

// // GET /api/v1/users/:userId/usage
// export async function getUserUsage(req: Request, res: Response): Promise<void> {
//   const accountId = req.accountId;
//   const { userId } = req.params;

//   const usage = await getUserUsageService({
//     accountId,
//     userId,
//   });

//   res.status(200).json({
//     data: usage,
//   });
// }
