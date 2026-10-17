import { z } from "zod";
import { planTypeEnum } from "../db/schema/enums.js";
import {
  nameSchema,
  nonNegativeInt,
  positiveInt,
  uuidSchema,
} from "./common.schema.js";

export const createPlanBody = z
  .object({
    name: nameSchema(100),
    type: z.enum(planTypeEnum.enumValues),
    monthlyLimit: nonNegativeInt,
    perRequestLimit: positiveInt,
    ownerAccountId: uuidSchema.optional(),
  })
  .strict()
  .refine((p) => p.monthlyLimit === 0 || p.perRequestLimit <= p.monthlyLimit, {
    path: ["perRequestLimit"],
    message: "Must not exceed monthlyLimit",
  });

export const planIdParams = z.object({ planId: uuidSchema }).strict();

export const listPlansQuery = z
  .object({ type: z.enum(planTypeEnum.enumValues).optional() })
  .strict();

export type CreatePlanBody = z.infer<typeof createPlanBody>;
export type PlanIdParams = z.infer<typeof planIdParams>;
export type ListPlansQuery = z.infer<typeof listPlansQuery>;
