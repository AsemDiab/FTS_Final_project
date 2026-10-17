import { z } from "zod";

/** Postgres `integer` upper bound. Limits and units are stored as int4. */
export const INT4_MAX = 2_147_483_647;

export const uuidSchema = z.string().uuid("Must be a valid UUID");

/** Trimmed, non-empty string with a max length matching the DB column. */
export const nameSchema = (max: number) =>
  z.string().trim().min(1, "Must not be empty").max(max, `Must be at most ${max} characters`);

/** Calendar month in `YYYY-MM` format. */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected format YYYY-MM");

/** Positive integer that fits in Postgres int4. */
export const positiveInt = z.number().int("Must be an integer").min(1, "Must be at least 1").max(INT4_MAX);

/** Non-negative integer that fits in Postgres int4. */
export const nonNegativeInt = z.number().int("Must be an integer").min(0, "Must not be negative").max(INT4_MAX);

/**
 * Query-string integer. Only plain digits are accepted ("10", not "10abc", "1e3", " 5 "),
 * so malformed input is rejected instead of silently coerced.
 */
export const queryInt = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/, "Must be a non-negative integer")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export const paginationQuery = {
  /** Optional; the service applies DEFAULT_PAGE_SIZE when omitted. */
  limit: queryInt(1, MAX_PAGE_SIZE).optional(),
  cursor: z.string().min(1).max(512).optional(),
};
