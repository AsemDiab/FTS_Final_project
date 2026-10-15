import router from "express";
import {
  createAccountController,
  getAccountsContoller,
} from "../controller/accounts.controller.js";

export const accountsRouter = router.Router();

accountsRouter.get("/", getAccountsContoller);
accountsRouter.post("/", createAccountController);
