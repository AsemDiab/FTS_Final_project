import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { UnauthorizedError } from "../errors/http-errors.js";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header("X-Admin-Key");
  const adminApiKey = config.api.adminKey;

  if (!adminApiKey) {
    console.error("ADMIN_API_KEY is not configured");
    return res.status(500).json({
      message: "Internal server error",
    });
  }

  if (!apiKey || apiKey !== adminApiKey) {
    throw new UnauthorizedError("Missing or invalid admin API key");
  }

  next();
}
