CREATE TABLE "report_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"channel" varchar(10) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"status" varchar(10) NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "report_deliveries_report_idx" ON "report_deliveries" USING btree ("report_id","created_at");