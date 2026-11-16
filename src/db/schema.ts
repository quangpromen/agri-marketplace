import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const contactSubmissionStatus = pgEnum("contact_submission_status", [
  "new",
  "contacted",
  "resolved",
  "spam",
]);

export const emailDeliveryStatus = pgEnum("email_delivery_status", ["pending", "sent", "failed"]);

export const newsletterSubscriberStatus = pgEnum("newsletter_subscriber_status", [
  "pending",
  "active",
  "unsubscribed",
]);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    service: varchar("service", { length: 100 }).notNull(),
    message: text("message").notNull(),
    status: contactSubmissionStatus("status").default("new").notNull(),
    emailStatus: emailDeliveryStatus("email_status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contact_submissions_created_at_id_idx").on(table.createdAt, table.id),
  ]
);

export const adminNotificationStates = pgTable("admin_notification_states", {
  adminUserId: text("admin_user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminNotificationReads = pgTable(
  "admin_notification_reads",
  {
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contactSubmissionId: uuid("contact_submission_id")
      .notNull()
      .references(() => contactSubmissions.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.adminUserId, table.contactSubmissionId],
    }),
    index("admin_notification_reads_contact_submission_id_idx").on(
      table.contactSubmissionId
    ),
  ]
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    actorNameSnapshot: varchar("actor_name_snapshot", { length: 100 }),
    actorEmailSnapshot: varchar("actor_email_snapshot", { length: 254 }),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 64 }),
    targetId: text("target_id"),
    result: varchar("result", { length: 16 }).notNull(),
    changes: jsonb("changes").$type<Record<string, unknown> | null>(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_created_at_id_idx").on(table.createdAt, table.id),
    index("admin_audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("admin_audit_logs_action_idx").on(table.action),
    index("admin_audit_logs_result_idx").on(table.result),
  ]
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  status: newsletterSubscriberStatus("status").default("pending").notNull(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export * from "./auth-schema";
