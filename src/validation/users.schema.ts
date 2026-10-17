import { z } from "zod";
import { nameSchema, uuidSchema } from "./common.schema.js";

/**
 * No `accountId` here: the account always comes from the authenticated API key.
 * `planId` must be a plan of type "user" visible to that account (checked in the service).
 */
export const createUserBody = z
  .object({
    name: nameSchema(255),
    planId: uuidSchema,
  })
  .strict();

export const assignUserPlanBody = z.object({ planId: uuidSchema }).strict();

export const userIdParams = z.object({ userId: uuidSchema }).strict();

export type CreateUserBody = z.infer<typeof createUserBody>;
export type AssignUserPlanBody = z.infer<typeof assignUserPlanBody>;
export type UserIdParams = z.infer<typeof userIdParams>;
