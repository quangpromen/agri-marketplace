import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  markAllAdminNotificationsSeen: vi.fn(),
  revalidatePath: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/admin/notifications", () => ({
  markAllAdminNotificationsSeen: mocks.markAllAdminNotificationsSeen,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

import { markAllAdminNotificationsSeenAction } from "@/actions/admin-notifications";

describe("markAllAdminNotificationsSeenAction Server Action", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: {
        id: "admin-session-user-1",
        email: "admin@mocfarm.vn",
        name: "Quản trị viên",
      },
      session: {
        id: "sess-1",
        userId: "admin-session-user-1",
        token: "secret-session-token",
      },
    });
    mocks.markAllAdminNotificationsSeen.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.captureOperationalError.mockReset();
  });

  it("từ chối người dùng chưa đăng nhập (requireAdmin chuyển hướng /admin/login) trước khi chạm DB", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(markAllAdminNotificationsSeenAction()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );

    expect(mocks.markAllAdminNotificationsSeen).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("gọi requireAdmin trước khi cập nhật DB, bỏ qua mọi tham số adminUserId từ client và revalidate layout + trang quản trị", async () => {
    const callOrder: string[] = [];
    const lastSeenAt = "2026-11-14T10:15:00.000Z";

    mocks.requireAdmin.mockImplementationOnce(async () => {
      callOrder.push("requireAdmin");
      return {
        user: {
          id: "admin-authenticated-id",
          email: "admin@mocfarm.vn",
          name: "Admin",
        },
        session: {
          id: "sess-1",
          userId: "admin-authenticated-id",
          token: "secret-session-token",
        },
      };
    });

    mocks.markAllAdminNotificationsSeen.mockImplementationOnce(async () => {
      callOrder.push("markAllAdminNotificationsSeen");
      return { ok: true, lastSeenAt };
    });

    // Giả lập client cố truyền adminUserId giả ở runtime
    const unsafeClientCall = markAllAdminNotificationsSeenAction as unknown as (
      payload?: unknown
    ) => ReturnType<typeof markAllAdminNotificationsSeenAction>;
    const result = await unsafeClientCall({
      adminUserId: "victim-other-admin-id",
    });

    expect(callOrder).toEqual(["requireAdmin", "markAllAdminNotificationsSeen"]);
    expect(mocks.markAllAdminNotificationsSeen).toHaveBeenCalledTimes(1);
    expect(mocks.markAllAdminNotificationsSeen).toHaveBeenCalledWith(
      "admin-authenticated-id"
    );
    expect(mocks.markAllAdminNotificationsSeen).not.toHaveBeenCalledWith(
      "victim-other-admin-id"
    );

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin", "layout");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/lien-he");

    expect(result).toEqual({
      status: "success",
      lastSeenAt,
    });
    expect(JSON.stringify(result)).not.toContain("secret-session-token");
  });

  it("trả lỗi an toàn khi user.id trong phiên không hợp lệ", async () => {
    mocks.requireAdmin.mockResolvedValueOnce({
      user: { id: "   ", email: "admin@mocfarm.vn", name: "Admin" },
      session: { id: "sess-1", userId: "   ", token: "tok" },
    });

    const result = await markAllAdminNotificationsSeenAction();

    expect(result).toEqual({
      status: "error",
      message: "Phiên quản trị viên không hợp lệ.",
    });
    expect(mocks.markAllAdminNotificationsSeen).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("bắt lỗi DB an toàn, ghi observability và không làm lộ chi tiết DB hoặc PII", async () => {
    mocks.markAllAdminNotificationsSeen.mockRejectedValueOnce(
      new Error("neon db failure password=secret email=khach@example.com")
    );

    const result = await markAllAdminNotificationsSeenAction();

    expect(mocks.captureOperationalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        service: "neon",
        operation: "mark_all_admin_notifications_seen",
      })
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("neon db failure");
    expect(result.message).not.toContain("secret");
    expect(result.message).not.toContain("khach@example.com");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

