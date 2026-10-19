import express, { Request, Response } from "express";
import { testConnection } from "./db/index.js";
import { errorHandler } from "./middleware/ErrorHandler.js";
import { accountsRouter } from "./routes/accounts.route.js";
import { plansRouter } from "./routes/plans.route.js";
import { userRouter } from "./routes/users.routes.js";
import { usageRouter } from "./routes/usage.route.js";
const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("server worked correctly").status(200);
});
app.use("/api/v1/accounts", accountsRouter);
app.use("/api/v1/plans", plansRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/usage", usageRouter);

app.use(errorHandler);
app.listen(8080, () => {
  console.log("Server running on port 8080");
  void testConnection();
});
