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
import { apiKeyAuth } from "../middleware/api-key-auth.js";

export const accountsRouter = router.Router();

accountsRouter.get("/", getAccountsContoller);
accountsRouter.post("/", adminAuth, createAccountController);

accountsRouter.get("/me", apiKeyAuth, getAccountByApiKeyController);
accountsRouter.get("/me/api-keys", apiKeyAuth, getAccountAPIKeysController);

accountsRouter.post("/me/api-keys", apiKeyAuth, createNewApiKeyController);
accountsRouter.delete(
  "/me/api-keys/:keyId",
  apiKeyAuth,
  revokeApiKeyController,
);
