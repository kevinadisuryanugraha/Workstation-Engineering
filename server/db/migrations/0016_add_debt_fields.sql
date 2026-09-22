ALTER TABLE "work_items" ADD COLUMN "debt_origin" varchar(30);--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "debt_impact" varchar(10);--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "debt_source_ref" varchar(120);--> statement-breakpoint
CREATE INDEX "work_items_debt_origin_idx" ON "work_items" USING btree ("debt_origin");