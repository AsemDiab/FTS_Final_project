import express, { Request, Response } from "express";
import { testConnection } from "./db/index.js";
import { errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("server worked correctly").status(200);
});
app.use(
  "/api/v1/accounts",
  (await import("./routes/accounts.route.js")).accountsRouter,
);
app.use("/api/v1/plans", (await import("./routes/plans.route.js")).plansRouter);
app.use("/api/v1/users", (await import("./routes/users.routes.js")).userRouter);
app.use(errorHandler);
app.listen(8080, () => {
  console.log("Server running on port 8080");
  void testConnection();
});
