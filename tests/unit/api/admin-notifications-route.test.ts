import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAdminNotificationSummary: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/admin/notifications", () => ({
  getAdminNotificationSummary: mocks.getAdminNotificationSummary,
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

import { GET, dynamic, revalidate } from "@/app/api/admin/notifications/route";

describe("GET /api/admin/notifications", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.getAdminNotificationSummary.mockReset();
    mocks.captureOperationalError.mockReset();
  });

  it("ép dynamic force-dynamic và revalidate 0", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  it("từ chối truy cập ẩn danh với 401 + Cache-Control no-store và không chạm DB thông báo", async () => {
    const redirectError = new Error("NEXT_REDIRECT") as Error & {
      digest?: string;
    };
    redirectError.digest = "NEXT_REDIRECT;replace;/admin/login;307;";
    mocks.requireAdmin.mockRejectedValueOnce(redirectError);

    const response = await GET(
      new Request("http://localhost:3000/api/admin/notifications", {
        headers: { cookie: "none" },
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(mocks.getAdminNotificationSummary).not.toHaveBeenCalled();

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ error: "Chưa xác thực." });
  });

  it("cũng từ chối 401 nếu requireAdmin ném lỗi NEXT_REDIRECT không có digest", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    const response = await GET(
      new Request("http://localhost:3000/api/admin/notifications")
    );

    expect(response.status).toBe(401);
    expect(mocks.getAdminNotificationSummary).not.toHaveBeenCalled();
  });

  it("gọi requireAdmin trước truy vấn DB, bỏ qua adminUserId từ query string, không log payload và trả về dữ liệu tối thiểu kèm no-store", async () => {
    const callOrder: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    mocks.requireAdmin.mockImplementationOnce(async () => {
      callOrder.push("requireAdmin");
      return {
        user: {
          id: "admin-auth-1",
          email: "admin@mocfarm.vn",
          name: "Quản trị viên",
        },
        session: {
          id: "sess-1",
          userId: "admin-auth-1",
          token: "super-secret-session-token",
          ipAddress: "203.0.113.99",
        },
      };
    });

    const summaryPayload = {
      unreadCount: 2,
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          customerName: "Lê Thị Mai",
          serviceLabel: "Mua nông sản / Hộp rau gia đình",
          createdAt: "2026-11-14T09:50:00.000Z",
          relativeTime: "10 phút trước",
          detailUrl: "/admin/lien-he/550e8400-e29b-41d4-a716-446655440001",
        },
      ],
      serverTime: "2026-11-14T10:00:00.000Z",
    };

    mocks.getAdminNotificationSummary.mockImplementationOnce(async () => {
      callOrder.push("getAdminNotificationSummary");
      return summaryPayload;
    });

    const request = new Request(
      "http://localhost:3000/api/admin/notifications?adminUserId=other-admin-999",
      {
        headers: { cookie: "better-auth.session_token=secret" },
      }
    );

    const response = await GET(request);
    const bodyText = await response.text();
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;

    expect(callOrder).toEqual(["requireAdmin", "getAdminNotificationSummary"]);
    expect(mocks.requireAdmin).toHaveBeenCalledWith(request.headers);
    expect(mocks.getAdminNotificationSummary).toHaveBeenCalledWith(
      "admin-auth-1"
    );
    expect(mocks.getAdminNotificationSummary).not.toHaveBeenCalledWith(
      "other-admin-999"
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "no-store, no-cache, must-revalidate, private"
    );
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("vary")).toBe("Cookie");

    expect(parsed).toEqual(summaryPayload);
    expect(bodyText).not.toContain("super-secret-session-token");
    expect(bodyText).not.toContain("203.0.113.99");
    expect(bodyText).not.toContain("admin@mocfarm.vn");
    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("xử lý lỗi bất ngờ từ auth hoặc DB với 500 an toàn, không lộ stack trace hay chuỗi lỗi thô", async () => {
    mocks.requireAdmin.mockResolvedValueOnce({
      user: { id: "admin-1", email: "admin@mocfarm.vn", name: "Admin" },
      session: { id: "sess-1", userId: "admin-1", token: "tok" },
    });
    mocks.getAdminNotificationSummary.mockRejectedValueOnce(
      new Error("PGHOST=db.internal password=supersecret customer@example.com")
    );

    const response = await GET(
      new Request("http://localhost:3000/api/admin/notifications")
    );
    const bodyText = await response.text();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.captureOperationalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        service: "neon",
        operation: "get_admin_notification_summary",
      })
    );
    expect(bodyText).not.toContain("supersecret");
    expect(bodyText).not.toContain("customer@example.com");
    expect(bodyText).not.toContain("PGHOST");

    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("Auth socket timeout token=xyz")
    );
    const authErrResponse = await GET(
      new Request("http://localhost:3000/api/admin/notifications")
    );
    const authErrText = await authErrResponse.text();
    expect(authErrResponse.status).toBe(500);
    expect(authErrText).not.toContain("xyz");
    expect(authErrText).not.toContain("socket timeout");
  });
});

