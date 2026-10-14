
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";


export const planTypeEnum = pgEnum("plan_type", [
  "account",
  "user",
]);

export const usageOutcomeEnum = pgEnum("usage_outcome", [
  "accepted",
  "rejected",
]);

export const rejectionScopeEnum = pgEnum("rejection_scope", [
  "account",
  "user",
]);

export const rejectionReasonEnum = pgEnum("rejection_reason", [
  "monthly_limit",
  "per_request_limit",
]);


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


export const accountsTable = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 255 }).notNull(),

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
    index("accounts_plan_id_idx").on(table.planId),
  ],
);


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
