import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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

export const contactSubmissions = pgTable("contact_submissions", {
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
});

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
