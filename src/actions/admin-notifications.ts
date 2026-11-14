"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_CONTACTS_PATH } from "@/schemas/admin-contact";
import { adminUserIdSchema } from "@/schemas/admin-notifications";
import { ADMIN_DASHBOARD_PATH } from "@/schemas/auth";
import { markAllAdminNotificationsSeen } from "@/server/admin/notifications";
import { requireAdmin } from "@/server/auth/require-admin";
import { captureOperationalError } from "@/server/observability/capture-error";

export type MarkAllAdminNotificationsSeenState = {
  status: "success" | "error";
  lastSeenAt?: string;
  message?: string;
};

export async function markAllAdminNotificationsSeenAction(): Promise<MarkAllAdminNotificationsSeenState> {
  const { user } = await requireAdmin();

  const parsedAdminId = adminUserIdSchema.safeParse(user.id);
  if (!parsedAdminId.success) {
    return {
      status: "error",
      message: "Phiên quản trị viên không hợp lệ.",
    };
  }

  try {
    const result = await markAllAdminNotificationsSeen(parsedAdminId.data);

    revalidatePath(ADMIN_DASHBOARD_PATH, "layout");
    revalidatePath(ADMIN_DASHBOARD_PATH);
    revalidatePath(ADMIN_CONTACTS_PATH);

    return {
      status: "success",
      lastSeenAt: result.lastSeenAt,
    };
  } catch (error) {
    captureOperationalError(error, {
      service: "neon",
      operation: "mark_all_admin_notifications_seen",
    });

    return {
      status: "error",
      message:
        "Không thể đánh dấu tất cả đã xem lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}

