ALTER TABLE "preferences" DROP CONSTRAINT "preferences_student_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;