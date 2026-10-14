CREATE TYPE "public"."plan_type" AS ENUM('account', 'user');--> statement-breakpoint
CREATE TYPE "public"."rejection_reason" AS ENUM('monthly_limit', 'per_request_limit');--> statement-breakpoint
CREATE TYPE "public"."rejection_scope" AS ENUM('account', 'user');--> statement-breakpoint
CREATE TYPE "public"."usage_outcome" AS ENUM('accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(32) NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "plan_type" NOT NULL,
	"monthly_limit" integer NOT NULL,
	"per_request_limit" integer NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"owner_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_monthly_limit_check" CHECK ("plans"."monthly_limit" >= 0),
	CONSTRAINT "plans_per_request_limit_check" CHECK ("plans"."per_request_limit" > 0),
	CONSTRAINT "plans_owner_check" CHECK (("plans"."is_system" = true AND "plans"."owner_account_id" IS NULL)
          OR
          ("plans"."is_system" = false AND "plans"."owner_account_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"api_key_id" uuid NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"request_hash" text NOT NULL,
	"requested_units" integer NOT NULL,
	"consumed_units" integer DEFAULT 0 NOT NULL,
	"outcome" "usage_outcome" NOT NULL,
	"rejection_scope" "rejection_scope",
	"rejection_reason" "rejection_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_account_request_unique" UNIQUE("account_id","request_id"),
	CONSTRAINT "usage_requested_units_positive" CHECK ("usage"."requested_units" > 0),
	CONSTRAINT "usage_consumed_units_nonnegative" CHECK ("usage"."consumed_units" >= 0),
	CONSTRAINT "usage_outcome_consistency" CHECK ((
        "usage"."outcome" = 'accepted'
        AND "usage"."consumed_units" = "usage"."requested_units"
        AND "usage"."rejection_scope" IS NULL
        AND "usage"."rejection_reason" IS NULL
      ) OR (
        "usage"."outcome" = 'rejected'
        AND "usage"."consumed_units" = 0
        AND "usage"."rejection_scope" IS NOT NULL
        AND "usage"."rejection_reason" IS NOT NULL
      ))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_account_user_unique" UNIQUE("account_id","id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_plan_id_idx" ON "accounts" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "api_keys_account_id_idx" ON "api_keys" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "plans_owner_account_idx" ON "plans" USING btree ("owner_account_id");--> statement-breakpoint
CREATE INDEX "usage_account_created_idx" ON "usage" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_user_created_idx" ON "usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "users_account_id_idx" ON "users" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "users_plan_id_idx" ON "users" USING btree ("plan_id");