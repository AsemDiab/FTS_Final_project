import { z } from "zod";
import { positiveInt, uuidSchema } from "./common.schema.js";

/** `usage.request_id` is varchar(255). Control characters are rejected. */
export const requestIdSchema = z
  .string()
  .trim()
  .min(1, "Must not be empty")
  .max(255, "Must be at most 255 characters")
  .regex(/^[^\x00-\x1F\x7F]+$/, "Must not contain control characters");

/**
 * POST /usage/consume
 * `units` must be a positive integer (usage.requested_units > 0, int4).
 * `accountId` is not accepted; it is derived from the API key.
 */
export const consumeBody = z
  .object({
    userId: uuidSchema,
    requestId: requestIdSchema,
    units: positiveInt,
  })
  .strict();

export type ConsumeBody = z.infer<typeof consumeBody>;
