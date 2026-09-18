CREATE TABLE "generated_reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"type" varchar(10) NOT NULL,
	"period_from" timestamp with time zone NOT NULL,
	"period_to" timestamp with time zone NOT NULL,
	"language" varchar(10) DEFAULT 'id-ID' NOT NULL,
	"content_markdown" text NOT NULL,
	"generated_by" varchar(36),
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "generated_reports_type_generated_idx" ON "generated_reports" USING btree ("type","generated_at");