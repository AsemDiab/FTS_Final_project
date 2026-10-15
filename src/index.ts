import express, { Request, Response } from "express";
import { testConnection } from "./db/index.js";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("server worked correctly").status(200);
});
app.use(
  "/api/v1/accounts",
  (await import("./routes/accounts.route.js")).accountsRouter,
);
app.listen(8080, () => {
  console.log("Server running on port 8080");
  void testConnection();
});
