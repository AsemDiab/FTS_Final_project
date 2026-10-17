import { z } from "zod";
import { usageOutcomeEnum } from "../db/schema/enums.js";
import { monthSchema, paginationQuery, uuidSchema } from "./common.schema.js";

/** Summary for a month (defaults to the current month in the service when omitted). */
export const usageSummaryQuery = z
  .object({
    month: monthSchema.optional(),
    userId: uuidSchema.optional(),
  })
  .strict();

export const usageHistoryQuery = z
  .object({
    userId: uuidSchema.optional(),
    outcome: z.enum(usageOutcomeEnum.enumValues).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    ...paginationQuery,
  })
  .strict()
  .refine((q) => !q.from || !q.to || new Date(q.from) <= new Date(q.to), {
    path: ["from"],
    message: "Must not be after `to`",
  });

export type UsageSummaryQuery = z.infer<typeof usageSummaryQuery>;
export type UsageHistoryQuery = z.infer<typeof usageHistoryQuery>;
