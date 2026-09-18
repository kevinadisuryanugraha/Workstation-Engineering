CREATE TABLE "kb_article_versions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"article_id" varchar(36) NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"updated_by" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_articles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"slug" varchar(150) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"owner_name" varchar(150) NOT NULL,
	"source_ticket_key" varchar(30),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "kb_versions_article_idx" ON "kb_article_versions" USING btree ("article_id","version");--> statement-breakpoint
CREATE INDEX "kb_articles_title_idx" ON "kb_articles" USING btree ("title");