import { Router } from "express";
import {
  changeUserPlan,
  createUser,
  getUserById,
  getUsers,
} from "../controller/users.controller.js";

/*
Method	Endpoint	Purpose
POST	/api/v1/users	Register a user under the authenticated account
GET	/api/v1/users	List users belonging to the account
GET	/api/v1/users/:userId	Get a user's details and assigned plan
PATCH	/api/v1/users/:userId/plan	Change the user's plan
GET	/api/v1/users/:userId/usage	Get the user's usage and remaining quota

*/

export const userRouter = Router();

userRouter.post("/", createUser);

userRouter.get("/", getUsers);

userRouter.get("/:userId", getUserById);

userRouter.patch("/:userId/plan", changeUserPlan);

// userRouter.get("/:userId/usage", getUserUsage);
