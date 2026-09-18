CREATE TABLE "work_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"key" varchar(20) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'TASK' NOT NULL,
	"priority" varchar(10) DEFAULT 'P2' NOT NULL,
	"status" varchar(30) DEFAULT 'BACKLOG' NOT NULL,
	"assignee_id" varchar(36),
	"estimate_hours" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_items_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"key" varchar(20) NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"requester_id" varchar(36),
	"assignee_id" varchar(36),
	"type" varchar(50) DEFAULT 'BUG' NOT NULL,
	"severity" varchar(20) DEFAULT 'Medium' NOT NULL,
	"priority" varchar(10) DEFAULT 'P2' NOT NULL,
	"status" varchar(30) DEFAULT 'NEW' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_items_project_id_idx" ON "work_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "work_items_assignee_id_idx" ON "work_items" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "work_items_status_idx" ON "work_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "work_items_key_idx" ON "work_items" USING btree ("key");--> statement-breakpoint
CREATE INDEX "tickets_project_id_idx" ON "tickets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_severity_idx" ON "tickets" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "tickets_priority_idx" ON "tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tickets_assignee_id_idx" ON "tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tickets_key_idx" ON "tickets" USING btree ("key");