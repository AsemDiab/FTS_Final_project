import { z } from "zod";
import { nameSchema, uuidSchema } from "./common.schema.js";

/** Admin provisioning. `planId` must reference a system/owned plan of type "account" (checked in the service). */
export const createAccountBody = z
  .object({
    name: nameSchema(255),
    planId: uuidSchema,
  })
  .strict();

export const accountIdParams = z.object({ accountId: uuidSchema }).strict();

export type CreateAccountBody = z.infer<typeof createAccountBody>;
export type AccountIdParams = z.infer<typeof accountIdParams>;
