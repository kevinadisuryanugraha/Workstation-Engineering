CREATE TABLE "incident_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"incident_id" varchar(36) NOT NULL,
	"type" varchar(15) NOT NULL,
	"message" varchar(500) NOT NULL,
	"actor_name" varchar(150) NOT NULL,
	"actor_user_id" varchar(36),
	"correlation_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "incident_events_incident_created_idx" ON "incident_events" USING btree ("incident_id","created_at");