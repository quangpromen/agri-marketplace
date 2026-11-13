import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
  },
}));

import { contactSubmissions } from "@/db/schema";
import {
  ADMIN_DASHBOARD_RECENT_LIMIT,
  getAdminDashboardData,
} from "@/server/admin/dashboard";

const pgDialect = new PgDialect();

function setupDashboardSelectMocks(options: {
  statusGroups: Array<{ status: string; total: number | string }>;
  failedEmailTotal: number | string;
  lastSevenDaysTotal: number | string;
  recentRows: Array<{
    id: string;
    name: string;
    service: string;
    status: "new" | "contacted" | "resolved" | "spam";
    emailStatus: "pending" | "sent" | "failed";
    createdAt: Date;
  }>;
}) {
  const statusGroupBy = vi.fn().mockResolvedValue(options.statusGroups);
  const statusFrom = vi.fn().mockReturnValue({ groupBy: statusGroupBy });

  const failedWhere = vi.fn().mockResolvedValue([{ total: options.failedEmailTotal }]);
  const failedFrom = vi.fn().mockReturnValue({ where: failedWhere });

  const sevenDaysWhere = vi
    .fn()
    .mockResolvedValue([{ total: options.lastSevenDaysTotal }]);
  const sevenDaysFrom = vi.fn().mockReturnValue({ where: sevenDaysWhere });

  const recentLimit = vi.fn().mockResolvedValue(options.recentRows);
  const recentOrderBy = vi.fn().mockReturnValue({ limit: recentLimit });
  const recentFrom = vi.fn().mockReturnValue({ orderBy: recentOrderBy });

  mocks.select
    .mockReturnValueOnce({ from: statusFrom })
    .mockReturnValueOnce({ from: failedFrom })
    .mockReturnValueOnce({ from: sevenDaysFrom })
    .mockReturnValueOnce({ from: recentFrom });

  return {
    statusGroupBy,
    failedWhere,
    sevenDaysWhere,
    recentOrderBy,
    recentLimit,
  };
}

describe("admin dashboard database queries", () => {
  beforeEach(() => {
    mocks.select.mockReset();
  });

  it("tính đúng totalCount, newCount, openCount (loại trừ resolved và spam), failedEmailCount và lastSevenDaysCount", async () => {
    const fixedNow = new Date("2026-11-13T10:30:00.000Z");
    const expectedSevenDaysAgo = new Date("2026-11-06T10:30:00.000Z");

    const recentRows = [
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Nguyễn Văn An",
        service: "hop-rau-tuan",
        status: "new" as const,
        emailStatus: "failed" as const,
        createdAt: new Date("2026-11-13T09:00:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "Trần Thị Bình",
        service: "cung-ung-bep-an",
        status: "contacted" as const,
        emailStatus: "sent" as const,
        createdAt: new Date("2026-11-12T15:00:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Lê Minh Châu",
        service: "chuyen-giao-ky-thuat",
        status: "resolved" as const,
        emailStatus: "sent" as const,
        createdAt: new Date("2026-11-11T08:00:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Phạm Quốc Dũng",
        service: "tham-quan-nong-trai",
        status: "spam" as const,
        emailStatus: "pending" as const,
        createdAt: new Date("2026-11-10T11:00:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Hoàng Lan",
        service: "khac",
        status: "new" as const,
        emailStatus: "sent" as const,
        createdAt: new Date("2026-11-09T07:30:00.000Z"),
      },
    ];

    const queryMocks = setupDashboardSelectMocks({
      statusGroups: [
        { status: "new", total: 4 },
        { status: "contacted", total: 3 },
        { status: "resolved", total: 10 },
        { status: "spam", total: 2 },
      ],
      failedEmailTotal: 2,
      lastSevenDaysTotal: 6,
      recentRows,
    });

    const result = await getAdminDashboardData(fixedNow);

    // Không có N+1: luôn đúng 4 câu select độc lập chạy qua Promise.all
    expect(mocks.select).toHaveBeenCalledTimes(4);

    // Kiểm tra tổng hợp đếm trạng thái (new=4, contacted=3 -> open=7, loại trừ resolved=10 và spam=2)
    expect(result.totalCount).toBe(19);
    expect(result.newCount).toBe(4);
    expect(result.openCount).toBe(7);
    expect(result.failedEmailCount).toBe(2);
    expect(result.lastSevenDaysCount).toBe(6);
    expect(result.recentSubmissions).toEqual(recentRows);
    expect(result.recentSubmissions).toHaveLength(5);

    // Kiểm tra groupBy status
    expect(queryMocks.statusGroupBy).toHaveBeenCalledWith(contactSubmissions.status);

    // Kiểm tra điều kiện emailStatus = 'failed'
    const failedWhereArg = queryMocks.failedWhere.mock.calls[0]?.[0] as SQL;
    const failedCompiled = pgDialect.sqlToQuery(failedWhereArg);
    expect(failedCompiled.sql).toContain('"contact_submissions"."email_status" = $1');
    expect(failedCompiled.params).toEqual(["failed"]);

    // Kiểm tra điều kiện createdAt >= sevenDaysAgo với fixedNow
    const sevenDaysWhereArg = queryMocks.sevenDaysWhere.mock.calls[0]?.[0] as SQL;
    const sevenDaysCompiled = pgDialect.sqlToQuery(sevenDaysWhereArg);
    expect(sevenDaysCompiled.sql).toContain('"contact_submissions"."created_at" >= $1');
    expect(sevenDaysCompiled.params).toEqual([expectedSevenDaysAgo.toISOString()]);

    // Kiểm tra sort recent list theo createdAt DESC, id DESC và limit 5
    const orderArgs = queryMocks.recentOrderBy.mock.calls[0] as SQL[];
    expect(orderArgs).toHaveLength(2);
    const compiledOrder = pgDialect.sqlToQuery(sql.join(orderArgs, sql`, `));
    expect(compiledOrder.sql).toContain('"contact_submissions"."created_at" desc');
    expect(compiledOrder.sql).toContain('"contact_submissions"."id" desc');
    expect(queryMocks.recentLimit).toHaveBeenCalledWith(ADMIN_DASHBOARD_RECENT_LIMIT);
    expect(ADMIN_DASHBOARD_RECENT_LIMIT).toBe(5);

    // Kiểm tra danh sách recent không select message, phone, email
    const recentSelectCols = mocks.select.mock.calls[3]?.[0] as Record<
      string,
      unknown
    >;
    expect(Object.keys(recentSelectCols).sort()).toEqual([
      "createdAt",
      "emailStatus",
      "id",
      "name",
      "service",
      "status",
    ]);
    expect("message" in recentSelectCols).toBe(false);
    expect("phone" in recentSelectCols).toBe(false);
    expect("email" in recentSelectCols).toBe(false);
    expect("updatedAt" in recentSelectCols).toBe(false);
  });

  it("xử lý an toàn khi bảng trống và các nhóm trạng thái thiếu mặc định về 0", async () => {
    setupDashboardSelectMocks({
      statusGroups: [],
      failedEmailTotal: 0,
      lastSevenDaysTotal: 0,
      recentRows: [],
    });

    const emptyResult = await getAdminDashboardData(
      new Date("2026-11-13T00:00:00.000Z")
    );

    expect(emptyResult).toEqual({
      totalCount: 0,
      newCount: 0,
      openCount: 0,
      failedEmailCount: 0,
      lastSevenDaysCount: 0,
      recentSubmissions: [],
    });

    mocks.select.mockReset();

    // Chỉ có resolved và spam -> newCount = 0, openCount = 0
    setupDashboardSelectMocks({
      statusGroups: [
        { status: "resolved", total: "5" },
        { status: "spam", total: "3" },
      ],
      failedEmailTotal: "1",
      lastSevenDaysTotal: "4",
      recentRows: [],
    });

    const closedOnlyResult = await getAdminDashboardData();
    expect(closedOnlyResult.totalCount).toBe(8);
    expect(closedOnlyResult.newCount).toBe(0);
    expect(closedOnlyResult.openCount).toBe(0);
    expect(closedOnlyResult.failedEmailCount).toBe(1);
    expect(closedOnlyResult.lastSevenDaysCount).toBe(4);
  });

  it("chỉ tính openCount từ new + contacted khi thiếu một trong hai nhóm", async () => {
    setupDashboardSelectMocks({
      statusGroups: [
        { status: "contacted", total: 6 },
        { status: "resolved", total: 12 },
      ],
      failedEmailTotal: 0,
      lastSevenDaysTotal: 6,
      recentRows: [],
    });

    const contactedOnlyResult = await getAdminDashboardData();
    expect(contactedOnlyResult.totalCount).toBe(18);
    expect(contactedOnlyResult.newCount).toBe(0);
    expect(contactedOnlyResult.openCount).toBe(6);
  });

  it("không tự nuốt lỗi database thành số 0 giả", async () => {
    const dbError = new Error("Database connection timeout");
    mocks.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockRejectedValue(dbError),
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(getAdminDashboardData()).rejects.toThrow(
      "Database connection timeout"
    );
  });

  it("mặc định sử dụng thời gian hiện tại của hệ thống khi không truyền tham số now", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-13T12:00:00.000Z"));
      const queryMocks = setupDashboardSelectMocks({
        statusGroups: [],
        failedEmailTotal: 0,
        lastSevenDaysTotal: 0,
        recentRows: [],
      });

      await getAdminDashboardData();

      const sevenDaysWhereArg = queryMocks.sevenDaysWhere.mock.calls[0]?.[0] as SQL;
      const sevenDaysCompiled = pgDialect.sqlToQuery(sevenDaysWhereArg);
      expect(sevenDaysCompiled.params).toEqual(["2026-11-06T12:00:00.000Z"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
