// src/shared/errors/app-error.ts
export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "ACCOUNT_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "ACCOUNT_ALREADY_EXISTS"
  | "ACCOUNT_HAS_NO_PLAN"
  | "USER_HAS_NO_PLAN"
  | "PLAN_NOT_FOUND"
  | "PLAN_ALREADY_EXISTS"
  | "INVALID_PLAN_CONFIGURATION"
  | "CANNOT_MODIFY_PREDEFINED_PLAN"
  | "PLAN_TYPE_MISMATCH"
  | "PLAN_IN_USE"
  | "IDEMPOTENCY_KEY_REUSED"
  | "IDEMPOTENCY_KEY_INVALID"
  | "DUPLICATE_REQUEST_IN_PROGRESS"
  | "INVALID_MONTH"
  | "INVALID_DATE_RANGE"
  | "INVALID_PAGINATION";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}
