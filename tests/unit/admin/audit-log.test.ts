import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    insert: mocks.insert,
  },
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

import { adminAuditLogs } from "@/db/schema";
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  type AdminAuditWriteEventInput,
} from "@/schemas/admin-audit";
import {
  buildTransactionalAdminAuditInsertQuery,
  prepareContactStatusChangeAuditContext,
  prepareMarkAllNotificationsAuditContext,
  validateAdminAuditActor,
  validateAndNormalizeAdminAuditEvent,
  writeBestEffortAdminAuditLog,
  writeTransactionalAdminAuditLog,
} from "@/server/admin/audit-log";

const VALID_CONTACT_UUID = "550e8400-e29b-41d4-a716-446655440000";

function setupInsertMock(rows: Array<{ id: string }> | Error) {
  const returning =
    rows instanceof Error
      ? vi.fn().mockRejectedValue(rows)
      : vi.fn().mockResolvedValue(rows);
  const values = vi.fn().mockReturnValue({ returning });
  mocks.insert.mockReturnValueOnce({ values });
  return { values, returning };
}

describe("admin audit-log writer & privacy guardrails", () => {
  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.captureOperationalError.mockReset();
  });

  it("từ chối mọi khóa nhạy cảm bị cấm ở cấp gốc và lồng sâu", () => {
    const prohibitedKeys = [
      "password",
      "passwordHash",
      "password_hash",
      "token",
      "sessionToken",
      "session_token",
      "sessionId",
      "session_id",
      "cookie",
      "cookies",
      "authorization",
      "headers",
      "requestHeaders",
      "turnstileToken",
      "captchaToken",
      "apiKey",
      "api_key",
      "secret",
      "phone",
      "customerPhone",
      "customerEmail",
      "customerName",
      "message",
      "formData",
      "rawBody",
      "body",
      "stack",
      "stackTrace",
      "connectionString",
      "databaseUrl",
    ];

    for (const key of prohibitedKeys) {
      // Cấp gốc
      expect(() =>
        validateAndNormalizeAdminAuditEvent({
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          actorUserId: "admin-1",
          actorNameSnapshot: "Admin",
          actorEmailSnapshot: "admin@mocfarm.vn",
          [key]: "sensitive-value",
        } as unknown as AdminAuditWriteEventInput)
      ).toThrow();

      // Lồng sâu trong metadata/changes (bao gồm khác hoa-thường)
      expect(() =>
        validateAndNormalizeAdminAuditEvent({
          action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
          result: ADMIN_AUDIT_RESULTS.SUCCESS,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
          targetId: "admin-1",
          actorUserId: "admin-1",
          actorNameSnapshot: "Admin",
          actorEmailSnapshot: "admin@mocfarm.vn",
          metadata: {
            receiptsCreated: 1,
            nested: [{ [key.toUpperCase()]: "secret" }],
          },
        } as unknown as AdminAuditWriteEventInput)
      ).toThrow();
    }
  });

  it("validateAdminAuditActor và prepare* helpers chuẩn hóa actor và từ chối dữ liệu nhạy cảm", () => {
    expect(
      validateAdminAuditActor({
        userId: "  admin-1\u0000 ",
        name: "  Quản\t  trị   viên  ",
        email: "  ADMIN@MocFarm.vn ",
      })
    ).toEqual({
      userId: "admin-1",
      name: "Quản trị viên",
      email: "admin@mocfarm.vn",
    });

    expect(() =>
      validateAdminAuditActor({
        userId: "   ",
        name: "Admin",
        email: "admin@mocfarm.vn",
      })
    ).toThrow();

    expect(() =>
      validateAdminAuditActor({
        userId: "admin-1",
        password: "secret",
      } as unknown as { userId: string })
    ).toThrow();

    expect(
      prepareContactStatusChangeAuditContext({
        actor: {
          userId: "admin-1",
          name: "Quản trị",
          email: "admin@mocfarm.vn",
        },
        targetId: VALID_CONTACT_UUID,
        toStatus: "contacted",
      })
    ).toEqual({
      actorUserId: "admin-1",
      actorNameSnapshot: "Quản trị",
      actorEmailSnapshot: "admin@mocfarm.vn",
      action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
      targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
      targetId: VALID_CONTACT_UUID,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      toStatus: "contacted",
    });

    expect(
      prepareMarkAllNotificationsAuditContext({
        userId: "admin-1",
        name: "Quản trị",
        email: "admin@mocfarm.vn",
      })
    ).toEqual({
      actorUserId: "admin-1",
      actorNameSnapshot: "Quản trị",
      actorEmailSnapshot: "admin@mocfarm.vn",
      action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
      targetId: "admin-1",
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
    });
  });

  it("writeTransactionalAdminAuditLog chỉ chèn bản ghi allowlist sạch vào admin_audit_logs và ném lỗi khi thất bại", async () => {
    const auditRowId = "550e8400-e29b-41d4-a716-446655440099";
    const insertMock = setupInsertMock([{ id: auditRowId }]);

    const result = await writeTransactionalAdminAuditLog({
      action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
      targetId: VALID_CONTACT_UUID,
      actorUserId: "admin-1",
      actorNameSnapshot: "  Quản\nTrị  ",
      actorEmailSnapshot: "ADMIN@MocFarm.vn",
      changes: {
        status: { from: "new", to: "contacted" },
      },
    });

    expect(result).toEqual({ id: auditRowId });
    expect(mocks.insert).toHaveBeenCalledWith(adminAuditLogs);
    expect(insertMock.values).toHaveBeenCalledWith({
      actorUserId: "admin-1",
      actorNameSnapshot: "Quản Trị",
      actorEmailSnapshot: "admin@mocfarm.vn",
      action: "contact.status_changed",
      targetType: "contact_submission",
      targetId: VALID_CONTACT_UUID,
      result: "success",
      changes: {
        status: { from: "new", to: "contacted" },
      },
      metadata: null,
    });

    // Chèn rỗng phải ném lỗi thay vì im lặng
    setupInsertMock([]);
    await expect(
      buildTransactionalAdminAuditInsertQuery({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorUserId: "admin-1",
        actorNameSnapshot: "Admin",
        actorEmailSnapshot: "admin@mocfarm.vn",
      }).then((rows) => {
        if (!rows[0]?.id) {
          throw new Error("empty");
        }
      })
    ).rejects.toThrow("empty");

    setupInsertMock([]);
    await expect(
      writeTransactionalAdminAuditLog({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorUserId: "admin-1",
        actorNameSnapshot: "Admin",
        actorEmailSnapshot: "admin@mocfarm.vn",
      })
    ).rejects.toThrow("Không thể ghi nhận nhật ký hoạt động quản trị.");
  });

  it("writeBestEffortAdminAuditLog không ném lỗi khi DB thất bại và che toàn bộ bí mật khi ghi operational error", async () => {
    const rawSecretError = new Error(
      "neon failure password=MySecretPass123 sessionToken=tok_abc cookie=better-auth.session_token=xyz postgres://user:pass@host/db"
    );
    setupInsertMock(rawSecretError);

    const ok = await writeBestEffortAdminAuditLog(
      {
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorUserId: null,
        actorNameSnapshot: null,
        actorEmailSnapshot: "  ADMIN@MocFarm.vn ",
        metadata: { reason: "invalid_credentials" },
      },
      "audit_admin_login_failed"
    );

    expect(ok).toBe(false);
    expect(mocks.captureOperationalError).toHaveBeenCalledTimes(1);

    const [capturedError, capturedOptions] =
      mocks.captureOperationalError.mock.calls[0]!;
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe(
      "Admin audit log persistence failed (audit_admin_login_failed)"
    );
    expect((capturedError as Error).message).not.toContain("MySecretPass123");
    expect((capturedError as Error).message).not.toContain("tok_abc");
    expect((capturedError as Error).message).not.toContain("xyz");
    expect((capturedError as Error).message).not.toContain("postgres://");
    expect(capturedOptions).toEqual({
      service: "neon",
      operation: "audit_admin_login_failed",
    });
  });
});
