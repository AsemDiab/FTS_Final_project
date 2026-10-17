// src/middleware/error-handler.ts
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { translateDbError } from "../errors/db-errors.js";

export const errorHandler: ErrorRequestHandler = (raw, req, res, next) => {
  if (res.headersSent) return next(raw);

  let err: unknown = raw;

  // body-parser errors
  if ((raw as any)?.type === "entity.parse.failed") {
    err = new AppError(400, "BAD_REQUEST", "Malformed JSON");
  } else if ((raw as any)?.type === "entity.too.large") {
    err = new AppError(413, "PAYLOAD_TOO_LARGE", "Request body too large");
  } else if (
    (raw as any)?.type === "charset.unsupported" ||
    (raw as any)?.type === "encoding.unsupported"
  ) {
    err = new AppError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Unsupported content type",
    );
  } else if (raw instanceof ZodError) {
    err = new AppError(
      422,
      "VALIDATION_ERROR",
      "Request validation failed",
      raw.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    );
  } else {
    err = translateDbError(raw);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
  }

  console.error("Unhandled request error", raw); // swap for your logger
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
