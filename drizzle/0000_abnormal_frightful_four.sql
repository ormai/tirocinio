CREATE TABLE "assignments" (
	"student_id" integer,
	"structure_id" integer,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	CONSTRAINT "assignments_student_id_structure_id_pk" PRIMARY KEY("student_id","structure_id")
);
--> statement-breakpoint
CREATE TABLE "capacities" (
	"structure_id" integer,
	"year" integer,
	"capacity" integer NOT NULL,
	CONSTRAINT "capacities_structure_id_year_pk" PRIMARY KEY("structure_id","year")
);
--> statement-breakpoint
CREATE TABLE "preference_collection_intervals" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"duration_months" smallint NOT NULL,
	"number_of_preferences" smallint NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"student_id" integer,
	"collection_id" integer,
	"site_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"month" smallint NOT NULL,
	"weight" smallint NOT NULL,
	CONSTRAINT "preferences_student_id_collection_id_site_id_pk" PRIMARY KEY("student_id","collection_id","site_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" integer NOT NULL,
	"expires_at" timestamp DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 hours' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	CONSTRAINT "sites_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"ward" varchar(255),
	"area" varchar(255),
	"kind" varchar(255),
	"site_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer,
	"email" varchar NOT NULL,
	"encoded_password" varchar(380) NOT NULL,
	"name" varchar(255),
	"surname" varchar(255),
	"enrollment_year" smallint,
	"outstanding_otp" smallint,
	"outstanding_otp_expires_at" timestamp,
	"role" text DEFAULT 'student' NOT NULL,
	CONSTRAINT "users_number_unique" UNIQUE("number"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_structure_id_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacities" ADD CONSTRAINT "capacities_structure_id_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_collection_id_preference_collection_intervals_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."preference_collection_intervals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structures" ADD CONSTRAINT "structures_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_index" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "number_index" ON "users" USING btree ("number");