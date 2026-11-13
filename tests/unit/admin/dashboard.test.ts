import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, count, gte, lt, sql, type SQL } from "drizzle-orm";
import { PgDialect, QueryBuilder } from "drizzle-orm/pg-core";

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
  ADMIN_DASHBOARD_TIMEZONE,
  ADMIN_DASHBOARD_TREND_DAYS,
  buildFourteenDayTrend,
  buildStatusDistribution,
  getAdminDashboardData,
  getVietnamCalendarDateParts,
  getVietnamLocalDateSql,
  getVietnamTrendWindow,
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
  trendRows?: Array<{ localDate: string | Date; total: number | string }>;
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

  const trendGroupBy = vi.fn().mockResolvedValue(options.trendRows ?? []);
  const trendWhere = vi.fn().mockReturnValue({ groupBy: trendGroupBy });
  const trendFrom = vi.fn().mockReturnValue({ where: trendWhere });

  mocks.select
    .mockReturnValueOnce({ from: statusFrom })
    .mockReturnValueOnce({ from: failedFrom })
    .mockReturnValueOnce({ from: sevenDaysFrom })
    .mockReturnValueOnce({ from: recentFrom })
    .mockReturnValueOnce({ from: trendFrom });

  return {
    statusGroupBy,
    failedWhere,
    sevenDaysWhere,
    recentOrderBy,
    recentLimit,
    trendWhere,
    trendGroupBy,
  };
}

describe("admin dashboard database queries", () => {
  beforeEach(() => {
    mocks.select.mockReset();
  });

  it("tính đúng các chỉ số, phân bổ trạng thái, xu hướng 14 ngày và chạy đúng 5 truy vấn song song", async () => {
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
      trendRows: [
        { localDate: "2026-10-31", total: 1 },
        { localDate: "2026-11-08", total: "3" },
        { localDate: "2026-11-13", total: 2 },
      ],
    });

    const result = await getAdminDashboardData(fixedNow);

    // Đúng 5 câu select độc lập chạy qua Promise.all (thêm 1 câu trend grouped, không N+1, không query thêm cho status breakdown)
    expect(mocks.select).toHaveBeenCalledTimes(5);

    // Kiểm tra tổng hợp đếm trạng thái (new=4, contacted=3 -> open=7, loại trừ resolved=10 và spam=2)
    expect(result.totalCount).toBe(19);
    expect(result.newCount).toBe(4);
    expect(result.openCount).toBe(7);
    expect(result.failedEmailCount).toBe(2);
    // Rolling 7-day metric giữ nguyên độc lập với tổng 7 ngày cuối của biểu đồ (6 != 5)
    expect(result.lastSevenDaysCount).toBe(6);
    expect(result.recentSubmissions).toEqual(recentRows);
    expect(result.recentSubmissions).toHaveLength(5);

    // Kiểm tra statusDistribution tái sử dụng statusGroups
    expect(result.statusDistribution).toEqual({
      total: 19,
      items: [
        { status: "new", count: 4, percentage: 21.1 },
        { status: "contacted", count: 3, percentage: 15.8 },
        { status: "resolved", count: 10, percentage: 52.6 },
        { status: "spam", count: 2, percentage: 10.5 },
      ],
    });

    // Kiểm tra xu hướng 14 ngày: đủ 14 điểm liên tiếp tăng dần, ngày thiếu điền 0
    expect(result.trend).toHaveLength(ADMIN_DASHBOARD_TREND_DAYS);
    expect(result.trend[0]).toEqual({ date: "2026-10-31", label: "31/10", count: 1 });
    expect(result.trend[8]).toEqual({ date: "2026-11-08", label: "08/11", count: 3 });
    expect(result.trend[13]).toEqual({ date: "2026-11-13", label: "13/11", count: 2 });
    expect(result.trend.filter((point) => point.count === 0)).toHaveLength(11);

    // Xác minh ngày liên tiếp tăng dần
    for (let i = 1; i < result.trend.length; i += 1) {
      const prevMs = Date.parse(`${result.trend[i - 1].date}T00:00:00Z`);
      const currMs = Date.parse(`${result.trend[i].date}T00:00:00Z`);
      expect(currMs - prevMs).toBe(86_400_000);
    }

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

    // Kiểm tra câu trend chỉ select localDate + total (không nạp bản ghi từng dòng để đếm bằng JS)
    const trendSelectCols = mocks.select.mock.calls[4]?.[0] as Record<string, unknown>;
    expect(Object.keys(trendSelectCols).sort()).toEqual(["localDate", "total"]);

    const trendWhereArg = queryMocks.trendWhere.mock.calls[0]?.[0] as SQL;
    const trendWhereCompiled = pgDialect.sqlToQuery(trendWhereArg);
    expect(trendWhereCompiled.sql).toContain('"contact_submissions"."created_at" >= $1');
    expect(trendWhereCompiled.sql).toContain('"contact_submissions"."created_at" < $2');
    // 17:30 giờ VN ngày 13/11/2026 => windowStart = 31/10 00:00+07 = 30/10 17:00Z, endExclusive = 14/11 00:00+07 = 13/11 17:00Z
    expect(trendWhereCompiled.params).toEqual([
      "2026-10-30T17:00:00.000Z",
      "2026-11-13T17:00:00.000Z",
    ]);

    const trendGroupArg = queryMocks.trendGroupBy.mock.calls[0]?.[0];
    expect(typeof trendGroupArg).toBe("function");
    const trendSelectExpr = (
      mocks.select.mock.calls[4]?.[0] as { localDate: unknown }
    ).localDate;
    expect(
      (trendGroupArg as (aliases: { localDate: unknown }) => unknown)({
        localDate: trendSelectExpr,
      })
    ).toBe(trendSelectExpr);
  });

  it("biên dịch SQL nhóm theo ngày Asia/Ho_Chi_Minh với tham số hóa an toàn", () => {
    const window = getVietnamTrendWindow(new Date("2026-11-12T17:05:00.000Z"));
    const qb = new QueryBuilder();
    const compiled = qb
      .select({
        localDate: getVietnamLocalDateSql(),
        total: count(),
      })
      .from(contactSubmissions)
      .where(
        and(
          gte(contactSubmissions.createdAt, window.startUtc),
          lt(contactSubmissions.createdAt, window.endExclusiveUtc)
        )
      )
      .groupBy(({ localDate }) => localDate)
      .toSQL();

    expect(compiled.sql).toContain(
      `to_char("created_at" AT TIME ZONE $1, 'YYYY-MM-DD') as "local_date"`
    );
    expect(compiled.sql).toContain('group by "local_date"');
    expect(compiled.params).toEqual([
      ADMIN_DASHBOARD_TIMEZONE,
      "2026-10-30T17:00:00.000Z",
      "2026-11-13T17:00:00.000Z",
    ]);
  });

  it("xác định ranh giới nửa đêm Asia/Ho_Chi_Minh chính xác khi timestamp UTC vắt qua ngày mới", () => {
    // 2026-11-12T16:59:59.999Z = 2026-11-12 23:59:59.999+07:00 (vẫn là ngày 12/11 ở VN)
    const justBeforeVnMidnight = new Date("2026-11-12T16:59:59.999Z");
    expect(getVietnamCalendarDateParts(justBeforeVnMidnight)).toEqual({
      year: 2026,
      month: 11,
      day: 12,
    });
    const beforeWindow = getVietnamTrendWindow(justBeforeVnMidnight);
    expect(beforeWindow.days[0]?.date).toBe("2026-10-30");
    expect(beforeWindow.days[13]?.date).toBe("2026-11-12");
    expect(beforeWindow.startUtc.toISOString()).toBe("2026-10-29T17:00:00.000Z");
    expect(beforeWindow.endExclusiveUtc.toISOString()).toBe("2026-11-12T17:00:00.000Z");

    // 2026-11-12T17:00:00.000Z = 2026-11-13 00:00:00.000+07:00 (đã sang ngày 13/11 ở VN)
    const exactVnMidnight = new Date("2026-11-12T17:00:00.000Z");
    expect(getVietnamCalendarDateParts(exactVnMidnight)).toEqual({
      year: 2026,
      month: 11,
      day: 13,
    });
    const midnightWindow = getVietnamTrendWindow(exactVnMidnight);
    expect(midnightWindow.days[0]?.date).toBe("2026-10-31");
    expect(midnightWindow.days[13]?.date).toBe("2026-11-13");
    expect(midnightWindow.startUtc.toISOString()).toBe("2026-10-30T17:00:00.000Z");
    expect(midnightWindow.endExclusiveUtc.toISOString()).toBe("2026-11-13T17:00:00.000Z");

    // Vượt ranh giới tháng (01/03/2026 -> 16/02/2026..01/03/2026)
    const marchFirst = getVietnamTrendWindow(new Date("2026-03-01T01:00:00.000Z"));
    expect(marchFirst.days).toHaveLength(14);
    expect(marchFirst.days[0]).toEqual({ date: "2026-02-16", label: "16/02" });
    expect(marchFirst.days[13]).toEqual({ date: "2026-03-01", label: "01/03" });
  });

  it("buildFourteenDayTrend và buildStatusDistribution xử lý giá trị rỗng, làm tròn phần trăm và biên bất thường an toàn", () => {
    const window = getVietnamTrendWindow(new Date("2026-11-13T05:00:00.000Z"));
    const trend = buildFourteenDayTrend(
      [
        { localDate: new Date("2026-11-12T00:00:00.000Z"), total: 2 },
        { localDate: "2026-11-13", total: 3 },
        { localDate: "2026-11-13", total: 1 },
        { localDate: "2026-11-10", total: -5 },
        { localDate: "2026-11-09", total: "not-a-number" },
      ],
      window.days
    );
    expect(trend[12]?.count).toBe(2);
    expect(trend[13]?.count).toBe(4);
    expect(trend[10]?.count).toBe(0);
    expect(trend[9]?.count).toBe(0);

    // Làm tròn 1 chữ số thập phân mà không ép tổng giả bằng 100
    const threeWay = buildStatusDistribution(
      { new: 1, contacted: 1, resolved: 1, spam: 0 },
      3
    );
    expect(threeWay).toEqual({
      total: 3,
      items: [
        { status: "new", count: 1, percentage: 33.3 },
        { status: "contacted", count: 1, percentage: 33.3 },
        { status: "resolved", count: 1, percentage: 33.3 },
        { status: "spam", count: 0, percentage: 0 },
      ],
    });
    for (const item of threeWay.items) {
      expect(Number.isFinite(item.percentage)).toBe(true);
    }

    // Tổng bằng 0 -> không chia cho 0, mọi phần trăm là 0 hữu hạn
    const emptyDist = buildStatusDistribution(
      { new: 0, contacted: 0, resolved: 0, spam: 0 },
      0
    );
    expect(emptyDist.total).toBe(0);
    expect(emptyDist.items.every((item) => item.count === 0 && item.percentage === 0)).toBe(
      true
    );
  });

  it("xử lý an toàn khi bảng trống và các nhóm trạng thái thiếu mặc định về 0", async () => {
    setupDashboardSelectMocks({
      statusGroups: [],
      failedEmailTotal: 0,
      lastSevenDaysTotal: 0,
      recentRows: [],
      trendRows: [],
    });

    const emptyResult = await getAdminDashboardData(
      new Date("2026-11-13T00:00:00.000Z")
    );

    expect(emptyResult.totalCount).toBe(0);
    expect(emptyResult.newCount).toBe(0);
    expect(emptyResult.openCount).toBe(0);
    expect(emptyResult.failedEmailCount).toBe(0);
    expect(emptyResult.lastSevenDaysCount).toBe(0);
    expect(emptyResult.recentSubmissions).toEqual([]);
    expect(emptyResult.trend).toHaveLength(14);
    expect(emptyResult.trend.every((point) => point.count === 0)).toBe(true);
    expect(emptyResult.statusDistribution).toEqual({
      total: 0,
      items: [
        { status: "new", count: 0, percentage: 0 },
        { status: "contacted", count: 0, percentage: 0 },
        { status: "resolved", count: 0, percentage: 0 },
        { status: "spam", count: 0, percentage: 0 },
      ],
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
      trendRows: [],
    });

    const closedOnlyResult = await getAdminDashboardData();
    expect(closedOnlyResult.totalCount).toBe(8);
    expect(closedOnlyResult.newCount).toBe(0);
    expect(closedOnlyResult.openCount).toBe(0);
    expect(closedOnlyResult.failedEmailCount).toBe(1);
    expect(closedOnlyResult.lastSevenDaysCount).toBe(4);
    expect(closedOnlyResult.statusDistribution).toEqual({
      total: 8,
      items: [
        { status: "new", count: 0, percentage: 0 },
        { status: "contacted", count: 0, percentage: 0 },
        { status: "resolved", count: 5, percentage: 62.5 },
        { status: "spam", count: 3, percentage: 37.5 },
      ],
    });
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
      trendRows: [],
    });

    const contactedOnlyResult = await getAdminDashboardData();
    expect(contactedOnlyResult.totalCount).toBe(18);
    expect(contactedOnlyResult.newCount).toBe(0);
    expect(contactedOnlyResult.openCount).toBe(6);
    expect(contactedOnlyResult.statusDistribution.items).toEqual([
      { status: "new", count: 0, percentage: 0 },
      { status: "contacted", count: 6, percentage: 33.3 },
      { status: "resolved", count: 12, percentage: 66.7 },
      { status: "spam", count: 0, percentage: 0 },
    ]);
  });

  it("không tự nuốt lỗi database thành số 0 giả", async () => {
    const dbError = new Error("Database connection timeout");
    mocks.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockRejectedValue(dbError),
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([]),
          then: undefined,
        }),
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
        trendRows: [],
      });

      const result = await getAdminDashboardData();

      const sevenDaysWhereArg = queryMocks.sevenDaysWhere.mock.calls[0]?.[0] as SQL;
      const sevenDaysCompiled = pgDialect.sqlToQuery(sevenDaysWhereArg);
      expect(sevenDaysCompiled.params).toEqual(["2026-11-06T12:00:00.000Z"]);
      expect(result.trend[13]?.date).toBe("2026-11-13");
    } finally {
      vi.useRealTimers();
    }
  });
});
