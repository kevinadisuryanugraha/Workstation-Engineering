CREATE TABLE "server_metrics" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"server_name" varchar(150) NOT NULL,
	"cpu_usage" double precision NOT NULL,
	"memory_total" double precision NOT NULL,
	"memory_used" double precision NOT NULL,
	"memory_free" double precision NOT NULL,
	"disks" jsonb NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "server_metrics_server_recorded_uq" ON "server_metrics" USING btree ("server_name","recorded_at");--> statement-breakpoint
CREATE INDEX "server_metrics_server_recorded_idx" ON "server_metrics" USING btree ("server_name","recorded_at");