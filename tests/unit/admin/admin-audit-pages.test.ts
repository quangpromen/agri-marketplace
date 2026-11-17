import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listAdminAuditLogs: vi.fn(),
  captureOperationalError: vi.fn(),
  usePathname: vi.fn(() => "/admin/audit-logs"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/admin/audit-logs", () => ({
  listAdminAuditLogs: mocks.listAdminAuditLogs,
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: mocks.useRouter,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...props }, children),
}));

import AdminAuditLogsPage, {
  metadata as auditLogsMetadata,
} from "@/app/(admin)/admin/(protected)/audit-logs/page";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  encodeAdminAuditCursor,
} from "@/schemas/admin-audit";
import type { AdminAuditLogListResult } from "@/server/admin/audit-logs";

const CONTACT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const SECRET_SESSION_TOKEN = "super_secret_session_token_never_render";

describe("Admin audit logs page, navigation, privacy & accessibility", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: {
        id: "admin-1",
        name: "Nguyễn Quản Trị",
        email: "admin@mocfarm.vn",
      },
      session: {
        id: "sess-1",
        userId: "admin-1",
        token: SECRET_SESSION_TOKEN,
      },
    });
    mocks.listAdminAuditLogs.mockReset();
    mocks.captureOperationalError.mockReset();
    mocks.usePathname.mockReturnValue("/admin/audit-logs");
  });

  it("AdminNav hiển thị mục 'Nhật ký hoạt động' trỏ tới /admin/audit-logs và đánh dấu active đúng", () => {
    mocks.usePathname.mockReturnValue("/admin/audit-logs");
    const activeHtml = renderToStaticMarkup(React.createElement(AdminNav));
    expect(activeHtml).toContain("Nhật ký hoạt động");
    expect(activeHtml).toContain('href="/admin/audit-logs"');
    expect(activeHtml).toContain('aria-current="page"');
    expect(activeHtml).toContain("focus-ring");

    // Khi đang ở /admin/lien-he thì Nhật ký hoạt động không bị active
    mocks.usePathname.mockReturnValue("/admin/lien-he");
    const otherHtml = renderToStaticMarkup(React.createElement(AdminNav));
    expect(otherHtml).toContain('href="/admin/audit-logs"');
    const auditLinkSegment = otherHtml
      .split("<a ")
      .find((segment) => segment.includes('href="/admin/audit-logs"'));
    expect(auditLinkSegment).toBeDefined();
    expect(auditLinkSegment).not.toContain('aria-current="page"');
  });

  it("người dùng chưa đăng nhập truy cập /admin/audit-logs bị chuyển hướng /admin/login và không truy vấn audit logs", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(AdminAuditLogsPage({ searchParams: {} })).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );
    expect(mocks.listAdminAuditLogs).not.toHaveBeenCalled();
  });

  it("hiển thị đầy đủ 5 loại hành động tiếng Việt, giờ Việt Nam, chuyển trạng thái dễ đọc, nút mở yêu cầu và không lộ JSON thô hay nút sửa/xóa", async () => {
    const nextCursor = encodeAdminAuditCursor(
      { createdAt: "2026-11-15T01:00:00.000Z", id: CONTACT_UUID },
      "next"
    );
    const prevCursor = encodeAdminAuditCursor(
      { createdAt: "2026-11-15T05:00:00.000Z", id: CONTACT_UUID },
      "prev"
    );

    const listResult: AdminAuditLogListResult = {
      pageSize: 25,
      isFirstPage: false,
      hasPreviousPage: true,
      hasNextPage: true,
      previousCursor: prevCursor,
      nextCursor,
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          actorUserId: "admin-1",
          actorNameSnapshot: "Nguyễn <script>alert(1)</script>",
          actorEmailSnapshot: "admin@mocfarm.vn",
          action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
          targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
          targetId: CONTACT_UUID,
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          detailSummary: {
            kind: "contact_status_transition",
            from: "new",
            to: "contacted",
          },
          createdAt: new Date("2026-11-15T05:30:00.000Z"), // 12:30 15/11/2026 GMT+7
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440012",
          actorUserId: "admin-1",
          actorNameSnapshot: "Nguyễn Quản Trị",
          actorEmailSnapshot: "admin@mocfarm.vn",
          action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
          targetId: "admin-1",
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          detailSummary: {
            kind: "notifications_mark_all_seen",
            receiptsCreated: 4,
          },
          createdAt: new Date("2026-11-15T04:15:00.000Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440013",
          actorUserId: null,
          actorNameSnapshot: null,
          actorEmailSnapshot: "intruder@mocfarm.vn",
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          targetId: null,
          result: ADMIN_AUDIT_RESULTS.FAILURE,
          detailSummary: {
            kind: "auth_login_failed",
            reason: "invalid_credentials",
          },
          createdAt: new Date("2026-11-15T03:00:00.000Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440014",
          actorUserId: "admin-1",
          actorNameSnapshot: "Nguyễn Quản Trị",
          actorEmailSnapshot: "admin@mocfarm.vn",
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          targetId: null,
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          detailSummary: { kind: "auth_login_succeeded" },
          createdAt: new Date("2026-11-15T02:00:00.000Z"),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440015",
          actorUserId: "admin-1",
          actorNameSnapshot: "Nguyễn Quản Trị",
          actorEmailSnapshot: "admin@mocfarm.vn",
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          targetId: null,
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          detailSummary: { kind: "auth_logout_succeeded" },
          createdAt: new Date("2026-11-15T01:00:00.000Z"),
        },
      ],
    };

    mocks.listAdminAuditLogs.mockResolvedValueOnce(listResult);

    const html = renderToStaticMarkup(
      await AdminAuditLogsPage({
        searchParams: {
          action: "contact.status_changed",
          result: "success",
          period: "7d",
        },
      })
    );

    // Metadata noIndex và không chứa PII
    expect(auditLogsMetadata.robots).toEqual({ index: false, follow: false });

    // Nhãn tiếng Việt & kết quả
    expect(html).toContain("Nhật ký hoạt động");
    expect(html).toContain("Cập nhật trạng thái yêu cầu tư vấn");
    expect(html).toContain("Đánh dấu đã xem tất cả thông báo");
    expect(html).toContain("Đăng nhập thất bại");
    expect(html).toContain("Đăng nhập thành công");
    expect(html).toContain("Đăng xuất quản trị");
    expect(html).toContain("Thành công");
    expect(html).toContain("Thất bại");

    // Chuyển trạng thái đọc được & metadata an toàn
    expect(html).toContain("Mới → Đã liên hệ");
    expect(html).toContain("Biên nhận đã xem mới tạo:");
    expect(html).toContain(">4<");
    expect(html).toContain("Chưa xác thực");
    expect(html).toContain("Email thử đăng nhập: intruder@mocfarm.vn");

    // Thời gian Asia/Ho_Chi_Minh (05:30Z -> 12:30 15/11/2026)
    expect(html).toContain("12:30 15/11/2026");

    // ID rút gọn + đầy đủ cho trình đọc màn hình & liên kết yêu cầu
    expect(html).toContain("550e8400…440000");
    expect(html).toContain(`Mã đầy đủ: ${CONTACT_UUID}`);
    expect(html).toContain(`href="/admin/lien-he/${CONTACT_UUID}"`);

    // Bố cục responsive desktop (hidden ... md:block) và mobile cards (md:hidden)
    expect(html).toContain("hidden overflow-x-auto");
    expect(html).toContain("md:block");
    expect(html).toContain("md:hidden");

    // Bộ lọc giữ nguyên trong liên kết phân trang cursor
    expect(html).toContain(
      `href="/admin/audit-logs?action=contact.status_changed&amp;result=success&amp;period=7d&amp;cursor=${encodeURIComponent(prevCursor)}"`
    );
    expect(html).toContain(
      `href="/admin/audit-logs?action=contact.status_changed&amp;result=success&amp;period=7d&amp;cursor=${encodeURIComponent(nextCursor)}"`
    );
    expect(html).toContain(
      'href="/admin/audit-logs?action=contact.status_changed&amp;result=success&amp;period=7d"'
    );

    // Accessibility & keyboard focus
    expect(html).toContain('for="audit-filter-action"');
    expect(html).toContain('for="audit-filter-result"');
    expect(html).toContain('for="audit-filter-period"');
    expect(html).toContain("focus-ring");

    // Thoát HTML XSS và không lộ JSON thô hay nút sửa/xóa
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain('{"status"');
    expect(html).not.toContain('"receiptsCreated"');
    expect(html).not.toContain("dangerouslySetInnerHTML");
    expect(html).not.toContain(SECRET_SESSION_TOKEN);
    expect(html).not.toMatch(/Chỉnh sửa|Xoá nhật ký|Xóa nhật ký|Delete/i);
  });

  it("hiển thị đúng empty state (không bộ lọc, có bộ lọc, và stale cursor)", async () => {
    // 1) Trống hoàn toàn
    mocks.listAdminAuditLogs.mockResolvedValueOnce({
      items: [],
      pageSize: 25,
      hasNextPage: false,
      hasPreviousPage: false,
      nextCursor: null,
      previousCursor: null,
      isFirstPage: true,
    });
    const emptyHtml = renderToStaticMarkup(
      await AdminAuditLogsPage({ searchParams: {} })
    );
    expect(emptyHtml).toContain("Chưa có bản ghi nhật ký hoạt động nào");

    // 2) Trống khi có bộ lọc
    mocks.listAdminAuditLogs.mockResolvedValueOnce({
      items: [],
      pageSize: 25,
      hasNextPage: false,
      hasPreviousPage: false,
      nextCursor: null,
      previousCursor: null,
      isFirstPage: true,
    });
    const filteredEmptyHtml = renderToStaticMarkup(
      await AdminAuditLogsPage({
        searchParams: { action: "auth.login_failed", result: "failure" },
      })
    );
    expect(filteredEmptyHtml).toContain(
      "Không tìm thấy bản ghi nhật ký phù hợp"
    );
    expect(filteredEmptyHtml).toContain("Xoá bộ lọc");

    // 3) Stale cursor -> hiển thị nút Về trang đầu bảo toàn bộ lọc
    const staleCursor = encodeAdminAuditCursor(
      { createdAt: "2020-01-01T00:00:00.000Z", id: CONTACT_UUID },
      "next"
    );
    mocks.listAdminAuditLogs.mockResolvedValueOnce({
      items: [],
      pageSize: 25,
      hasNextPage: false,
      hasPreviousPage: false,
      nextCursor: null,
      previousCursor: null,
      isFirstPage: false,
    });
    const staleHtml = renderToStaticMarkup(
      await AdminAuditLogsPage({
        searchParams: { period: "30d", cursor: staleCursor },
      })
    );
    expect(staleHtml).toContain("Về trang đầu");
    expect(staleHtml).toContain('href="/admin/audit-logs?period=30d"');
  });

  it("xử lý lỗi DB an toàn: ghi operational error và không lộ SQL, tên bảng hay stack trace ra HTML", async () => {
    mocks.listAdminAuditLogs.mockRejectedValueOnce(
      new Error(
        "SELECT * FROM admin_audit_logs WHERE password='secret' at /srv/app/audit.ts:42"
      )
    );

    const errorHtml = renderToStaticMarkup(
      await AdminAuditLogsPage({ searchParams: {} })
    );

    expect(mocks.captureOperationalError).toHaveBeenCalledTimes(1);
    const [capturedError, capturedCtx] =
      mocks.captureOperationalError.mock.calls[0]!;
    expect((capturedError as Error).message).toBe(
      "Failed to query admin audit logs"
    );
    expect(capturedCtx).toEqual({
      service: "neon",
      operation: "list_admin_audit_logs",
    });

    expect(errorHtml).toContain("Không thể tải nhật ký hoạt động lúc này");
    expect(errorHtml).toContain("Thử tải lại");
    expect(errorHtml).not.toContain("SELECT *");
    expect(errorHtml).not.toContain("admin_audit_logs");
    expect(errorHtml).not.toContain("/srv/app");
    expect(errorHtml).not.toContain("secret");
  });
});
