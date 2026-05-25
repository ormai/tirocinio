ALTER TABLE "capacities" DROP CONSTRAINT "capacities_structure_id_structures_id_fk";
--> statement-breakpoint
ALTER TABLE "capacities" ADD CONSTRAINT "capacities_structure_id_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."structures"("id") ON DELETE cascade ON UPDATE no action;