import { Request, Response } from "express";
import { getAccountsQuery } from "../db/queries/accounts.js";

export async function getAccountsContoller(req: Request, res: Response) {
  const accounts = await getAccountsQuery();
  res.status(200).json({ message: "Get accounts", data: accounts });
}
