
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  check,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import { planTypeEnum } from "./enums.js";
import { accountsTable } from "./accounts.js";

export const plansTable = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 100 }).notNull(),

    type: planTypeEnum("type").notNull(),

    monthlyLimit: integer("monthly_limit").notNull(),

    perRequestLimit: integer("per_request_limit").notNull(),

    isSystem: boolean("is_system")
      .notNull()
      .default(false),

    ownerAccountId: uuid("owner_account_id")
      .references(() => accountsTable.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "plans_monthly_limit_check",
      sql`${table.monthlyLimit} >= 0`,
    ),

    check(
      "plans_per_request_limit_check",
      sql`${table.perRequestLimit} > 0`,
    ),

    check(
      "plans_owner_check",
      sql`(${table.isSystem} = true AND ${table.ownerAccountId} IS NULL)
          OR
          (${table.isSystem} = false AND ${table.ownerAccountId} IS NOT NULL)`,
    ),

    index("plans_owner_account_idx").on(
      table.ownerAccountId,
    ),
  ],
);
