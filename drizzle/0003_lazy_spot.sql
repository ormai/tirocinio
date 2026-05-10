ALTER TABLE "users" ADD COLUMN "new_email" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mfa_secret" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "mfa_secret" ON "users" USING btree ("number");