// src/shared/errors/domain-errors.ts
import { ConflictError, ForbiddenError } from "./http-errors.js";

export class IdempotencyKeyReusedError extends ConflictError {
  constructor() {
    super("CONFLICT", "Request ID reused with different input");
    // override code: keep the specific one
    Object.defineProperty(this, "code", { value: "IDEMPOTENCY_KEY_REUSED" });
  }
}

export class PredefinedPlanError extends ForbiddenError {
  constructor() {
    super("Predefined plans are read-only");
    Object.defineProperty(this, "code", {
      value: "CANNOT_MODIFY_PREDEFINED_PLAN",
    });
  }
}
