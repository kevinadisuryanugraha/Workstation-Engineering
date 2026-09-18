CREATE TABLE "incidents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"code" varchar(15) NOT NULL,
	"title" varchar(200) NOT NULL,
	"severity" varchar(10) NOT NULL,
	"environment" varchar(20) NOT NULL,
	"server_name" varchar(150) DEFAULT '—' NOT NULL,
	"impact" varchar(500) NOT NULL,
	"commander_user_id" varchar(36),
	"commander_name" varchar(150) NOT NULL,
	"related_ticket_code" varchar(30),
	"runbook_url" varchar(255),
	"status" varchar(20) DEFAULT 'INVESTIGATING' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incidents_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_code_uq" ON "incidents" USING btree ("code");