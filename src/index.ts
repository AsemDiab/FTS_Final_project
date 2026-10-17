import express, { Request, Response } from "express";
import { testConnection } from "./db/index.js";
import { errorHandler } from "./middleware/ErrorHandler.js";
import { AppError } from "./errors/app-error.js";
import { IdempotencyKeyReusedError } from "./errors/domain-errors.js";
import { RateLimitedError } from "./errors/http-errors.js";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("server worked correctly").status(200);
});
app.use(
  "/api/v1/accounts",
  (await import("./routes/accounts.route.js")).accountsRouter,
);

app.use(errorHandler);
app.listen(8080, () => {
  console.log("Server running on port 8080");
  void testConnection();
});
