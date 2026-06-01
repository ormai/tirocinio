ALTER TABLE "preferences" DROP CONSTRAINT "preferences_collection_id_preference_collection_intervals_id_fk";
--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_collection_id_preference_collection_intervals_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."preference_collection_intervals"("id") ON DELETE cascade ON UPDATE no action;