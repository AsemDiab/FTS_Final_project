
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
import { accountsTable } from "./accounts.js";




export const apiKeysTable = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    keyHash: text("key_hash").notNull().unique(),

    keyPrefix: varchar("key_prefix", {
      length: 32,
    }).notNull(),

    accountId: uuid("account_id")
      .notNull()
      .references(() => accountsTable.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("api_keys_account_id_idx").on(
      table.accountId,
    ),
  ],
);
