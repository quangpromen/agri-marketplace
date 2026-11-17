import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
  },
}));

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_PAGE_SIZE,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  decodeAdminAuditCursor,
  encodeAdminAuditCursor,
} from "@/schemas/admin-audit";
import {
  buildAdminAuditCursorCondition,
  buildAdminAuditWhereClause,
  listAdminAuditLogs,
} from "@/server/admin/audit-logs";

const pgDialect = new PgDialect();

type StoredAuditRow = {
  id: string;
  actorUserId: string | null;
  actorNameSnapshot: string | null;
  actorEmailSnapshot: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  result: string;
  changes: unknown;
  metadata: unknown;
  createdAt: Date;
};

function makeUuid(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `550e8400-e29b-41d4-a716-${hex}`;
}

function setupSelectMockOnce(rows: StoredAuditRow[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValueOnce({ from });
  return { from, where, orderBy, limit };
}

function compareDesc(a: StoredAuditRow, b: StoredAuditRow): number {
  const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return b.id.localeCompare(a.id);
}

function compareAsc(a: StoredAuditRow, b: StoredAuditRow): number {
  return -compareDesc(a, b);
}

describe("admin audit-logs read queries & keyset cursor pagination", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@mocfarm.vn" },
      session: { id: "sess-1", userId: "admin-1", token: "tok-1" },
    });
    mocks.select.mockReset();
  });

  it("gọi requireAdmin trước khi truy vấn DB và từ chối người chưa đăng nhập", async () => {
    const callOrder: string[] = [];

    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/login")
    );
    await expect(listAdminAuditLogs()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );
    expect(mocks.select).not.toHaveBeenCalled();

    mocks.requireAdmin.mockImplementationOnce(async () => {
      callOrder.push("requireAdmin");
      return {
        user: { id: "admin-1", name: "Admin", email: "admin@mocfarm.vn" },
        session: { id: "sess-1", userId: "admin-1", token: "tok" },
      };
    });

    const limit = vi.fn().mockImplementation(async () => {
      callOrder.push("db.select");
      return [];
    });
    mocks.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({ limit }),
        }),
      }),
    });

    await listAdminAuditLogs();
    expect(callOrder).toEqual(["requireAdmin", "db.select"]);
  });

  it("biên dịch SQL đúng sắp xếp created_at DESC, id DESC, LIMIT 26, không OFFSET và bộ lọc tham số hóa", async () => {
    const fixedNow = new Date("2026-11-17T12:00:00.000Z");
    const cursorDate = new Date("2026-11-16T08:00:00.000Z");
    const cursorId = makeUuid(42);

    const nextCursor = decodeAdminAuditCursor(
      encodeAdminAuditCursor({ createdAt: cursorDate, id: cursorId }, "next")
    )!;
    const prevCursor = decodeAdminAuditCursor(
      encodeAdminAuditCursor({ createdAt: cursorDate, id: cursorId }, "prev")
    )!;

    // 1) Bộ lọc đơn lẻ 24h, 7d, 30d và kết hợp với cursor
    const where24h = pgDialect.sqlToQuery(
      buildAdminAuditWhereClause({ period: "24h" }, fixedNow)!
    );
    expect(where24h.sql).toContain('"admin_audit_logs"."created_at" >= $1');
    expect(where24h.params).toEqual(["2026-11-16T12:00:00.000Z"]);

    const where7d = pgDialect.sqlToQuery(
      buildAdminAuditWhereClause({ period: "7d" }, fixedNow)!
    );
    expect(where7d.params).toEqual(["2026-11-10T12:00:00.000Z"]);

    const where30d = pgDialect.sqlToQuery(
      buildAdminAuditWhereClause({ period: "30d" }, fixedNow)!
    );
    expect(where30d.params).toEqual(["2026-10-18T12:00:00.000Z"]);

    const combinedWhere = pgDialect.sqlToQuery(
      buildAdminAuditWhereClause(
        {
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          result: ADMIN_AUDIT_RESULTS.FAILURE,
          period: "7d",
          cursor: nextCursor,
        },
        fixedNow
      )!
    );
    expect(combinedWhere.sql).toContain('"admin_audit_logs"."action" = $1');
    expect(combinedWhere.sql).toContain('"admin_audit_logs"."result" = $2');
    expect(combinedWhere.sql).toContain(
      '"admin_audit_logs"."created_at" >= $3'
    );
    expect(combinedWhere.sql).toContain('"admin_audit_logs"."created_at" < $4');
    expect(combinedWhere.sql).toContain('"admin_audit_logs"."created_at" = $5');
    expect(combinedWhere.sql).toContain('"admin_audit_logs"."id" < $6');
    expect(combinedWhere.params).toEqual([
      "auth.login_failed",
      "failure",
      "2026-11-10T12:00:00.000Z",
      cursorDate.toISOString(),
      cursorDate.toISOString(),
      cursorId,
    ]);

    const prevCondition = pgDialect.sqlToQuery(
      buildAdminAuditCursorCondition(prevCursor)!
    );
    expect(prevCondition.sql).toContain('"admin_audit_logs"."created_at" > $1');
    expect(prevCondition.sql).toContain('"admin_audit_logs"."created_at" = $2');
    expect(prevCondition.sql).toContain('"admin_audit_logs"."id" > $3');

    // 2) Kiểm tra query từ listAdminAuditLogs: LIMIT 26, không có .offset, sort DESC
    const querySpy = setupSelectMockOnce([]);
    const result = await listAdminAuditLogs(
      {
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        period: "30d",
      },
      fixedNow
    );

    expect(ADMIN_AUDIT_PAGE_SIZE).toBe(25);
    expect(querySpy.limit).toHaveBeenCalledWith(26);
    expect("offset" in querySpy.limit.mock.results[0]!).toBe(false);

    const orderArgs = querySpy.orderBy.mock.calls[0] as SQL[];
    expect(orderArgs).toHaveLength(2);
    const compiledOrder = pgDialect.sqlToQuery(sql.join(orderArgs, sql`, `));
    expect(compiledOrder.sql).toContain('"admin_audit_logs"."created_at" desc');
    expect(compiledOrder.sql).toContain('"admin_audit_logs"."id" desc');

    expect(result).toEqual({
      items: [],
      pageSize: 25,
      hasNextPage: false,
      hasPreviousPage: false,
      nextCursor: null,
      previousCursor: null,
      isFirstPage: true,
    });
  });

  it("phân trang keyset 3 trang (tiến và lùi) bảo toàn thứ tự và không trùng/sót bản ghi trùng createdAt", async () => {
    // 60 bản ghi, trong đó nhóm 20..35 có CÙNG timestamp chính xác để kiểm tra tie-break theo id
    const tiedTimestamp = new Date("2026-11-15T10:00:00.000Z");
    const dataset: StoredAuditRow[] = Array.from({ length: 60 }, (_, idx) => {
      const seq = 60 - idx; // 60 (mới nhất) -> 1 (cũ nhất)
      const isTied = seq >= 20 && seq <= 35;
      const createdAt = isTied
        ? tiedTimestamp
        : new Date(Date.UTC(2026, 10, 15, 10, seq < 20 ? 0 : 1, seq));

      return {
        id: makeUuid(seq),
        actorUserId: "admin-1",
        actorNameSnapshot: "Admin",
        actorEmailSnapshot: "admin@mocfarm.vn",
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
        targetId: makeUuid(1000 + seq),
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        changes: { status: { from: "new", to: "contacted" } },
        metadata: null,
        createdAt,
      };
    }).sort(compareDesc);

    expect(dataset).toHaveLength(60);

    // Giả lập tập dữ liệu SQL keyset (limit 26)
    const runStatefulSelect = (
      filters: Parameters<typeof listAdminAuditLogs>[0] = {}
    ) => {
      const cursor = filters?.cursor;
      let matching = [...dataset];

      if (cursor?.direction === "next") {
        matching = matching
          .filter(
            (row) =>
              row.createdAt.getTime() < cursor.createdAt.getTime() ||
              (row.createdAt.getTime() === cursor.createdAt.getTime() &&
                row.id.localeCompare(cursor.id) < 0)
          )
          .sort(compareDesc);
      } else if (cursor?.direction === "prev") {
        matching = matching
          .filter(
            (row) =>
              row.createdAt.getTime() > cursor.createdAt.getTime() ||
              (row.createdAt.getTime() === cursor.createdAt.getTime() &&
                row.id.localeCompare(cursor.id) > 0)
          )
          .sort(compareAsc);
      } else {
        matching.sort(compareDesc);
      }

      setupSelectMockOnce(matching.slice(0, 26));
      return listAdminAuditLogs(filters);
    };

    // Trang 1 (mục 0..24)
    const page1 = await runStatefulSelect();
    expect(page1.items).toHaveLength(25);
    expect(page1.isFirstPage).toBe(true);
    expect(page1.hasPreviousPage).toBe(false);
    expect(page1.previousCursor).toBeNull();
    expect(page1.hasNextPage).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    // Trang 2 (mục 25..49 — cắt ngang nhóm có cùng tiedTimestamp!)
    const page2 = await runStatefulSelect({
      cursor: decodeAdminAuditCursor(page1.nextCursor)!,
    });
    expect(page2.items).toHaveLength(25);
    expect(page2.isFirstPage).toBe(false);
    expect(page2.hasPreviousPage).toBe(true);
    expect(page2.hasNextPage).toBe(true);
    expect(page2.previousCursor).toBeTruthy();
    expect(page2.nextCursor).toBeTruthy();

    // Trang 3 (mục 50..59 — 10 bản ghi cuối)
    const page3 = await runStatefulSelect({
      cursor: decodeAdminAuditCursor(page2.nextCursor)!,
    });
    expect(page3.items).toHaveLength(10);
    expect(page3.isFirstPage).toBe(false);
    expect(page3.hasPreviousPage).toBe(true);
    expect(page3.hasNextPage).toBe(false);
    expect(page3.nextCursor).toBeNull();
    expect(page3.previousCursor).toBeTruthy();

    // Toàn bộ 60 ID trên 3 trang phải khớp chính xác tập dataset, không trùng, không sót
    const forwardIds = [
      ...page1.items.map((item) => item.id),
      ...page2.items.map((item) => item.id),
      ...page3.items.map((item) => item.id),
    ];
    expect(forwardIds).toEqual(dataset.map((row) => row.id));
    expect(new Set(forwardIds).size).toBe(60);

    // Lùi từ Trang 3 -> Trang 2
    const backToPage2 = await runStatefulSelect({
      cursor: decodeAdminAuditCursor(page3.previousCursor)!,
    });
    expect(backToPage2.items.map((i) => i.id)).toEqual(
      page2.items.map((i) => i.id)
    );
    expect(backToPage2.isFirstPage).toBe(false);
    expect(backToPage2.hasPreviousPage).toBe(true);
    expect(backToPage2.hasNextPage).toBe(true);

    // Lùi từ Trang 2 -> Trang 1
    const backToPage1 = await runStatefulSelect({
      cursor: decodeAdminAuditCursor(backToPage2.previousCursor)!,
    });
    expect(backToPage1.items.map((i) => i.id)).toEqual(
      page1.items.map((i) => i.id)
    );
    expect(backToPage1.isFirstPage).toBe(true);
    expect(backToPage1.hasPreviousPage).toBe(false);
    expect(backToPage1.previousCursor).toBeNull();
    expect(backToPage1.hasNextPage).toBe(true);
  });

  it("xử lý an toàn stale prev cursor (quay về trang đầu) và lọc bỏ bản ghi DB không hợp lệ / trường thừa", async () => {
    const stalePrevCursor = decodeAdminAuditCursor(
      encodeAdminAuditCursor(
        { createdAt: "2026-11-20T00:00:00.000Z", id: makeUuid(99) },
        "prev"
      )
    )!;

    const validFallbackRow: StoredAuditRow = {
      id: makeUuid(1),
      actorUserId: "admin-1",
      actorNameSnapshot: "Quản\tTrị",
      actorEmailSnapshot: "ADMIN@MocFarm.vn",
      action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
      targetId: "admin-1",
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      changes: { leakedSecret: "should-not-appear" },
      metadata: { receiptsCreated: 2, customerEmail: "leak@example.com" },
      createdAt: new Date("2026-11-15T09:00:00.000Z"),
    };

    const unsupportedActionRow: StoredAuditRow = {
      ...validFallbackRow,
      id: makeUuid(2),
      action: "legacy.unknown",
    };

    // Lần select 1 (prev cursor không có bản ghi mới hơn) -> rỗng -> fallback select trang đầu
    setupSelectMockOnce([]);
    setupSelectMockOnce([validFallbackRow, unsupportedActionRow]);

    const result = await listAdminAuditLogs({ cursor: stalePrevCursor });
    expect(mocks.select).toHaveBeenCalledTimes(2);
    expect(result.isFirstPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
    expect(result.hasNextPage).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: makeUuid(1),
      actorUserId: "admin-1",
      actorNameSnapshot: "Quản Trị",
      actorEmailSnapshot: "admin@mocfarm.vn",
      action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
      targetId: "admin-1",
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      detailSummary: {
        kind: "notifications_mark_all_seen",
        receiptsCreated: null, // metadata có field thừa nên rơi về an toàn
      },
      createdAt: new Date("2026-11-15T09:00:00.000Z"),
    });
    expect(JSON.stringify(result)).not.toContain("should-not-appear");
    expect(JSON.stringify(result)).not.toContain("leak@example.com");
  });

  it("không nuốt lỗi database thành danh sách rỗng giả", async () => {
    mocks.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("Neon timeout")),
          }),
        }),
      }),
    });

    await expect(listAdminAuditLogs()).rejects.toThrow("Neon timeout");
  });
});
