import {pgEnum} from "drizzle-orm/pg-core";

export const planTypeEnum = pgEnum("plan_type", [
  "account",
  "user",
]);

export const usageOutcomeEnum = pgEnum("usage_outcome", [
  "accepted",
  "rejected",
]);

export const rejectionScopeEnum = pgEnum("rejection_scope", [
  "account",
  "user",
]);

export const rejectionReasonEnum = pgEnum("rejection_reason", [
  "monthly_limit",
  "per_request_limit",
]);
