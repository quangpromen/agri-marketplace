import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql, type SQL } from "drizzle-orm";
import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  execute: vi.fn(),
  batch: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    execute: mocks.execute,
    batch: mocks.batch,
  },
}));

import {
  adminNotificationReads,
  adminNotificationStates,
  contactSubmissions,
} from "@/db/schema";
import {
  formatAdminRelativeTime,
  formatNotificationBadgeCount,
} from "@/lib/admin-contact-presentation";
import {
  ADMIN_NOTIFICATION_DROPDOWN_LIMIT,
  adminUserIdSchema,
  parseAdminNotificationSummary,
} from "@/schemas/admin-notifications";
import {
  ensureAdminNotificationState,
  getAdminNotificationSummary,
  markAllAdminNotificationsSeen,
} from "@/server/admin/notifications";

const pgDialect = new PgDialect();
const require = createRequire(import.meta.url);

type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => Array<Record<string, unknown>>;
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
};

type SqliteDatabase = {
  exec: (sqlText: string) => void;
  prepare: (sqlText: string) => SqliteStatement;
  close: () => void;
};

function createRelationalNotificationDb(): SqliteDatabase {
  const { DatabaseSync } = require("node:sqlite") as {
    DatabaseSync: new (path: string) => SqliteDatabase;
  };
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE "user" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "email" TEXT NOT NULL
    );

    CREATE TABLE "contact_submissions" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "service" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'new',
      "email_status" TEXT NOT NULL DEFAULT 'pending',
      "created_at" TEXT NOT NULL,
      "updated_at" TEXT NOT NULL
    );

    CREATE TABLE "admin_notification_states" (
      "admin_user_id" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "last_seen_at" TEXT NOT NULL,
      "created_at" TEXT NOT NULL,
      "updated_at" TEXT NOT NULL
    );

    CREATE TABLE "admin_notification_reads" (
      "admin_user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "contact_submission_id" TEXT NOT NULL REFERENCES "contact_submissions"("id") ON DELETE CASCADE,
      "read_at" TEXT NOT NULL,
      PRIMARY KEY ("admin_user_id", "contact_submission_id")
    );

    CREATE INDEX "admin_notification_reads_contact_submission_id_idx"
      ON "admin_notification_reads" ("contact_submission_id");
  `);
  return sqlite;
}

function sha256File(relativePath: string): string {
  const fullPath = join(process.cwd(), relativePath);
  return createHash("sha256").update(readFileSync(fullPath)).digest("hex");
}

function setupStateLookupMock(lastSeenAt: Date | null) {
  const limit = vi.fn().mockResolvedValue(lastSeenAt ? [{ lastSeenAt }] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValueOnce({ from });
  return { limit, where, from };
}

function createFakeQuery(tag: string) {
  return { __queryTag: tag };
}

function setupUnreadNotExistsQueriesMock(options: {
  total: number;
  serverTime?: Date | string;
  rows: Array<Record<string, unknown>>;
}) {
  // 1) inner subquery: db.select({ one }).from(adminNotificationReads).where(...)
  const innerWhere = vi.fn().mockReturnValue(createFakeQuery("notExistsSubquery"));
  const innerFrom = vi.fn().mockReturnValue({ where: innerWhere });

  // 2) outer count query: db.select({ total, serverTime }).from(contactSubmissions).where(notExists)
  const countQueryObj = createFakeQuery("countQuery");
  const countWhere = vi.fn().mockReturnValue(countQueryObj);
  const countFrom = vi.fn().mockReturnValue({ where: countWhere });

  // 3) outer list query: db.select(cols).from(contactSubmissions).where(notExists).orderBy(...).limit(...)
  const listQueryObj = createFakeQuery("listQuery");
  const listLimit = vi.fn().mockReturnValue(listQueryObj);
  const listOrderBy = vi.fn().mockReturnValue({ limit: listLimit });
  const listWhere = vi.fn().mockReturnValue({ orderBy: listOrderBy });
  const listFrom = vi.fn().mockReturnValue({ where: listWhere });

  mocks.select
    .mockReturnValueOnce({ from: innerFrom })
    .mockReturnValueOnce({ from: countFrom })
    .mockReturnValueOnce({ from: listFrom });

  mocks.batch.mockResolvedValueOnce([
    [
      {
        total: options.total,
        ...(options.serverTime !== undefined
          ? { serverTime: options.serverTime }
          : {}),
      },
    ],
    options.rows,
  ]);

  return {
    innerWhere,
    countWhere,
    listWhere,
    listOrderBy,
    listLimit,
  };
}

describe("admin notification schemas & presentation helpers", () => {
  it("formatNotificationBadgeCount ẩn khi <= 0, hiển thị đúng số đến 99 và 99+ khi vượt 99", () => {
    expect(formatNotificationBadgeCount(0)).toBeNull();
    expect(formatNotificationBadgeCount(-3)).toBeNull();
    expect(formatNotificationBadgeCount(Number.NaN)).toBeNull();
    expect(formatNotificationBadgeCount(1)).toBe("1");
    expect(formatNotificationBadgeCount(42)).toBe("42");
    expect(formatNotificationBadgeCount(99)).toBe("99");
    expect(formatNotificationBadgeCount(100)).toBe("99+");
    expect(formatNotificationBadgeCount(240)).toBe("99+");
  });

  it("formatAdminRelativeTime định dạng tiếng Việt chính xác và an toàn với input bất thường", () => {
    const now = new Date("2026-11-14T10:00:00.000Z");

    expect(formatAdminRelativeTime(null, now)).toBe("—");
    expect(formatAdminRelativeTime("invalid-date", now)).toBe("—");
    expect(
      formatAdminRelativeTime(new Date("2026-11-14T09:59:30.000Z"), now)
    ).toBe("Vừa xong");
    expect(
      formatAdminRelativeTime(new Date("2026-11-14T10:01:00.000Z"), now)
    ).toBe("Vừa xong");
    expect(
      formatAdminRelativeTime(new Date("2026-11-14T09:45:00.000Z"), now)
    ).toBe("15 phút trước");
    expect(
      formatAdminRelativeTime(new Date("2026-11-14T07:00:00.000Z"), now)
    ).toBe("3 giờ trước");
    expect(
      formatAdminRelativeTime(new Date("2026-11-12T10:00:00.000Z"), now)
    ).toBe("2 ngày trước");
    expect(
      formatAdminRelativeTime(new Date("2026-10-31T10:00:00.000Z"), now)
    ).toBe("2 tuần trước");
    expect(
      formatAdminRelativeTime(new Date("2026-09-01T10:00:00.000Z"), now)
    ).toContain("01/09/2026");
  });

  it("parseAdminNotificationSummary chỉ chấp nhận payload đúng allowlist", () => {
    const valid = {
      unreadCount: 1,
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          customerName: "Nguyễn Văn An",
          serviceLabel: "Mua nông sản / Hộp rau gia đình",
          createdAt: "2026-11-14T09:55:00.000Z",
          relativeTime: "5 phút trước",
          detailUrl: "/admin/lien-he/550e8400-e29b-41d4-a716-446655440001",
        },
      ],
      serverTime: "2026-11-14T10:00:00.000Z",
    };

    expect(parseAdminNotificationSummary(valid)).toEqual(valid);
    expect(
      parseAdminNotificationSummary({
        ...valid,
        items: [{ ...valid.items[0], email: "leak@example.com" }],
      })
    ).toBeNull();
    expect(parseAdminNotificationSummary({ unreadCount: -1 })).toBeNull();
    expect(adminUserIdSchema.safeParse("  ").success).toBe(false);
  });
});

describe("migration 0002 immutability & migration 0003 read-receipt schema", () => {
  it("giữ nguyên vẹn từng byte của migration 0002 và bổ sung forward-only migration 0003 hợp lệ", () => {
    expect(sha256File("drizzle/0002_flimsy_the_captain.sql")).toBe(
      "50fa33ff570911b4dd1b1ff25843357b0e4b777fdcae58cc9a4312f6795bd6be"
    );
    expect(sha256File("drizzle/meta/0002_snapshot.json")).toBe(
      "99b3ac951418060173455d5fab8aec632b9d3ed3a2391402aa8b6d3b54e4a13d"
    );

    const journal = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle/meta/_journal.json"), "utf8")
    ) as {
      entries: Array<{ idx: number; when: number; tag: string }>;
    };
    expect(journal.entries[2]).toEqual({
      idx: 2,
      version: "7",
      when: 1794636313952,
      tag: "0002_flimsy_the_captain",
      breakpoints: true,
    });
    expect(journal.entries[3]?.idx).toBe(3);
    expect(journal.entries[3]?.tag).toBe("0003_easy_thanos");

    const migration0003 = readFileSync(
      join(process.cwd(), "drizzle/0003_easy_thanos.sql"),
      "utf8"
    );
    expect(migration0003).toContain('CREATE TABLE "admin_notification_reads"');
    expect(migration0003).toContain(
      'PRIMARY KEY("admin_user_id","contact_submission_id")'
    );
    expect(migration0003).toContain('ON DELETE cascade');
    expect(migration0003).toContain(
      'CREATE INDEX "admin_notification_reads_contact_submission_id_idx" ON "admin_notification_reads" USING btree ("contact_submission_id");'
    );
    expect(migration0003).toContain(
      'INSERT INTO "admin_notification_reads" ("admin_user_id", "contact_submission_id", "read_at")'
    );
    expect(migration0003).toContain('"cs"."created_at" <= "ans"."last_seen_at"');
    expect(migration0003).toContain(
      'ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING'
    );
    expect(migration0003).not.toMatch(/DROP TABLE|DROP COLUMN/i);

    const snapshot0003 = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle/meta/0003_snapshot.json"), "utf8")
    ) as {
      prevId: string;
      tables: {
        "public.admin_notification_reads": {
          indexes: Record<
            string,
            { name: string; columns: Array<{ expression: string }>; method: string }
          >;
        };
      };
    };
    const snapshot0002 = JSON.parse(
      readFileSync(join(process.cwd(), "drizzle/meta/0002_snapshot.json"), "utf8")
    ) as { id: string };
    expect(snapshot0003.prevId).toBe(snapshot0002.id);
    expect(
      snapshot0003.tables["public.admin_notification_reads"].indexes[
        "admin_notification_reads_contact_submission_id_idx"
      ]
    ).toMatchObject({
      name: "admin_notification_reads_contact_submission_id_idx",
      columns: [expect.objectContaining({ expression: "contact_submission_id" })],
      method: "btree",
    });

    const tableConfig = getTableConfig(adminNotificationReads);
    expect(tableConfig.name).toBe("admin_notification_reads");
    expect(tableConfig.primaryKeys[0]?.columns.map((c) => c.name)).toEqual([
      "admin_user_id",
      "contact_submission_id",
    ]);
    expect(tableConfig.indexes).toHaveLength(1);
    expect(tableConfig.indexes[0]?.config.name).toBe(
      "admin_notification_reads_contact_submission_id_idx"
    );
    expect(
      tableConfig.indexes[0]?.config.columns.map((col) =>
        "name" in col ? col.name : ""
      )
    ).toEqual(["contact_submission_id"]);
    expect(tableConfig.foreignKeys).toHaveLength(2);
    expect(tableConfig.foreignKeys.every((fk) => fk.onDelete === "cascade")).toBe(
      true
    );
  });
});

describe("admin notifications database queries (Drizzle + PgDialect)", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.insert.mockReset();
    mocks.update.mockReset();
    mocks.execute.mockReset();
    mocks.batch.mockReset();
  });

  it("lần truy cập đầu tiên chạy CTE nguyên tử (tạo state + read receipts hiện có) với ON CONFLICT DO NOTHING và trả về 0", async () => {
    const initializedAt = new Date("2026-11-14T06:00:00.000Z");
    setupStateLookupMock(null);
    mocks.execute.mockResolvedValueOnce({
      rows: [{ lastSeenAt: initializedAt.toISOString() }],
    });

    const summary = await getAdminNotificationSummary("admin-first");

    expect(mocks.execute).toHaveBeenCalledTimes(1);
    const cteArg = mocks.execute.mock.calls[0]?.[0] as SQL;
    const compiledCte = pgDialect.sqlToQuery(cteArg);
    expect(compiledCte.sql).toContain('INSERT INTO "admin_notification_states"');
    expect(compiledCte.sql).toContain('ON CONFLICT ("admin_user_id") DO NOTHING');
    expect(compiledCte.sql).toContain('INSERT INTO "admin_notification_reads"');
    expect(compiledCte.sql).toContain('FROM "inserted_state"');
    expect(compiledCte.sql).toContain('CROSS JOIN "contact_submissions" AS "cs"');
    expect(compiledCte.sql).toContain(
      'ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING'
    );
    expect(compiledCte.params).toEqual(["admin-first"]);
    expect(mocks.batch).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();

    expect(summary).toEqual({
      unreadCount: 0,
      items: [],
      serverTime: initializedAt.toISOString(),
    });
  });

  it("xử lý tranh chấp khởi tạo đồng thời (ON CONFLICT DO NOTHING trả rỗng) bằng cách đọc lại state thắng mà không nhân đôi read receipt", async () => {
    const winnerTimestamp = new Date("2026-11-14T06:00:00.000Z");
    setupStateLookupMock(null);
    mocks.execute.mockResolvedValueOnce({ rows: [] });
    setupStateLookupMock(winnerTimestamp);

    setupUnreadNotExistsQueriesMock({
      total: 0,
      serverTime: winnerTimestamp,
      rows: [],
    });

    const summary = await getAdminNotificationSummary("admin-race");

    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    expect(summary).toEqual({
      unreadCount: 0,
      items: [],
      serverTime: winnerTimestamp.toISOString(),
    });
  });

  it("ném lỗi có kiểm soát nếu đọc lại state sau xung đột không tồn tại", async () => {
    setupStateLookupMock(null);
    mocks.execute.mockResolvedValueOnce({ rows: [] });
    setupStateLookupMock(null);

    await expect(ensureAdminNotificationState("admin-missing")).rejects.toThrow(
      "Không thể khởi tạo trạng thái thông báo quản trị viên."
    );
  });

  it("dùng NOT EXISTS trên admin_notification_reads, sắp xếp createdAt DESC rồi id DESC, giới hạn 5 và không chọn/trả PII", async () => {
    const lastSeenAt = new Date("2026-11-14T08:00:00.000Z");
    const serverTime = new Date("2026-11-14T10:00:00.000Z");

    setupStateLookupMock(lastSeenAt);

    const unreadRows = [
      {
        id: "550e8400-e29b-41d4-a716-446655440006",
        name: "Khách Sáu",
        service: "hop-rau-tuan",
        createdAt: new Date("2026-11-14T09:58:00.000Z"),
        email: "secret6@example.com",
        phone: "0912000006",
        message: "NỘI DUNG BÍ MẬT",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        name: "Khách Năm",
        service: "cung-ung-bep-an",
        createdAt: new Date("2026-11-14T09:40:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "Khách Bốn",
        service: "chuyen-giao-ky-thuat",
        createdAt: new Date("2026-11-14T09:30:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Khách Ba",
        service: "tham-quan-nong-trai",
        createdAt: new Date("2026-11-14T09:20:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Khách Hai",
        service: "khac",
        createdAt: new Date("2026-11-14T09:10:00.000Z"),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Khách Một (dư)",
        service: "khac",
        createdAt: new Date("2026-11-14T09:05:00.000Z"),
      },
    ];

    const queryMocks = setupUnreadNotExistsQueriesMock({
      total: 142,
      serverTime,
      rows: unreadRows,
    });

    const summary = await getAdminNotificationSummary("admin-1");

    // Kiểm tra NOT EXISTS thay vì created_at > last_seen_at
    const compiledInnerWhere = pgDialect.sqlToQuery(
      queryMocks.innerWhere.mock.calls[0]?.[0] as SQL
    );
    expect(compiledInnerWhere.sql).toContain(
      '"admin_notification_reads"."admin_user_id" = $1'
    );
    expect(compiledInnerWhere.sql).toContain(
      '"admin_notification_reads"."contact_submission_id" = "contact_submissions"."id"'
    );
    expect(compiledInnerWhere.params).toEqual(["admin-1"]);

    const countWhereSql = pgDialect.sqlToQuery(
      queryMocks.countWhere.mock.calls[0]?.[0] as SQL
    ).sql;
    expect(countWhereSql.toLowerCase()).toContain("not exists");
    expect(countWhereSql).not.toContain("last_seen_at");

    // Kiểm tra sort deterministic: createdAt DESC, id DESC
    const orderArgs = queryMocks.listOrderBy.mock.calls[0] as SQL[];
    expect(orderArgs).toHaveLength(2);
    const compiledOrder = pgDialect.sqlToQuery(sql.join(orderArgs, sql`, `));
    expect(compiledOrder.sql).toContain('"contact_submissions"."created_at" desc');
    expect(compiledOrder.sql).toContain('"contact_submissions"."id" desc');

    // Limit = 5
    expect(queryMocks.listLimit).toHaveBeenCalledWith(
      ADMIN_NOTIFICATION_DROPDOWN_LIMIT
    );
    expect(ADMIN_NOTIFICATION_DROPDOWN_LIMIT).toBe(5);

    // SELECT chỉ gồm đúng 4 cột an toàn
    const listSelectCols = mocks.select.mock.calls[3]?.[0] as Record<
      string,
      unknown
    >;
    expect(Object.keys(listSelectCols).sort()).toEqual([
      "createdAt",
      "id",
      "name",
      "service",
    ]);
    expect("email" in listSelectCols).toBe(false);
    expect("phone" in listSelectCols).toBe(false);
    expect("message" in listSelectCols).toBe(false);
    expect("status" in listSelectCols).toBe(false);
    expect("emailStatus" in listSelectCols).toBe(false);

    expect(summary.unreadCount).toBe(142);
    expect(summary.items).toHaveLength(5);
    expect(summary.serverTime).toBe(serverTime.toISOString());
    expect(summary.items[0]).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440006",
      customerName: "Khách Sáu",
      serviceLabel: "Mua nông sản / Hộp rau gia đình",
      createdAt: "2026-11-14T09:58:00.000Z",
      relativeTime: "2 phút trước",
      detailUrl: "/admin/lien-he/550e8400-e29b-41d4-a716-446655440006",
    });

    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("secret6@example.com");
    expect(serialized).not.toContain("0912000006");
    expect(serialized).not.toContain("NỘI DUNG BÍ MẬT");
    expect(serialized).not.toContain("Khách Một (dư)");
  });

  it("markAllAdminNotificationsSeen dùng db.batch chèn read receipts ON CONFLICT DO NOTHING, cập nhật state admin hiện tại và không chạm contact_submissions", async () => {
    const updatedAt = new Date("2026-11-14T10:05:00.000Z");

    mocks.execute.mockResolvedValueOnce({
      rows: [
        {
          adminUserId: "admin-2",
          lastSeenAt: updatedAt,
          receiptsCreated: 3,
          auditLogId: "550e8400-e29b-41d4-a716-446655440088",
        },
      ],
    });

    const result = await markAllAdminNotificationsSeen("admin-2");

    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.insert).not.toHaveBeenCalledWith(contactSubmissions);
    expect(mocks.update).not.toHaveBeenCalled();

    const compiledCte = pgDialect.sqlToQuery(
      mocks.execute.mock.calls[0]?.[0] as SQL
    );
    expect(compiledCte.sql).toContain('INSERT INTO "admin_notification_reads"');
    expect(compiledCte.sql).toContain(
      'ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING'
    );
    expect(compiledCte.sql).toContain('INSERT INTO "admin_notification_states"');
    expect(compiledCte.sql).toContain('INSERT INTO "admin_audit_logs"');
    expect(compiledCte.sql).not.toContain('UPDATE "contact_submissions"');
    expect(compiledCte.params).toContain("admin-2");
    expect(compiledCte.params).toContain("notifications.mark_all_seen");
    expect(result).toEqual({
      ok: true,
      lastSeenAt: updatedAt.toISOString(),
      receiptsCreated: 3,
    });
  });

  it("từ chối adminUserId rỗng và không gọi DB", async () => {
    await expect(getAdminNotificationSummary("   ")).rejects.toThrow();
    await expect(markAllAdminNotificationsSeen("")).rejects.toThrow();
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.batch).not.toHaveBeenCalled();
  });
});

describe("read-receipt relational semantics & backfill simulation (SQL engine)", () => {
  it("backfill từ admin_notification_states, xử lý late-commit, idempotency, độc lập multi-admin, cascade và giữ nguyên contact status", () => {
    const sqlDb = createRelationalNotificationDb();
    try {
      sqlDb
        .prepare(`INSERT INTO "user" ("id", "email") VALUES (?, ?)`)
        .run("admin-1", "admin1@mocfarm.local");
      sqlDb
        .prepare(`INSERT INTO "user" ("id", "email") VALUES (?, ?)`)
        .run("admin-2", "admin2@mocfarm.local");

      const insertContact = sqlDb.prepare(`
        INSERT INTO "contact_submissions"
          ("id", "name", "phone", "email", "service", "message", "status", "email_status", "created_at", "updated_at")
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Dữ liệu lịch sử trước last_seen_at và sau last_seen_at của admin-1
      insertContact.run(
        "c-01",
        "Khách Cũ 1",
        "0901000001",
        "old1@example.com",
        "khac",
        "Nội dung bí mật 1",
        "new",
        "pending",
        "2026-11-14T08:00:00.000Z",
        "2026-11-14T08:00:00.000Z"
      );
      insertContact.run(
        "c-02",
        "Khách Cũ Bằng Mốc",
        "0901000002",
        "old2@example.com",
        "khac",
        "Nội dung bí mật 2",
        "contacted",
        "sent",
        "2026-11-14T09:00:00.000Z",
        "2026-11-14T09:00:00.000Z"
      );
      insertContact.run(
        "c-03",
        "Khách Mới Sau Mốc",
        "0901000003",
        "new3@example.com",
        "hop-rau-tuan",
        "Nội dung bí mật 3",
        "new",
        "sent",
        "2026-11-14T09:30:00.000Z",
        "2026-11-14T09:30:00.000Z"
      );

      // Giả lập trạng thái 0002 đã deploy cho admin-1 (last_seen_at = 09:00)
      sqlDb
        .prepare(`
          INSERT INTO "admin_notification_states" ("admin_user_id", "last_seen_at", "created_at", "updated_at")
          VALUES (?, ?, ?, ?)
        `)
        .run(
          "admin-1",
          "2026-11-14T09:00:00.000Z",
          "2026-11-14T08:30:00.000Z",
          "2026-11-14T09:00:00.000Z"
        );

      // 1) Thực thi logic backfill của migration 0003 (chạy lặp lại 2 lần phải an toàn ON CONFLICT DO NOTHING)
      const backfillSql = `
        INSERT INTO "admin_notification_reads" ("admin_user_id", "contact_submission_id", "read_at")
        SELECT "ans"."admin_user_id", "cs"."id", "ans"."last_seen_at"
        FROM "admin_notification_states" AS "ans"
        INNER JOIN "contact_submissions" AS "cs"
          ON "cs"."created_at" <= "ans"."last_seen_at"
        ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING
      `;
      sqlDb.exec(backfillSql);
      sqlDb.exec(backfillSql);

      const getUnreadForAdmin = (adminId: string) =>
        sqlDb
          .prepare(`
            SELECT "cs"."id", "cs"."name", "cs"."service", "cs"."created_at"
            FROM "contact_submissions" AS "cs"
            WHERE NOT EXISTS (
              SELECT 1
              FROM "admin_notification_reads" AS "r"
              WHERE "r"."admin_user_id" = ?
                AND "r"."contact_submission_id" = "cs"."id"
            )
            ORDER BY "cs"."created_at" DESC, "cs"."id" DESC
            LIMIT 5
          `)
          .all(adminId);

      // admin-1 chỉ thấy c-03 là chưa đọc
      expect(getUnreadForAdmin("admin-1").map((row) => row.id)).toEqual(["c-03"]);

      // 2) admin-2 truy cập lần đầu đồng thời (gọi init CTE logic 2 lần -> không tạo bản ghi trùng)
      const runFirstInit = (adminId: string, initTs: string) => {
        sqlDb.exec("BEGIN");
        const inserted = sqlDb
          .prepare(`
            INSERT INTO "admin_notification_states" ("admin_user_id", "last_seen_at", "created_at", "updated_at")
            VALUES (?, ?, ?, ?)
            ON CONFLICT ("admin_user_id") DO NOTHING
            RETURNING "admin_user_id", "last_seen_at"
          `)
          .all(adminId, initTs, initTs, initTs);

        if (inserted.length > 0) {
          sqlDb
            .prepare(`
              INSERT INTO "admin_notification_reads" ("admin_user_id", "contact_submission_id", "read_at")
              SELECT ?, "id", ?
              FROM "contact_submissions"
              WHERE 1 = 1
              ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING
            `)
            .run(adminId, initTs);
        }
        sqlDb.exec("COMMIT");
      };

      runFirstInit("admin-2", "2026-11-14T10:00:00.000Z");
      runFirstInit("admin-2", "2026-11-14T10:00:00.500Z");

      // Tất cả historical contacts đã được đánh dấu cho admin-2 -> 0 unread
      expect(getUnreadForAdmin("admin-2")).toEqual([]);
      // admin-1 vẫn độc lập -> vẫn còn c-03
      expect(getUnreadForAdmin("admin-1").map((row) => row.id)).toEqual(["c-03"]);

      // 3) Thêm 2 yêu cầu mới để kiểm tra mark-all idempotent + late commit có createdAt <= lastSeenAt cũ
      insertContact.run(
        "c-04",
        "Khách Mới 4",
        "0901000004",
        "new4@example.com",
        "khac",
        "Nội dung 4",
        "new",
        "pending",
        "2026-11-14T10:01:00.000Z",
        "2026-11-14T10:01:00.000Z"
      );

      // Mark-all cho admin-1 chạy 2 lần (idempotent)
      const markAll = (adminId: string, markTs: string) => {
        sqlDb.exec("BEGIN");
        sqlDb
          .prepare(`
            INSERT INTO "admin_notification_reads" ("admin_user_id", "contact_submission_id", "read_at")
            SELECT ?, "cs"."id", ?
            FROM "contact_submissions" AS "cs"
            WHERE NOT EXISTS (
              SELECT 1 FROM "admin_notification_reads" AS "r"
              WHERE "r"."admin_user_id" = ? AND "r"."contact_submission_id" = "cs"."id"
            )
            ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING
          `)
          .run(adminId, markTs, adminId);
        sqlDb
          .prepare(`
            INSERT INTO "admin_notification_states" ("admin_user_id", "last_seen_at", "created_at", "updated_at")
            VALUES (?, ?, ?, ?)
            ON CONFLICT ("admin_user_id") DO UPDATE SET
              "last_seen_at" = excluded."last_seen_at",
              "updated_at" = excluded."updated_at"
          `)
          .run(adminId, markTs, markTs, markTs);
        sqlDb.exec("COMMIT");
      };

      markAll("admin-1", "2026-11-14T10:05:00.000Z");
      markAll("admin-1", "2026-11-14T10:05:01.000Z");
      expect(getUnreadForAdmin("admin-1")).toEqual([]);
      // admin-2 không bị ảnh hưởng bởi mark-all của admin-1 -> vẫn thấy c-04 chưa đọc
      expect(getUnreadForAdmin("admin-2").map((row) => row.id)).toEqual(["c-04"]);

      // 4) Mô phỏng contact commit muộn sau mark-all dù createdAt NHỎ HƠN lastSeenAt của admin-1 (08:50 <= 10:05)
      insertContact.run(
        "c-late",
        "Khách Commit Muộn",
        "0901000005",
        "late@example.com",
        "khac",
        "Nội dung late commit",
        "new",
        "pending",
        "2026-11-14T08:50:00.000Z",
        "2026-11-14T10:06:00.000Z"
      );

      // Vì không có read receipt trong admin_notification_reads nên c-late PHẢI vẫn unread cho cả hai admin!
      expect(getUnreadForAdmin("admin-1").map((row) => row.id)).toEqual(["c-late"]);
      expect(getUnreadForAdmin("admin-2").map((row) => row.id)).toEqual([
        "c-04",
        "c-late",
      ]);

      // Kiểm tra trạng thái workflow status & email_status không bao giờ bị thay đổi
      const statuses = sqlDb
        .prepare(`SELECT "id", "status", "email_status" FROM "contact_submissions" ORDER BY "id"`)
        .all();
      expect(statuses).toEqual([
        { id: "c-01", status: "new", email_status: "pending" },
        { id: "c-02", status: "contacted", email_status: "sent" },
        { id: "c-03", status: "new", email_status: "sent" },
        { id: "c-04", status: "new", email_status: "pending" },
        { id: "c-late", status: "new", email_status: "pending" },
      ]);

      // 5) Kiểm tra cascade delete khi xóa contact submission hoặc admin user
      sqlDb.prepare(`DELETE FROM "contact_submissions" WHERE "id" = ?`).run("c-01");
      const readsForDeletedContact = sqlDb
        .prepare(`SELECT COUNT(*) AS "cnt" FROM "admin_notification_reads" WHERE "contact_submission_id" = ?`)
        .get("c-01");
      expect(readsForDeletedContact?.cnt).toBe(0);

      sqlDb.prepare(`DELETE FROM "user" WHERE "id" = ?`).run("admin-1");
      const admin1States = sqlDb
        .prepare(`SELECT COUNT(*) AS "cnt" FROM "admin_notification_states" WHERE "admin_user_id" = ?`)
        .get("admin-1");
      const admin1Reads = sqlDb
        .prepare(`SELECT COUNT(*) AS "cnt" FROM "admin_notification_reads" WHERE "admin_user_id" = ?`)
        .get("admin-1");
      const admin2Reads = sqlDb
        .prepare(`SELECT COUNT(*) AS "cnt" FROM "admin_notification_reads" WHERE "admin_user_id" = ?`)
        .get("admin-2");
      expect(admin1States?.cnt).toBe(0);
      expect(admin1Reads?.cnt).toBe(0);
      expect(Number(admin2Reads?.cnt)).toBeGreaterThan(0);
    } finally {
      sqlDb.close();
    }
  });
});
