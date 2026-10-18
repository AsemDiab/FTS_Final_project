import router from "express";
import {
  createAccountController,
  createNewApiKeyController,
  getAccountAPIKeysController,
  getAccountByApiKeyController,
  getAccountsContoller,
  revokeApiKeyController,
} from "../controller/accounts.controller.js";
import { adminAuth } from "../middleware/AdminMiddleware.js";

export const accountsRouter = router.Router();

accountsRouter.get("/", getAccountsContoller);
accountsRouter.post("/", adminAuth, createAccountController);

accountsRouter.get("/me", getAccountByApiKeyController);
accountsRouter.get("/me/api-keys", getAccountAPIKeysController);

accountsRouter.post("/me/api-keys", createNewApiKeyController);
accountsRouter.delete("/me/api-keys/:keyId", revokeApiKeyController);
