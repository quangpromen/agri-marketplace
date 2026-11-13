import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  listContactSubmissions: vi.fn(),
  listDistinctContactServices: vi.fn(),
  getContactSubmissionById: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  usePathname: vi.fn(() => "/admin/lien-he"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/admin/contact-submissions", () => ({
  listContactSubmissions: mocks.listContactSubmissions,
  listDistinctContactServices: mocks.listDistinctContactServices,
  getContactSubmissionById: mocks.getContactSubmissionById,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
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

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormState: (
      _action: unknown,
      initialState: unknown
    ): [unknown, () => void] => [initialState, () => undefined],
    useFormStatus: () => ({ pending: false }),
  };
});

import ProtectedAdminLayout from "@/app/(admin)/admin/(protected)/layout";
import AdminContactListPage from "@/app/(admin)/admin/(protected)/lien-he/page";
import AdminContactDetailPage, {
  metadata as detailMetadata,
} from "@/app/(admin)/admin/(protected)/lien-he/[id]/page";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const SECRET_SESSION_TOKEN = "super_secret_session_token_should_never_leak";

describe("Admin contact pages & protection", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: {
        id: "admin-1",
        name: "Quản trị viên",
        email: "admin@mocfarm.vn",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "sess-1",
        userId: "admin-1",
        token: SECRET_SESSION_TOKEN,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    mocks.listContactSubmissions.mockReset();
    mocks.listDistinctContactServices.mockReset().mockResolvedValue([
      { value: "hop-rau-tuan", label: "Mua nông sản / Hộp rau gia đình" },
    ]);
    mocks.getContactSubmissionById.mockReset();
    mocks.redirect.mockClear();
    mocks.notFound.mockClear();
    mocks.usePathname.mockReturnValue("/admin/lien-he");
  });

  it("người chưa đăng nhập không truy cập được danh sách /admin/lien-he", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(AdminContactListPage({ searchParams: {} })).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );
    expect(mocks.listContactSubmissions).not.toHaveBeenCalled();
  });

  it("người chưa đăng nhập không xem được chi tiết /admin/lien-he/[id]", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(
      AdminContactDetailPage({ params: { id: VALID_UUID }, searchParams: {} })
    ).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mocks.getContactSubmissionById).not.toHaveBeenCalled();
  });

  it("layout admin hiển thị điều hướng Tổng quan, Yêu cầu tư vấn, Đăng xuất và không rò rỉ session token", async () => {
    const element = await ProtectedAdminLayout({
      children: React.createElement("div", null, "Nội dung"),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Tổng quan");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Yêu cầu tư vấn");
    expect(html).toContain('href="/admin/lien-he"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Đăng xuất");
    expect(html).not.toContain(SECRET_SESSION_TOKEN);
  });

  it("trang danh sách redirect an toàn khi page vượt quá totalPages và giữ bộ lọc", async () => {
    mocks.listContactSubmissions.mockResolvedValueOnce({
      items: [],
      totalCount: 25,
      page: 2,
      pageSize: 20,
      totalPages: 2,
      isOutOfRange: true,
    });

    await expect(
      AdminContactListPage({
        searchParams: { q: "lan", status: "new", page: "99" },
      })
    ).rejects.toThrow("NEXT_REDIRECT:/admin/lien-he?q=lan&status=new&page=2");
  });

  it("trang danh sách hiển thị empty state riêng khi chưa có yêu cầu và khi lọc không có kết quả", async () => {
    mocks.listContactSubmissions.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      isOutOfRange: false,
    });

    const emptyHtml = renderToStaticMarkup(
      await AdminContactListPage({ searchParams: {} })
    );
    expect(emptyHtml).toContain("Chưa có yêu cầu tư vấn nào");

    mocks.listContactSubmissions.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      isOutOfRange: false,
    });

    const filteredEmptyHtml = renderToStaticMarkup(
      await AdminContactListPage({ searchParams: { emailStatus: "failed" } })
    );
    expect(filteredEmptyHtml).toContain("Không tìm thấy yêu cầu phù hợp");
    expect(filteredEmptyHtml).toContain("Xoá bộ lọc");
  });

  it("trang danh sách hiển thị đầy đủ thông tin hàng, badge email thất bại và phân trang giữ bộ lọc", async () => {
    mocks.listContactSubmissions.mockResolvedValueOnce({
      items: [
        {
          id: VALID_UUID,
          name: "Lê Thị Mai",
          phone: "0912345678",
          email: "mai@example.com",
          service: "hop-rau-tuan",
          status: "new",
          emailStatus: "failed",
          createdAt: new Date("2026-11-12T08:30:00Z"),
        },
      ],
      totalCount: 45,
      page: 2,
      pageSize: 20,
      totalPages: 3,
      isOutOfRange: false,
    });

    const html = renderToStaticMarkup(
      await AdminContactListPage({
        searchParams: { q: "mai", status: "new", page: "2" },
      })
    );

    expect(html).toContain("Lê Thị Mai");
    expect(html).toContain("0912345678");
    expect(html).toContain("mai@example.com");
    expect(html).toContain("Mua nông sản / Hộp rau gia đình");
    expect(html).toContain("Mới");
    expect(html).toContain("Gửi thất bại");
    expect(html).toContain("45");
    expect(html).toContain('href="/admin/lien-he?q=mai&amp;status=new"');
    expect(html).toContain('href="/admin/lien-he?q=mai&amp;status=new&amp;page=3"');
    expect(html).toContain(
      `href="/admin/lien-he/${VALID_UUID}?q=mai&amp;status=new&amp;page=2"`
    );
  });

  it("trang chi tiết xử lý notFound khi bản ghi không tồn tại hoặc id không hợp lệ", async () => {
    mocks.getContactSubmissionById.mockResolvedValueOnce(null);

    await expect(
      AdminContactDetailPage({
        params: { id: "not-a-uuid" },
        searchParams: {},
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("trang chi tiết hiển thị cảnh báo khi emailStatus=failed, không có nút gửi lại email, escape HTML và giữ search params khi quay lại", async () => {
    mocks.getContactSubmissionById.mockResolvedValueOnce({
      id: VALID_UUID,
      name: "Khách <script>alert(1)</script>",
      phone: "0912345678",
      email: "khach@example.com",
      service: "hop-rau-tuan",
      message: "Dòng 1\n<img src=x onerror=alert(1)>",
      status: "new",
      emailStatus: "failed",
      createdAt: new Date("2026-11-12T08:30:00Z"),
      updatedAt: new Date("2026-11-12T08:31:00Z"),
    });

    const html = renderToStaticMarkup(
      await AdminContactDetailPage({
        params: { id: VALID_UUID },
        searchParams: { q: "khach", emailStatus: "failed", page: "2" },
      })
    );

    expect(html).toContain("Email thông báo đã gửi thất bại");
    expect(html).toContain("chủ động liên hệ trực tiếp với khách hàng");
    expect(html.toLowerCase()).not.toContain("gửi lại email");

    // XSS escaped as text
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("whitespace-pre-wrap");

    // Back link preserves search params
    expect(html).toContain(
      'href="/admin/lien-he?q=khach&amp;emailStatus=failed&amp;page=2"'
    );

    // Safe mailto / tel links
    expect(html).toContain('href="mailto:khach@example.com"');
    expect(html).toContain('href="tel:0912345678"');

    // Metadata has noIndex and no PII
    expect(detailMetadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(detailMetadata)).not.toContain("khach@example.com");
  });
});
