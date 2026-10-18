CREATE TABLE "account_workspaces" (
	"user_id" text PRIMARY KEY,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
