import { z } from "zod";
import { ADMIN_CONTACTS_PATH } from "@/schemas/admin-contact";

export const ADMIN_NOTIFICATIONS_API_PATH = "/api/admin/notifications";
export const ADMIN_NOTIFICATION_POLL_INTERVAL_MS = 30_000;
export const ADMIN_NOTIFICATION_DROPDOWN_LIMIT = 5;
export const ADMIN_NOTIFICATION_BADGE_CAP = 99;

export const adminUserIdSchema = z
  .string()
  .trim()
  .min(1, "Mã quản trị viên không hợp lệ.");

export const markAllNotificationsSeenSchema = z.object({
  adminUserId: adminUserIdSchema,
});

export const adminNotificationItemSchema = z
  .object({
    id: z.string().min(1),
    customerName: z.string().min(1),
    serviceLabel: z.string().min(1),
    createdAt: z.string().min(1),
    relativeTime: z.string().min(1),
    detailUrl: z.string().startsWith(`${ADMIN_CONTACTS_PATH}/`),
  })
  .strict();

export const adminNotificationSummarySchema = z
  .object({
    unreadCount: z.number().int().min(0),
    items: z
      .array(adminNotificationItemSchema)
      .max(ADMIN_NOTIFICATION_DROPDOWN_LIMIT),
    serverTime: z.string().min(1),
  })
  .strict();

export type AdminNotificationItem = z.infer<typeof adminNotificationItemSchema>;
export type AdminNotificationSummary = z.infer<
  typeof adminNotificationSummarySchema
>;

export function parseAdminNotificationSummary(
  value: unknown
): AdminNotificationSummary | null {
  const parsed = adminNotificationSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

