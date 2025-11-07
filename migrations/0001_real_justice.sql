CREATE TYPE "public"."route_mode" AS ENUM('REGISTRATION', 'AUTHORIZATION');--> statement-breakpoint
CREATE TABLE "route" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"route_name" text NOT NULL,
	"route_description" text,
	"route_mode" "route_mode" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"organization_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;