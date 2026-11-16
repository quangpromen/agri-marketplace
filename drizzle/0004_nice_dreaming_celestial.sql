CREATE TABLE "admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"actor_name_snapshot" varchar(100),
	"actor_email_snapshot" varchar(254),
	"action" varchar(64) NOT NULL,
	"target_type" varchar(64),
	"target_id" text,
	"result" varchar(16) NOT NULL,
	"changes" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_at_id_idx" ON "admin_audit_logs" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_actor_user_id_idx" ON "admin_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_result_idx" ON "admin_audit_logs" USING btree ("result");