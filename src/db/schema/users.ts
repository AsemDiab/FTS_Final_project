
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import { accountsTable } from "./accounts.js";
import { plansTable } from "./plans.js";




export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 255 }).notNull(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accountsTable.id, {
        onDelete: "cascade",
      }),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plansTable.id, {
        onDelete: "restrict",
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
    index("users_account_id_idx").on(table.accountId),
    index("users_plan_id_idx").on(table.planId),

    unique("users_account_user_unique").on(
      table.accountId,
      table.id,
    ),
  ],
);
