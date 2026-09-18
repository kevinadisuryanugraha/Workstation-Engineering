CREATE TABLE "sprints" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"goal" varchar(500),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" varchar(15) DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500),
	"target_date" timestamp with time zone,
	"status" varchar(15) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "sprint_id" varchar(36);--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "milestone_id" varchar(36);--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprints_project_status_idx" ON "sprints" USING btree ("project_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sprints_project_name_uq" ON "sprints" USING btree ("project_id","name");--> statement-breakpoint
CREATE INDEX "milestones_project_status_idx" ON "milestones" USING btree ("project_id","status");--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;