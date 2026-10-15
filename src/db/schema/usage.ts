
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import { apiKeysTable } from "./api-keys.js";
import { rejectionReasonEnum, rejectionScopeEnum, usageOutcomeEnum } from "./enums.js";






export const usageTable = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    accountId: uuid("account_id").notNull(),

    userId: uuid("user_id").notNull(),

    apiKeyId: uuid("api_key_id")
      .notNull()
      .references(() => apiKeysTable.id, {
        onDelete: "restrict",
      }),

    requestId: varchar("request_id", {
      length: 255,
    }).notNull(),

    requestHash: text("request_hash").notNull(),

    requestedUnits: integer("requested_units").notNull(),

    consumedUnits: integer("consumed_units")
      .notNull()
      .default(0),

    outcome: usageOutcomeEnum("outcome").notNull(),

    rejectionScope: rejectionScopeEnum(
      "rejection_scope",
    ),

    rejectionReason: rejectionReasonEnum(
      "rejection_reason",
    ),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("usage_account_request_unique").on(
      table.accountId,
      table.requestId,
    ),


    check(
      "usage_requested_units_positive",
      sql`${table.requestedUnits} > 0`,
    ),

    check(
      "usage_consumed_units_nonnegative",
      sql`${table.consumedUnits} >= 0`,
    ),

    check(
      "usage_outcome_consistency",
      sql`(
        ${table.outcome} = 'accepted'
        AND ${table.consumedUnits} = ${table.requestedUnits}
        AND ${table.rejectionScope} IS NULL
        AND ${table.rejectionReason} IS NULL
      ) OR (
        ${table.outcome} = 'rejected'
        AND ${table.consumedUnits} = 0
        AND ${table.rejectionScope} IS NOT NULL
        AND ${table.rejectionReason} IS NOT NULL
      )`,
    ),

    index("usage_account_created_idx").on(
      table.accountId,
      table.createdAt,
    ),

    index("usage_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);
