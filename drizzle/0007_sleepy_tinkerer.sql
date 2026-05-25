ALTER TABLE "assignments" ALTER COLUMN "year" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "capacities" ALTER COLUMN "year" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "preference_collection_intervals" ALTER COLUMN "year" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "structures" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "structure_name" ON "structures" USING btree ("name");--> statement-breakpoint
ALTER TABLE "structures" ADD CONSTRAINT "structures_name_unique" UNIQUE("name");