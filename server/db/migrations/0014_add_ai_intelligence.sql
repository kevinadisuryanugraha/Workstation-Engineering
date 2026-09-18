CREATE TABLE "ai_recommendations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"snapshot_id" varchar(36) NOT NULL,
	"scan_ref" varchar(40) NOT NULL,
	"rec_ref" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"reason" text,
	"expected_impact" varchar(255),
	"effort_estimate" varchar(60),
	"affected_module" varchar(150),
	"confidence" double precision DEFAULT 0 NOT NULL,
	"converted_work_item_key" varchar(30)
);
--> statement-breakpoint
CREATE TABLE "ai_findings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"snapshot_id" varchar(36) NOT NULL,
	"scan_ref" varchar(40) NOT NULL,
	"finding_ref" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(40) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"confidence" double precision DEFAULT 0 NOT NULL,
	"affected_file" varchar(255),
	"evidence" text,
	"impact" text,
	"suggested_remediation" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_scans" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"scan_ref" varchar(40) NOT NULL,
	"project_id" varchar(36),
	"mode" varchar(25) NOT NULL,
	"model" varchar(50) NOT NULL,
	"project_name" varchar(150),
	"focus_area" varchar(255),
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scanned_by" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_scans_scan_ref_unique" UNIQUE("scan_ref")
);
--> statement-breakpoint
ALTER TABLE "generated_reports" ADD COLUMN "translation_markdown" text;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD COLUMN "translation_language" varchar(10);--> statement-breakpoint
CREATE UNIQUE INDEX "ai_recommendations_converted_uq" ON "ai_recommendations" USING btree ("converted_work_item_key");--> statement-breakpoint
CREATE INDEX "ai_recommendations_snapshot_idx" ON "ai_recommendations" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "ai_findings_snapshot_idx" ON "ai_findings" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "ai_findings_status_idx" ON "ai_findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_scans_project_created_idx" ON "ai_scans" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_scans_mode_idx" ON "ai_scans" USING btree ("mode");