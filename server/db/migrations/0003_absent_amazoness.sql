CREATE TABLE "acceptance_criteria" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"work_item_id" varchar(36) NOT NULL,
	"text" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by" varchar(36),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_links" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(36),
	"work_item_id" varchar(36),
	"commit_sha" varchar(40),
	"pr_id" varchar(50),
	"deployment_id" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_item_dependencies" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"blocked_work_item_id" varchar(36) NOT NULL,
	"blocker_work_item_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"default_branch" varchar(100) DEFAULT 'main' NOT NULL,
	"webhook_secret" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"delivery_id" varchar(100) NOT NULL,
	"event" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "webhook_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_dependencies" ADD CONSTRAINT "work_item_dependencies_blocked_work_item_id_work_items_id_fk" FOREIGN KEY ("blocked_work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_item_dependencies" ADD CONSTRAINT "work_item_dependencies_blocker_work_item_id_work_items_id_fk" FOREIGN KEY ("blocker_work_item_id") REFERENCES "public"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ac_work_item_id_idx" ON "acceptance_criteria" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "ac_is_completed_idx" ON "acceptance_criteria" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "evidence_ticket_id_idx" ON "evidence_links" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "evidence_work_item_id_idx" ON "evidence_links" USING btree ("work_item_id");--> statement-breakpoint
CREATE INDEX "evidence_commit_sha_idx" ON "evidence_links" USING btree ("commit_sha");--> statement-breakpoint
CREATE UNIQUE INDEX "work_item_dep_pair_unique" ON "work_item_dependencies" USING btree ("blocked_work_item_id","blocker_work_item_id");--> statement-breakpoint
CREATE INDEX "repo_project_id_idx" ON "repositories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "repo_full_name_idx" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "webhook_delivery_id_idx" ON "webhook_deliveries" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "webhook_status_idx" ON "webhook_deliveries" USING btree ("status");