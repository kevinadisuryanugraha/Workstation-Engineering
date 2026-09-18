CREATE TABLE "commits" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"repo_id" varchar(36),
	"sha" varchar(40) NOT NULL,
	"message" text NOT NULL,
	"author_name" varchar(150) NOT NULL,
	"author_email" varchar(255),
	"branch" varchar(100),
	"url" varchar(255),
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commits_sha_unique" UNIQUE("sha")
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"environment" varchar(30) NOT NULL,
	"server_name" varchar(100) NOT NULL,
	"version" varchar(50) NOT NULL,
	"commit_sha" varchar(40),
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"deployed_by" varchar(150) NOT NULL,
	"rollback_reason" varchar(255),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"repo_id" varchar(36),
	"pr_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"author_name" varchar(150) NOT NULL,
	"source_branch" varchar(100) NOT NULL,
	"target_branch" varchar(100) NOT NULL,
	"status" varchar(30) DEFAULT 'OPEN' NOT NULL,
	"url" varchar(255),
	"merged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(36) NOT NULL,
	"author_id" varchar(36) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_history" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(36) NOT NULL,
	"actor_id" varchar(36) NOT NULL,
	"actor_name" varchar(150) NOT NULL,
	"field_changed" varchar(50) NOT NULL,
	"old_value" varchar(255),
	"new_value" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commits_sha_idx" ON "commits" USING btree ("sha");--> statement-breakpoint
CREATE INDEX "commits_repo_id_idx" ON "commits" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "deploy_project_id_idx" ON "deployments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deploy_environment_idx" ON "deployments" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "deploy_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deploy_commit_sha_idx" ON "deployments" USING btree ("commit_sha");--> statement-breakpoint
CREATE INDEX "pr_repo_id_idx" ON "pull_requests" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "pr_status_idx" ON "pull_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comments_ticket_id_idx" ON "ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_hist_ticket_id_idx" ON "ticket_history" USING btree ("ticket_id");