import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAdminDashboardData: vi.fn(),
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

vi.mock("@/server/admin/dashboard", () => ({
  getAdminDashboardData: mocks.getAdminDashboardData,
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
import AdminDashboardPage, {
  metadata as dashboardMetadata,
} from "@/app/(admin)/admin/(protected)/page";
import AdminContactListPage from "@/app/(admin)/admin/(protected)/lien-he/page";
import AdminContactDetailNotFound from "@/app/(admin)/admin/(protected)/lien-he/[id]/not-found";
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
    mocks.getAdminDashboardData.mockReset();
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

  it("trang chi tiết không hiển thị cảnh báo lỗi email khi đã gửi và giữ văn bản thuần nếu email/SĐT không an toàn để gắn liên kết", async () => {
    mocks.getContactSubmissionById.mockResolvedValueOnce({
      id: VALID_UUID,
      name: "Trần An",
      phone: "javascript:alert(1)",
      email: "user@example.com?subject=inject",
      service: "cung-ung-bep-an",
      message: "Cần báo giá cung ứng rau sạch hàng tuần.",
      status: "contacted",
      emailStatus: "sent",
      createdAt: new Date("2026-11-12T08:30:00Z"),
      updatedAt: new Date("2026-11-12T09:00:00Z"),
    });

    const html = renderToStaticMarkup(
      await AdminContactDetailPage({
        params: { id: VALID_UUID },
        searchParams: {},
      })
    );

    expect(html).not.toContain("Email thông báo đã gửi thất bại");
    expect(html).not.toContain('href="mailto:');
    expect(html).not.toContain('href="tel:');
    expect(html).toContain("user@example.com?subject=inject");
    expect(html).toContain("javascript:alert(1)");
  });

  it("giao diện not-found hiển thị thông báo rõ ràng và liên kết quay lại danh sách", () => {
    const html = renderToStaticMarkup(React.createElement(AdminContactDetailNotFound));

    expect(html).toContain("Không tìm thấy yêu cầu tư vấn");
    expect(html).toContain('href="/admin/lien-he"');
    expect(html).toContain("Quay lại danh sách yêu cầu");
  });

  it("trang danh sách hỗ trợ lọc status=open (Chưa xử lý) và period=7d (7 ngày gần nhất), giữ qua phân trang và quay lại từ chi tiết", async () => {
    mocks.listContactSubmissions.mockResolvedValueOnce({
      items: [
        {
          id: VALID_UUID,
          name: "Phạm Thị Hoa",
          phone: "0901234567",
          email: "hoa@example.com",
          service: "hop-rau-tuan",
          status: "new",
          emailStatus: "sent",
          createdAt: new Date("2026-11-12T08:30:00Z"),
        },
      ],
      totalCount: 42,
      page: 2,
      pageSize: 20,
      totalPages: 3,
      isOutOfRange: false,
    });

    const listHtml = renderToStaticMarkup(
      await AdminContactListPage({
        searchParams: { status: "open", period: "7d", page: "2" },
      })
    );

    expect(mocks.listContactSubmissions).toHaveBeenCalledWith({
      status: "open",
      period: "7d",
      page: 2,
    });
    expect(listHtml).toContain('value="open"');
    expect(listHtml).toContain("Chưa xử lý");
    expect(listHtml).toContain('value="7d"');
    expect(listHtml).toContain("7 ngày gần nhất");
    expect(listHtml).toContain("Xoá bộ lọc");
    expect(listHtml).toContain('href="/admin/lien-he?status=open&amp;period=7d"');
    expect(listHtml).toContain(
      'href="/admin/lien-he?status=open&amp;period=7d&amp;page=3"'
    );
    expect(listHtml).toContain(
      `href="/admin/lien-he/${VALID_UUID}?status=open&amp;period=7d&amp;page=2"`
    );

    mocks.getContactSubmissionById.mockResolvedValueOnce({
      id: VALID_UUID,
      name: "Phạm Thị Hoa",
      phone: "0901234567",
      email: "hoa@example.com",
      service: "hop-rau-tuan",
      message: "Cần đặt rau hữu cơ.",
      status: "new",
      emailStatus: "sent",
      createdAt: new Date("2026-11-12T08:30:00Z"),
      updatedAt: new Date("2026-11-12T08:30:00Z"),
    });

    const detailHtml = renderToStaticMarkup(
      await AdminContactDetailPage({
        params: { id: VALID_UUID },
        searchParams: { status: "open", period: "7d", page: "2" },
      })
    );

    expect(detailHtml).toContain(
      'href="/admin/lien-he?status=open&amp;period=7d&amp;page=2"'
    );
    expect(detailHtml).not.toContain('<option value="open"');
  });

  it("người chưa đăng nhập không truy cập được dashboard /admin và không truy vấn dữ liệu dashboard", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );

    await expect(AdminDashboardPage()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );
    expect(mocks.getAdminDashboardData).not.toHaveBeenCalled();
  });

  it("dashboard /admin gọi requireAdmin trước khi truy vấn, hiển thị 5 chỉ số, liên kết lọc, 5 yêu cầu mới nhất và không lộ token hay PII khách hàng", async () => {
    const callOrder: string[] = [];

    mocks.requireAdmin.mockImplementationOnce(async () => {
      callOrder.push("requireAdmin");
      return {
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
      };
    });

    const recentIds = [
      "550e8400-e29b-41d4-a716-446655440011",
      "550e8400-e29b-41d4-a716-446655440012",
      "550e8400-e29b-41d4-a716-446655440013",
      "550e8400-e29b-41d4-a716-446655440014",
      "550e8400-e29b-41d4-a716-446655440015",
    ];

    mocks.getAdminDashboardData.mockImplementationOnce(async () => {
      callOrder.push("getAdminDashboardData");
      return {
        totalCount: 1250,
        newCount: 42,
        openCount: 120,
        failedEmailCount: 3,
        lastSevenDaysCount: 18,
        recentSubmissions: [
          {
            id: recentIds[0],
            name: "Khách Hàng Một",
            service: "hop-rau-tuan",
            status: "new",
            emailStatus: "failed",
            createdAt: new Date("2026-11-13T09:00:00Z"),
            // Giả lập phòng ngừa nếu object có field thừa ở runtime cũng không được render ra HTML
            email: "secret-customer-1@example.com",
            phone: "0988111222",
            message: "TIN_NHAN_KHONG_DUOC_HIEN_THI",
          },
          {
            id: recentIds[1],
            name: "Khách Hàng Hai",
            service: "cung-ung-bep-an",
            status: "contacted",
            emailStatus: "sent",
            createdAt: new Date("2026-11-12T10:00:00Z"),
          },
          {
            id: recentIds[2],
            name: "Khách Hàng Ba",
            service: "chuyen-giao-ky-thuat",
            status: "resolved",
            emailStatus: "sent",
            createdAt: new Date("2026-11-11T10:00:00Z"),
          },
          {
            id: recentIds[3],
            name: "Khách Hàng Bốn",
            service: "tham-quan-nong-trai",
            status: "spam",
            emailStatus: "pending",
            createdAt: new Date("2026-11-10T10:00:00Z"),
          },
          {
            id: recentIds[4],
            name: "Khách Hàng Năm",
            service: "khac",
            status: "new",
            emailStatus: "sent",
            createdAt: new Date("2026-11-09T10:00:00Z"),
          },
        ],
      };
    });

    const html = renderToStaticMarkup(await AdminDashboardPage());

    expect(callOrder).toEqual(["requireAdmin", "getAdminDashboardData"]);

    // Tiêu đề và lời chào
    expect(html).toContain("Trang quản trị Mộc Farm");
    expect(html).toContain("Quản trị viên");

    // 5 thẻ chỉ số và số đã format
    expect(html).toContain("Tổng yêu cầu");
    expect(html).toContain("1.250");
    expect(html).toContain("Yêu cầu mới");
    expect(html).toContain("42");
    expect(html).toContain("Chưa xử lý");
    expect(html).toContain("120");
    expect(html).toContain("Email gửi thất bại");
    expect(html).toContain("Cần kiểm tra");
    expect(html).toContain("7 ngày gần nhất");
    expect(html).toContain("18");

    // 5 liên kết đúng tới /admin/lien-he với bộ lọc tương ứng
    expect(html).toContain('href="/admin/lien-he"');
    expect(html).toContain('href="/admin/lien-he?status=new"');
    expect(html).toContain('href="/admin/lien-he?status=open"');
    expect(html).toContain('href="/admin/lien-he?emailStatus=failed"');
    expect(html).toContain('href="/admin/lien-he?period=7d"');

    // Khối 5 yêu cầu mới nhất
    expect(html).toContain("Yêu cầu mới nhất");
    expect(html).toContain("Xem tất cả yêu cầu");
    expect(html).toContain("Khách Hàng Một");
    expect(html).toContain("Khách Hàng Năm");
    expect(html).toContain("Mua nông sản / Hộp rau gia đình");
    expect(html).toContain("Cung ứng cho nhà hàng / Siêu thị");
    expect(html).toContain("Mới");
    expect(html).toContain("Đã liên hệ");
    expect(html).toContain("Đã xử lý");
    expect(html).toContain("Spam");
    expect(html).toContain("Gửi thất bại");
    expect(html).toContain("Đã gửi");
    expect(html).toContain("Đang chờ");
    expect(html).toContain("Xem chi tiết");

    for (const id of recentIds) {
      expect(html).toContain(`href="/admin/lien-he/${id}"`);
    }

    // Không rò rỉ session token hoặc PII khách hàng
    expect(html).not.toContain(SECRET_SESSION_TOKEN);
    expect(html).not.toContain("secret-customer-1@example.com");
    expect(html).not.toContain("0988111222");
    expect(html).not.toContain("TIN_NHAN_KHONG_DUOC_HIEN_THI");

    // Metadata noIndex và không chứa PII
    expect(dashboardMetadata.robots).toEqual({ index: false, follow: false });
    expect(JSON.stringify(dashboardMetadata)).not.toContain("admin@mocfarm.vn");
  });

  it("dashboard /admin hiển thị empty state rõ ràng và các chỉ số bằng 0 khi chưa có yêu cầu nào", async () => {
    mocks.getAdminDashboardData.mockResolvedValueOnce({
      totalCount: 0,
      newCount: 0,
      openCount: 0,
      failedEmailCount: 0,
      lastSevenDaysCount: 0,
      recentSubmissions: [],
    });

    const html = renderToStaticMarkup(await AdminDashboardPage());

    expect(html).toContain("Chưa có yêu cầu tư vấn nào");
    expect(html).toContain("Yêu cầu mới nhất");
    expect(html).toContain("Xem tất cả yêu cầu");
    expect(html).toContain('href="/admin/lien-he"');
    expect(html.match(/>0<\/p>/g)).toHaveLength(5);
    expect(html).not.toContain("Cần kiểm tra");
    expect(html).not.toContain("<table");
  });
});
