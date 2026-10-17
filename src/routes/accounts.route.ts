import router from "express";
import {
  createAccountController,
  getAccountsContoller,
} from "../controller/accounts.controller.js";
import { adminAuth } from "../middleware/AdminMiddleware.js";

export const accountsRouter = router.Router();

accountsRouter.get("/", getAccountsContoller);
accountsRouter.post("/", adminAuth, createAccountController);
