import express from "express";
import { errorHandler } from "./middleware/ErrorHandler.js";
import { accountsRouter } from "./routes/accounts.route.js";
import { plansRouter } from "./routes/plans.route.js";
import { userRouter } from "./routes/users.routes.js";
import { usageRouter } from "./routes/usage.route.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send("server worked correctly");
});

app.use("/api/v1/accounts", accountsRouter);
app.use("/api/v1/plans", plansRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/usage", usageRouter);

app.use(errorHandler);

export default app;
