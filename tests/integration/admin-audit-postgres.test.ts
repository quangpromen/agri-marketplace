import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/pg-proxy";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";

const PG_BIN = process.env.PG_BIN_DIR ?? "C:\\Program Files\\PostgreSQL\\18\\bin";
const INITDB = join(PG_BIN, process.platform === "win32" ? "initdb.exe" : "initdb");
const POSTGRES = join(
  PG_BIN,
  process.platform === "win32" ? "postgres.exe" : "postgres"
);
const PG_ISREADY = join(
  PG_BIN,
  process.platform === "win32" ? "pg_isready.exe" : "pg_isready"
);
const PG_CTL = join(
  PG_BIN,
  process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl"
);
const CREATEDB = join(
  PG_BIN,
  process.platform === "win32" ? "createdb.exe" : "createdb"
);
const PSQL = join(PG_BIN, process.platform === "win32" ? "psql.exe" : "psql");

const PG_PORT = "55441";
const DB_NAME = "moc_farm_audit_it";
const PG_NULL_SENTINEL = "__PG_INTEGRATION_NULL__";

let clusterRootDir = "";
let pgDataDir = "";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSqlParamLiteral(value: unknown, index: number): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  const rawText =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

  if (rawText.includes("\u0000")) {
    throw new Error("Null byte is not allowed in SQL parameter.");
  }

  let tag = `p${index}`;
  while (rawText.includes(`$${tag}$`)) {
    tag += "_x";
  }

  const quoted = `$${tag}$${rawText}$${tag}$`;
  return value instanceof Date ? `${quoted}::timestamptz` : quoted;
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') {
          currentCell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (ch === "\r") {
      if (csvText[i + 1] === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else if (ch === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += ch;
    }
  }

  if (inQuotes || currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function decodeCsvCell(rawCell: string): unknown {
  return rawCell === PG_NULL_SENTINEL ? null : rawCell;
}

async function runPsqlStatementAsync(
  sqlText: string,
  params: unknown[] = []
): Promise<{ headers: string[]; rows: unknown[][] }> {
  const preparedBlock =
    params.length === 0
      ? sqlText
      : [
          `PREPARE _drizzle_stmt AS ${sqlText};`,
          `EXECUTE _drizzle_stmt(${params
            .map((param, idx) => formatSqlParamLiteral(param, idx))
            .join(", ")});`,
          "DEALLOCATE _drizzle_stmt;",
        ].join("\n");

  const fullStdin = `\\pset null '${PG_NULL_SENTINEL}'\n${preparedBlock}\n`;

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      PSQL,
      [
        "-h",
        "127.0.0.1",
        "-p",
        PG_PORT,
        "-U",
        "postgres",
        "-d",
        DB_NAME,
        "-v",
        "ON_ERROR_STOP=1",
        "-X",
        "-q",
        "--csv",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, PGCLIENTENCODING: "UTF8" },
      }
    );

    let out = "";
    let err = "";
    child.stdout.on("data", (chunk: Buffer) => {
      out += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      err += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(out);
      } else {
        reject(new Error(`psql failed (${code}): ${err.trim()}`));
      }
    });
    child.stdin.write(fullStdin, "utf8");
    child.stdin.end();
  });

  if (!stdout.trim()) {
    return { headers: [], rows: [] };
  }

  const parsed = parseCsvRows(stdout);
  if (parsed.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = parsed;
  const headers = headerRow ?? [];
  const rows = dataRows
    .filter((row) => row.length === headers.length)
    .map((row) => row.map(decodeCsvCell));

  return { headers, rows };
}

function runPsqlSync(sqlText: string, params: unknown[] = []) {
  const preparedBlock =
    params.length === 0
      ? sqlText
      : [
          `PREPARE _drizzle_sync AS ${sqlText};`,
          `EXECUTE _drizzle_sync(${params
            .map((param, idx) => formatSqlParamLiteral(param, idx))
            .join(", ")});`,
          "DEALLOCATE _drizzle_sync;",
        ].join("\n");

  return execFileSync(
    PSQL,
    [
      "-h",
      "127.0.0.1",
      "-p",
      PG_PORT,
      "-U",
      "postgres",
      "-d",
      DB_NAME,
      "-v",
      "ON_ERROR_STOP=1",
      "-X",
      "-q",
      "-t",
      "-A",
    ],
    {
      input: `${preparedBlock}\n`,
      encoding: "utf8",
      env: { ...process.env, PGCLIENTENCODING: "UTF8" },
    }
  ).trim();
}

const proxyDb = drizzle(
  async (sqlText, params, method) => {
    const { headers, rows } = await runPsqlStatementAsync(sqlText, params);

    if (method === "all") {
      return { rows };
    }

    const objectRows = rows.map((rowValues) => {
      const record: Record<string, unknown> = {};
      headers.forEach((col, idx) => {
        record[col] = rowValues[idx];
      });
      return record;
    });

    return { rows: objectRows };
  },
  { schema }
);

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  get db() {
    return proxyDb;
  },
}));

vi.mock("@/server/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  decodeAdminAuditCursor,
} from "@/schemas/admin-audit";
import { writeTransactionalAdminAuditLog } from "@/server/admin/audit-log";
import { listAdminAuditLogs } from "@/server/admin/audit-logs";
import { updateContactSubmissionStatus } from "@/server/admin/contact-submissions";
import { markAllAdminNotificationsSeen } from "@/server/admin/notifications";

const ADMIN_ID = "admin-pg-user-1";
const CONTACT_1 = "550e8400-e29b-41d4-a716-446655440001";
const CONTACT_2 = "550e8400-e29b-41d4-a716-446655440002";
const CONTACT_3 = "550e8400-e29b-41d4-a716-446655440003";

async function waitForPostgresReady(): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    try {
      execFileSync(
        PG_ISREADY,
        ["-h", "127.0.0.1", "-p", PG_PORT, "-U", "postgres"],
        { stdio: "ignore" }
      );
      return;
    } catch {
      await sleep(150);
    }
  }
  throw new Error("Disposable PostgreSQL did not become ready in time.");
}

describe("Disposable PostgreSQL 18 integration tests (real migrations 0000-0004)", () => {
  beforeAll(async () => {
    clusterRootDir = mkdtempSync(join(tmpdir(), "mocfarm-pg-it-"));
    pgDataDir = join(clusterRootDir, "pgdata");
    const pgLogPath = join(clusterRootDir, "postgres.log");

    execFileSync(
      INITDB,
      [
        "-D",
        pgDataDir,
        "-U",
        "postgres",
        "-A",
        "trust",
        "--encoding=UTF8",
        "--no-locale",
      ],
      { stdio: "pipe" }
    );

    execFileSync(
      PG_CTL,
      [
        "-D",
        pgDataDir,
        "-l",
        pgLogPath,
        "-o",
        `-F -p ${PG_PORT} -h 127.0.0.1`,
        "start",
      ],
      { stdio: "ignore" }
    );

    await waitForPostgresReady();

    execFileSync(
      CREATEDB,
      ["-h", "127.0.0.1", "-p", PG_PORT, "-U", "postgres", DB_NAME],
      { stdio: "pipe" }
    );

    const migrationFiles = [
      "drizzle/0000_lyrical_albert_cleary.sql",
      "drizzle/0001_pink_sasquatch.sql",
      "drizzle/0002_flimsy_the_captain.sql",
      "drizzle/0003_easy_thanos.sql",
      "drizzle/0004_nice_dreaming_celestial.sql",
    ];

    for (const relPath of migrationFiles) {
      execFileSync(
        PSQL,
        [
          "-h",
          "127.0.0.1",
          "-p",
          PG_PORT,
          "-U",
          "postgres",
          "-d",
          DB_NAME,
          "-v",
          "ON_ERROR_STOP=1",
          "-X",
          "-q",
          "-f",
          join(process.cwd(), relPath),
        ],
        {
          stdio: "pipe",
          env: { ...process.env, PGCLIENTENCODING: "UTF8" },
        }
      );
    }
  });

  afterAll(async () => {
    if (pgDataDir && existsSync(pgDataDir)) {
      try {
        execFileSync(PG_CTL, ["-D", pgDataDir, "-m", "immediate", "stop"], {
          stdio: "ignore",
        });
      } catch {
        // ignore cleanup error
      }
      await sleep(300);
    }

    if (clusterRootDir && existsSync(clusterRootDir)) {
      try {
        rmSync(clusterRootDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  });

  beforeEach(() => {
    mocks.requireAdmin.mockReset().mockResolvedValue({
      user: {
        id: ADMIN_ID,
        name: "Nguyễn Quản Trị",
        email: "admin@mocfarm.vn",
      },
      session: {
        id: "sess-pg-1",
        userId: ADMIN_ID,
        token: "tok-pg-1",
      },
    });
    mocks.captureOperationalError.mockReset();

    runPsqlSync(`
      DROP TRIGGER IF EXISTS _trg_block_audit_insert ON "admin_audit_logs";
      DROP FUNCTION IF EXISTS _block_audit_insert_for_test();

      TRUNCATE TABLE
        "admin_audit_logs",
        "admin_notification_reads",
        "admin_notification_states",
        "contact_submissions",
        "user"
      RESTART IDENTITY CASCADE;

      INSERT INTO "user" ("id", "name", "email", "email_verified")
      VALUES ('${ADMIN_ID}', 'Nguyễn Quản Trị', 'admin@mocfarm.vn', true);

      INSERT INTO "contact_submissions"
        ("id", "name", "phone", "email", "service", "message", "status", "email_status")
      VALUES
        ('${CONTACT_1}', 'Khách Một', '0901000001', 'k1@example.com', 'hop-rau-tuan', 'Tin nhắn bí mật 1', 'new', 'sent'),
        ('${CONTACT_2}', 'Khách Hai', '0901000002', 'k2@example.com', 'cung-ung-bep-an', 'Tin nhắn bí mật 2', 'new', 'failed'),
        ('${CONTACT_3}', 'Khách Ba', '0901000003', 'k3@example.com', 'khac', 'Tin nhắn bí mật 3', 'new', 'pending');
    `);
  });

  it("updateContactSubmissionStatus ghi đúng 1 dòng audit, bỏ qua cập nhật trùng trạng thái, hỗ trợ race đồng thời và rollback khi chèn audit lỗi", async () => {
    // 1) Cập nhật hợp lệ new -> contacted
    const first = await updateContactSubmissionStatus({
      id: CONTACT_1,
      status: "contacted",
    });
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.data.status).toBe("contacted");
      expect(first.data.changed).toBe(true);
    }

    // 2) Lặp lại trạng thái cũ -> không tạo audit trùng
    const repeat = await updateContactSubmissionStatus({
      id: CONTACT_1,
      status: "contacted",
    });
    expect(repeat.ok).toBe(true);
    if (repeat.ok) {
      expect(repeat.data.status).toBe("contacted");
      expect(repeat.data.changed).toBe(false);
    }

    // 3) ID không tồn tại -> not_found và không tạo audit
    const missing = await updateContactSubmissionStatus({
      id: "550e8400-e29b-41d4-a716-446655449999",
      status: "resolved",
    });
    expect(missing).toEqual({ ok: false, reason: "not_found" });

    // 4) Chạy đồng thời (concurrent) 2 yêu cầu giống nhau trên CONTACT_2 (new -> contacted)
    const [raceA, raceB] = await Promise.all([
      updateContactSubmissionStatus({ id: CONTACT_2, status: "contacted" }),
      updateContactSubmissionStatus({ id: CONTACT_2, status: "contacted" }),
    ]);
    expect(raceA.ok).toBe(true);
    expect(raceB.ok).toBe(true);
    const changedFlags = [
      raceA.ok ? raceA.data.changed : false,
      raceB.ok ? raceB.data.changed : false,
    ];
    expect(changedFlags.filter(Boolean)).toHaveLength(1);

    const contact2AuditCount = Number(
      runPsqlSync(
        `SELECT COUNT(*)::int FROM "admin_audit_logs" WHERE "target_id" = $1;`,
        [CONTACT_2]
      )
    );
    expect(contact2AuditCount).toBe(1);

    // 4b) Chạy đồng thời (concurrent) 2 trạng thái khác nhau trên CONTACT_3 (new -> contacted & -> resolved)
    const [distinctA, distinctB] = await Promise.all([
      updateContactSubmissionStatus({ id: CONTACT_3, status: "contacted" }),
      updateContactSubmissionStatus({ id: CONTACT_3, status: "resolved" }),
    ]);
    expect(distinctA.ok).toBe(true);
    expect(distinctB.ok).toBe(true);
    const contact3Audits = JSON.parse(
      runPsqlSync(
        `SELECT json_agg("changes" ORDER BY "created_at" ASC, "id" ASC)::text FROM "admin_audit_logs" WHERE "target_id" = $1;`,
        [CONTACT_3]
      )
    ) as Array<{ status: { from: string; to: string } }>;
    expect(contact3Audits).toHaveLength(2);
    expect(contact3Audits[0]?.status.from).toBe("new");
    expect(contact3Audits[1]?.status.from).toBe(contact3Audits[0]?.status.to);

    // 5) Rollback toàn bộ khi chèn audit thất bại (FK actor_user_id không tồn tại -> CTE abort -> contact status giữ nguyên)
    let contactRollbackErr: unknown;
    try {
      await updateContactSubmissionStatus(
        { id: CONTACT_1, status: "spam" },
        {
          userId: "non-existent-admin-id",
          name: "Ghost",
          email: "ghost@mocfarm.vn",
        }
      );
    } catch (error) {
      contactRollbackErr = error;
    }
    expect(contactRollbackErr).toBeInstanceOf(Error);
    const contactCause = (contactRollbackErr as { cause?: Error }).cause;
    expect(contactCause?.message ?? String(contactRollbackErr)).toMatch(
      /admin_audit_logs_actor_user_id_user_id_fk/
    );

    const statusAfterRollback = runPsqlSync(
      `SELECT "status"::text FROM "contact_submissions" WHERE "id" = $1;`,
      [CONTACT_1]
    );
    expect(statusAfterRollback).toBe("contacted");

    // Kiểm tra đọc lại từ listAdminAuditLogs (không chứa PII khách hàng)
    const logs = await listAdminAuditLogs();
    expect(logs.items).toHaveLength(4);
    expect(JSON.stringify(logs)).not.toContain("0901000001");
    expect(JSON.stringify(logs)).not.toContain("k1@example.com");
    expect(JSON.stringify(logs)).not.toContain("Tin nhắn bí mật");
  });

  it("markAllAdminNotificationsSeen đồng bộ receipts + state + audit nguyên tử, không đổi contact status và rollback khi audit lỗi", async () => {
    // 1) Lần 1: tạo 3 receipts + state + 1 audit row
    const first = await markAllAdminNotificationsSeen(ADMIN_ID, {
      name: "Nguyễn Quản Trị",
      email: "admin@mocfarm.vn",
    });
    expect(first.ok).toBe(true);
    expect(first.receiptsCreated).toBe(3);

    // 2) Chạy lặp lại & đồng thời: receiptsCreated = 0 và không lỗi trùng khoá
    const [repeatA, repeatB] = await Promise.all([
      markAllAdminNotificationsSeen(ADMIN_ID),
      markAllAdminNotificationsSeen(ADMIN_ID),
    ]);
    expect(repeatA.receiptsCreated).toBe(0);
    expect(repeatB.receiptsCreated).toBe(0);

    // Contact workflow status & email_status không bị thay đổi
    const contactStatuses = runPsqlSync(`
      SELECT json_agg(json_build_object('status', "status"::text, 'emailStatus', "email_status"::text) ORDER BY "id")::text
      FROM "contact_submissions";
    `);
    expect(JSON.parse(contactStatuses)).toEqual([
      { status: "new", emailStatus: "sent" },
      { status: "new", emailStatus: "failed" },
      { status: "new", emailStatus: "pending" },
    ]);

    // 3) Thử lỗi chèn audit (trigger tạm thời trên admin_audit_logs chặn INSERT -> kiểm tra rollback receipts & states)
    runPsqlSync(`
      DELETE FROM "admin_notification_reads";
      DELETE FROM "admin_notification_states";
      CREATE OR REPLACE FUNCTION _block_audit_insert_for_test()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Simulated audit insert failure';
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER _trg_block_audit_insert
      BEFORE INSERT ON "admin_audit_logs"
      FOR EACH ROW EXECUTE FUNCTION _block_audit_insert_for_test();
    `);

    try {
      let markAllRollbackErr: unknown;
      try {
        await markAllAdminNotificationsSeen(ADMIN_ID);
      } catch (error) {
        markAllRollbackErr = error;
      }
      expect(markAllRollbackErr).toBeInstanceOf(Error);
      const markAllCause = (markAllRollbackErr as { cause?: Error }).cause;
      expect(markAllCause?.message ?? String(markAllRollbackErr)).toMatch(
        /Simulated audit insert failure/
      );

      const readsAfterRollback = Number(
        runPsqlSync(`SELECT COUNT(*)::int FROM "admin_notification_reads";`)
      );
      const statesAfterRollback = Number(
        runPsqlSync(`SELECT COUNT(*)::int FROM "admin_notification_states";`)
      );
      expect(readsAfterRollback).toBe(0);
      expect(statesAfterRollback).toBe(0);
    } finally {
      runPsqlSync(`
        DROP TRIGGER IF EXISTS _trg_block_audit_insert ON "admin_audit_logs";
        DROP FUNCTION IF EXISTS _block_audit_insert_for_test();
      `);
    }
  });

  it("listAdminAuditLogs phân trang keyset 3 trang với timestamp trùng nhau, lọc action/result/period và ON DELETE SET NULL", async () => {
    // Chèn 60 dòng audit: 15 dòng ở giây T_tied (cùng created_at) + các dòng khác trải đều 24h / 7d / 30d
    const tiedIso = "2026-11-15T10:00:00.000Z";
    const now = new Date("2026-11-17T12:00:00.000Z");

    for (let i = 1; i <= 60; i += 1) {
      const createdAtIso =
        i >= 20 && i <= 34
          ? tiedIso
          : i <= 5
            ? new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString() // > 30 ngày trước
            : new Date(
                Date.parse("2026-11-15T09:00:00.000Z") + i * 1000
              ).toISOString();

      const action =
        i % 5 === 0
          ? ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED
          : ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED;
      const result =
        i % 5 === 0
          ? ADMIN_AUDIT_RESULTS.FAILURE
          : ADMIN_AUDIT_RESULTS.SUCCESS;

      runPsqlSync(
        `
        INSERT INTO "admin_audit_logs"
          ("actor_user_id", "actor_name_snapshot", "actor_email_snapshot", "action", "target_type", "target_id", "result", "changes", "metadata", "created_at")
        VALUES
          ($1, $2, $3, $4, $5, NULL, $6, NULL, $7::jsonb, $8::timestamptz);
        `,
        [
          result === "failure" ? null : ADMIN_ID,
          result === "failure" ? null : "Nguyễn Quản Trị",
          "admin@mocfarm.vn",
          action,
          ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          result,
          result === "failure" ? '{"reason":"invalid_credentials"}' : null,
          createdAtIso,
        ]
      );
    }

    // Kiểm tra 3 trang tiến + lùi trên PostgreSQL thật
    const page1 = await listAdminAuditLogs({}, now);
    expect(page1.items).toHaveLength(25);
    expect(page1.isFirstPage).toBe(true);
    expect(page1.hasNextPage).toBe(true);

    const page2 = await listAdminAuditLogs(
      { cursor: decodeAdminAuditCursor(page1.nextCursor)! },
      now
    );
    expect(page2.items).toHaveLength(25);
    expect(page2.hasPreviousPage).toBe(true);
    expect(page2.hasNextPage).toBe(true);

    const page3 = await listAdminAuditLogs(
      { cursor: decodeAdminAuditCursor(page2.nextCursor)! },
      now
    );
    expect(page3.items).toHaveLength(10);
    expect(page3.hasPreviousPage).toBe(true);
    expect(page3.hasNextPage).toBe(false);

    const allIds = [
      ...page1.items.map((x) => x.id),
      ...page2.items.map((x) => x.id),
      ...page3.items.map((x) => x.id),
    ];
    expect(new Set(allIds).size).toBe(60);

    // Lùi lại Trang 2 -> Trang 1 phải khớp hoàn toàn
    const backPage2 = await listAdminAuditLogs(
      { cursor: decodeAdminAuditCursor(page3.previousCursor)! },
      now
    );
    expect(backPage2.items.map((x) => x.id)).toEqual(
      page2.items.map((x) => x.id)
    );

    const backPage1 = await listAdminAuditLogs(
      { cursor: decodeAdminAuditCursor(backPage2.previousCursor)! },
      now
    );
    expect(backPage1.items.map((x) => x.id)).toEqual(
      page1.items.map((x) => x.id)
    );

    // Kiểm tra bộ lọc kết hợp action + result + period=30d (loại 5 bản ghi > 30d; trong 55 bản ghi còn lại có 11 failure tại i = 10,15,...,60)
    const filteredFailures = await listAdminAuditLogs(
      {
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        period: "30d",
      },
      now
    );
    expect(filteredFailures.items).toHaveLength(11);
    expect(
      filteredFailures.items.every(
        (item) =>
          item.action === ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED &&
          item.result === ADMIN_AUDIT_RESULTS.FAILURE
      )
    ).toBe(true);

    // Kiểm tra writeTransactionalAdminAuditLog + ON DELETE SET NULL giữ nguyên snapshot
    const written = await writeTransactionalAdminAuditLog({
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      actorUserId: ADMIN_ID,
      actorNameSnapshot: "Nguyễn Quản Trị",
      actorEmailSnapshot: "admin@mocfarm.vn",
    });
    expect(written.id).toBeTruthy();

    runPsqlSync(`DELETE FROM "user" WHERE "id" = $1;`, [ADMIN_ID]);
    const remainingStats = JSON.parse(
      runPsqlSync(`
        SELECT json_build_object(
          'total', COUNT(*)::int,
          'nonNullActorId', COUNT("actor_user_id")::int,
          'preservedEmail', COUNT("actor_email_snapshot")::int
        )::text
        FROM "admin_audit_logs";
      `)
    );
    expect(remainingStats).toEqual({
      total: 61,
      nonNullActorId: 0,
      preservedEmail: 61,
    });
  });
});
