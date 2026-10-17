// src/shared/errors/http-errors.ts
import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  constructor(message = "Malformed request", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Missing or invalid API key") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Operation not permitted") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(
    code:
      | "NOT_FOUND"
      | "USER_NOT_FOUND"
      | "PLAN_NOT_FOUND"
      | "ACCOUNT_NOT_FOUND" = "NOT_FOUND",
    message = "Resource not found",
  ) {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(
    code:
      | "CONFLICT"
      | "USER_ALREADY_EXISTS"
      | "ACCOUNT_ALREADY_EXISTS"
      | "PLAN_ALREADY_EXISTS"
      | "ACCOUNT_HAS_NO_PLAN"
      | "USER_HAS_NO_PLAN"
      | "PLAN_IN_USE"
      | "DUPLICATE_REQUEST_IN_PROGRESS" = "CONFLICT",
    message = "Resource conflict",
    details?: unknown,
  ) {
    super(409, code, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    details: { field: string; message: string }[],
    code:
      | "VALIDATION_ERROR"
      | "INVALID_PLAN_CONFIGURATION"
      | "PLAN_TYPE_MISMATCH"
      | "IDEMPOTENCY_KEY_INVALID"
      | "INVALID_MONTH"
      | "INVALID_DATE_RANGE"
      | "INVALID_PAGINATION" = "VALIDATION_ERROR",
    message = "Request validation failed",
  ) {
    super(422, code, message, details);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Too many requests") {
    super(429, "RATE_LIMITED", message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(503, "SERVICE_UNAVAILABLE", message);
  }
}
