import router from "express";
import { getAccountsContoller } from "../controller/accounts.controller.js";

export const accountsRouter = router.Router();

accountsRouter.get("/", getAccountsContoller);
