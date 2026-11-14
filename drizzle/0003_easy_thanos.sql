CREATE TABLE "admin_notification_reads" (
	"admin_user_id" text NOT NULL,
	"contact_submission_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_notification_reads_admin_user_id_contact_submission_id_pk" PRIMARY KEY("admin_user_id","contact_submission_id")
);
--> statement-breakpoint
ALTER TABLE "admin_notification_reads" ADD CONSTRAINT "admin_notification_reads_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notification_reads" ADD CONSTRAINT "admin_notification_reads_contact_submission_id_contact_submissions_id_fk" FOREIGN KEY ("contact_submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notification_reads_contact_submission_id_idx" ON "admin_notification_reads" USING btree ("contact_submission_id");--> statement-breakpoint
INSERT INTO "admin_notification_reads" ("admin_user_id", "contact_submission_id", "read_at")
SELECT
	"ans"."admin_user_id",
	"cs"."id",
	"ans"."last_seen_at"
FROM "admin_notification_states" AS "ans"
INNER JOIN "contact_submissions" AS "cs"
	ON "cs"."created_at" <= "ans"."last_seen_at"
ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING;