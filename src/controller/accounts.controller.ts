import { Request, Response } from "express";
import {
  createAccountQuery,
  getAccountsQuery,
} from "../db/queries/accounts.js";

export async function getAccountsContoller(req: Request, res: Response) {
  const accounts = await getAccountsQuery();
  res.status(200).json({ message: "Get accounts", data: accounts });
}

export async function createAccountController(req: Request, res: Response) {
  const { name, planId } = req.body;
  // Validate input
  if (!name) {
    return res.status(400).json({ message: "Name and planId are required" });
  }

  // Create new account
  const newAccount = await createAccountQuery({ name, planId });
  res.status(201).json({ message: "Account created", data: newAccount });
}
