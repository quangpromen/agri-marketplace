import { describe, expect, it } from "vitest";
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_AUDIT_PAGE_SIZE,
  ADMIN_AUDIT_PERIOD_FILTERS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  MAX_ADMIN_AUDIT_ACTOR_ID_LENGTH,
  MAX_ADMIN_AUDIT_ACTOR_NAME_LENGTH,
  MAX_ADMIN_AUDIT_CURSOR_LENGTH,
  MAX_ADMIN_AUDIT_TARGET_ID_LENGTH,
  adminAuditWriteEventSchema,
  buildAdminAuditLogsHref,
  contactStatusAuditChangesSchema,
  decodeAdminAuditCursor,
  encodeAdminAuditCursor,
  getAuditPeriodStartDate,
  hasActiveAdminAuditFilters,
  normalizeNullableActorNameSnapshot,
  normalizeNullableActorUserId,
  normalizeNullableEmailSnapshot,
  normalizeNullableTargetId,
  notificationsMarkAllSeenMetadataSchema,
  parseAdminAuditSearchParams,
  parseSafeAdminAuditDetailSummary,
  truncateAuditTargetId,
} from "@/schemas/admin-audit";
import { CONTACT_SUBMISSION_STATUSES } from "@/schemas/admin-contact";

const VALID_CONTACT_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("admin-audit schemas, validation, and normalization", () => {
  it("chấp nhận đầy đủ 5 tổ hợp action/result/target hợp lệ", () => {
    const loginSuccess = adminAuditWriteEventSchema.safeParse({
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      actorUserId: "admin-1",
      actorNameSnapshot: "  Nguyễn\tQuản   Trị  ",
      actorEmailSnapshot: "  ADMIN@MocFarm.vn ",
    });
    expect(loginSuccess.success).toBe(true);
    if (loginSuccess.success) {
      expect(loginSuccess.data.targetId).toBeNull();
      expect(loginSuccess.data.actorNameSnapshot).toBe("Nguyễn Quản Trị");
      expect(loginSuccess.data.actorEmailSnapshot).toBe("admin@mocfarm.vn");
      expect(loginSuccess.data.changes).toBeNull();
      expect(loginSuccess.data.metadata).toBeNull();
    }

    const loginFailed = adminAuditWriteEventSchema.safeParse({
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      result: ADMIN_AUDIT_RESULTS.FAILURE,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      actorUserId: null,
      actorNameSnapshot: null,
      actorEmailSnapshot: "  USER@MocFarm.vn ",
      metadata: { reason: "invalid_credentials" },
    });
    expect(loginFailed.success).toBe(true);
    if (loginFailed.success) {
      expect(loginFailed.data.actorEmailSnapshot).toBe("user@mocfarm.vn");
      expect(loginFailed.data.metadata).toEqual({
        reason: "invalid_credentials",
      });
    }

    const logoutSuccess = adminAuditWriteEventSchema.safeParse({
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      actorUserId: "admin-1",
      actorNameSnapshot: "Admin",
      actorEmailSnapshot: "admin@mocfarm.vn",
    });
    expect(logoutSuccess.success).toBe(true);

    const contactChanged = adminAuditWriteEventSchema.safeParse({
      action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
      targetId: VALID_CONTACT_UUID,
      actorUserId: "admin-1",
      actorNameSnapshot: "Admin",
      actorEmailSnapshot: "admin@mocfarm.vn",
      changes: {
        status: {
          from: "new",
          to: "contacted",
        },
      },
    });
    expect(contactChanged.success).toBe(true);

    const markAllSeen = adminAuditWriteEventSchema.safeParse({
      action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
      targetId: "admin-1",
      actorUserId: "admin-1",
      actorNameSnapshot: "Admin",
      actorEmailSnapshot: "admin@mocfarm.vn",
      metadata: {
        receiptsCreated: 0,
      },
    });
    expect(markAllSeen.success).toBe(true);
  });

  it("từ chối action không hỗ trợ, tổ hợp action/result/target sai và trường thừa (.strict)", () => {
    // Action không hỗ trợ
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: "audit.deleted",
        result: "success",
        targetType: "admin_session",
        actorUserId: "admin-1",
      }).success
    ).toBe(false);

    // Tổ hợp result sai
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
        targetId: VALID_CONTACT_UUID,
        actorUserId: "admin-1",
        changes: { status: { from: "new", to: "contacted" } },
      }).success
    ).toBe(false);

    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorEmailSnapshot: "admin@mocfarm.vn",
      }).success
    ).toBe(false);

    // Tổ hợp targetType sai
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        targetId: VALID_CONTACT_UUID,
        actorUserId: "admin-1",
        changes: { status: { from: "new", to: "contacted" } },
      }).success
    ).toBe(false);

    // auth.login_failed không được gắn actorUserId hay actorNameSnapshot
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorUserId: "admin-1",
        actorEmailSnapshot: "admin@mocfarm.vn",
      }).success
    ).toBe(false);

    // contact.status_changed bắt buộc targetId là UUID hợp lệ
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
        targetId: "not-a-uuid",
        actorUserId: "admin-1",
        changes: { status: { from: "new", to: "contacted" } },
      }).success
    ).toBe(false);

    // Trường thừa bị từ chối bởi .strict()
    expect(
      adminAuditWriteEventSchema.safeParse({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
        result: ADMIN_AUDIT_RESULTS.SUCCESS,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        actorUserId: "admin-1",
        actorNameSnapshot: "Admin",
        actorEmailSnapshot: "admin@mocfarm.vn",
        extraField: "forbidden",
      }).success
    ).toBe(false);
  });

  it("chỉ cho phép changes.status.from -> to khác nhau và metadata.receiptsCreated nguyên không âm", () => {
    for (const fromStatus of CONTACT_SUBMISSION_STATUSES) {
      for (const toStatus of CONTACT_SUBMISSION_STATUSES) {
        const result = contactStatusAuditChangesSchema.safeParse({
          status: { from: fromStatus, to: toStatus },
        });
        expect(result.success).toBe(fromStatus !== toStatus);
      }
    }

    expect(
      contactStatusAuditChangesSchema.safeParse({
        status: { from: "new", to: "contacted", customerPhone: "0912345678" },
      }).success
    ).toBe(false);

    expect(
      contactStatusAuditChangesSchema.safeParse({
        status: { from: "new", to: "contacted" },
        customerEmail: "khach@example.com",
      }).success
    ).toBe(false);

    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({ receiptsCreated: 0 })
        .success
    ).toBe(true);
    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({
        receiptsCreated: 1_000_000,
      }).success
    ).toBe(true);
    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({ receiptsCreated: -1 })
        .success
    ).toBe(false);
    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({ receiptsCreated: 2.5 })
        .success
    ).toBe(false);
    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({
        receiptsCreated: 1_000_001,
      }).success
    ).toBe(false);
    expect(
      notificationsMarkAllSeenMetadataSchema.safeParse({
        receiptsCreated: 3,
        contactIds: [VALID_CONTACT_UUID],
      }).success
    ).toBe(false);
  });

  it("chuẩn hóa an toàn actor snapshots, email đăng nhập thất bại và targetId", () => {
    expect(normalizeNullableActorUserId(null)).toBeNull();
    expect(normalizeNullableActorUserId("   \u0000\u0007  ")).toBeNull();
    expect(
      normalizeNullableActorUserId("a".repeat(MAX_ADMIN_AUDIT_ACTOR_ID_LENGTH + 1))
    ).toBeNull();
    expect(normalizeNullableActorUserId("  admin\u0000-1  ")).toBe("admin-1");

    expect(normalizeNullableActorNameSnapshot(undefined)).toBeNull();
    expect(normalizeNullableActorNameSnapshot("  \t\n  ")).toBeNull();
    expect(
      normalizeNullableActorNameSnapshot("  Nguyễn\t\nVăn   Quản\u0007Trị ")
    ).toBe("Nguyễn Văn Quản Trị");
    expect(
      normalizeNullableActorNameSnapshot(
        "A".repeat(MAX_ADMIN_AUDIT_ACTOR_NAME_LENGTH + 25)
      )
    ).toHaveLength(MAX_ADMIN_AUDIT_ACTOR_NAME_LENGTH);

    expect(normalizeNullableEmailSnapshot("  ADMIN@MocFarm.VN\n ")).toBe(
      "admin@mocfarm.vn"
    );
    expect(normalizeNullableEmailSnapshot("not-an-email")).toBeNull();
    expect(normalizeNullableEmailSnapshot("   ")).toBeNull();
    expect(
      normalizeNullableEmailSnapshot(`${"a".repeat(250)}@mocfarm.vn`)
    ).toBeNull();

    expect(normalizeNullableTargetId(null)).toBeNull();
    expect(normalizeNullableTargetId("  \n  ")).toBeNull();
    expect(
      normalizeNullableTargetId("x".repeat(MAX_ADMIN_AUDIT_TARGET_ID_LENGTH + 1))
    ).toBeNull();
    expect(normalizeNullableTargetId(` ${VALID_CONTACT_UUID}\r\n`)).toBe(
      VALID_CONTACT_UUID
    );

    expect(truncateAuditTargetId(null)).toBeNull();
    expect(truncateAuditTargetId("admin-1")).toEqual({
      short: "admin-1",
      full: "admin-1",
    });
    expect(truncateAuditTargetId(VALID_CONTACT_UUID)).toEqual({
      short: "550e8400…440000",
      full: VALID_CONTACT_UUID,
    });
  });

  it("mã hóa và giải mã cursor phân trang an toàn, từ chối mọi cursor sai định dạng hoặc quá dài", () => {
    const createdAt = new Date("2026-11-15T10:30:45.123Z");
    const nextCursor = encodeAdminAuditCursor(
      { createdAt, id: VALID_CONTACT_UUID },
      "next"
    );
    const prevCursor = encodeAdminAuditCursor(
      { createdAt, id: VALID_CONTACT_UUID },
      "prev"
    );

    expect(decodeAdminAuditCursor(nextCursor)).toEqual({
      createdAt,
      createdAtIso: "2026-11-15T10:30:45.123Z",
      id: VALID_CONTACT_UUID,
      direction: "next",
    });
    expect(decodeAdminAuditCursor(prevCursor)).toEqual({
      createdAt,
      createdAtIso: "2026-11-15T10:30:45.123Z",
      id: VALID_CONTACT_UUID,
      direction: "prev",
    });

    const encodeB64Url = (raw: string) =>
      Buffer.from(raw, "utf8").toString("base64url");

    const invalidCursors = [
      null,
      undefined,
      "",
      "   ",
      "not$valid!base64",
      "abc=",
      nextCursor.slice(0, 12),
      "A".repeat(MAX_ADMIN_AUDIT_CURSOR_LENGTH + 1),
      encodeB64Url("only-one-part"),
      encodeB64Url("a|b|c|d"),
      encodeB64Url(`2026-11-15T10:30:45.123Z\u0000|${VALID_CONTACT_UUID}|next`),
      encodeB64Url(`2026-11-15 10:30:45|${VALID_CONTACT_UUID}|next`),
      encodeB64Url(`2026-11-15T10:30:45.123+07:00|${VALID_CONTACT_UUID}|next`),
      encodeB64Url("2026-11-15T10:30:45.123Z|not-a-uuid|next"),
      encodeB64Url(`2026-11-15T10:30:45.123Z|${VALID_CONTACT_UUID}|jump`),
      encodeB64Url(`{"__proto__":{}}|${VALID_CONTACT_UUID}|next`),
    ];

    for (const candidate of invalidCursors) {
      expect(decodeAdminAuditCursor(candidate)).toBeNull();
    }
  });

  it("phân tích searchParams bộ lọc, tính mốc thời gian 24h/7d/30d và dựng href bảo toàn bộ lọc", () => {
    expect(ADMIN_AUDIT_PAGE_SIZE).toBe(25);
    expect(parseAdminAuditSearchParams(undefined)).toEqual({});

    const cursor = encodeAdminAuditCursor(
      { createdAt: "2026-11-15T10:00:00.000Z", id: VALID_CONTACT_UUID },
      "next"
    );

    expect(
      parseAdminAuditSearchParams({
        action: [ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED, "ignored"],
        result: "success",
        period: "7d",
        cursor,
      })
    ).toEqual({
      action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
      result: "success",
      period: "7d",
      cursor: expect.objectContaining({
        id: VALID_CONTACT_UUID,
        direction: "next",
      }),
    });

    expect(
      parseAdminAuditSearchParams({
        action: "unknown.action",
        result: "all",
        period: "365d",
        cursor: "malformed!!!",
      })
    ).toEqual({});

    for (const action of ADMIN_AUDIT_ACTION_VALUES) {
      expect(parseAdminAuditSearchParams({ action }).action).toBe(action);
    }
    for (const period of ADMIN_AUDIT_PERIOD_FILTERS) {
      expect(parseAdminAuditSearchParams({ period }).period).toBe(period);
    }

    const fixedNow = new Date("2026-11-17T12:00:00.000Z");
    expect(getAuditPeriodStartDate("24h", fixedNow).toISOString()).toBe(
      "2026-11-16T12:00:00.000Z"
    );
    expect(getAuditPeriodStartDate("7d", fixedNow).toISOString()).toBe(
      "2026-11-10T12:00:00.000Z"
    );
    expect(getAuditPeriodStartDate("30d", fixedNow).toISOString()).toBe(
      "2026-10-18T12:00:00.000Z"
    );

    expect(hasActiveAdminAuditFilters({})).toBe(false);
    expect(hasActiveAdminAuditFilters({ action: "auth.login_failed" })).toBe(
      true
    );
    expect(hasActiveAdminAuditFilters({ result: "failure" })).toBe(true);
    expect(hasActiveAdminAuditFilters({ period: "30d" })).toBe(true);

    expect(buildAdminAuditLogsHref()).toBe(ADMIN_AUDIT_LOGS_PATH);
    expect(
      buildAdminAuditLogsHref({
        action: "contact.status_changed",
        result: "success",
        period: "30d",
        cursor,
      })
    ).toBe(
      `/admin/audit-logs?action=contact.status_changed&result=success&period=30d&cursor=${encodeURIComponent(cursor)}`
    );
  });

  it("parseSafeAdminAuditDetailSummary chỉ trích xuất allowlist an toàn cho từng action", () => {
    expect(
      parseSafeAdminAuditDetailSummary({
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        changes: { status: { from: "new", to: "resolved" } },
        metadata: null,
      })
    ).toEqual({
      kind: "contact_status_transition",
      from: "new",
      to: "resolved",
    });

    // Dữ liệu bẩn/không đúng schema trong changes phải rơi về generic, không trả object thô
    expect(
      parseSafeAdminAuditDetailSummary({
        action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
        changes: {
          status: { from: "new", to: "resolved" },
          message: "NỘI DUNG BÍ MẬT",
        },
        metadata: null,
      })
    ).toEqual({ kind: "generic" });

    expect(
      parseSafeAdminAuditDetailSummary({
        action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
        changes: null,
        metadata: { receiptsCreated: 4 },
      })
    ).toEqual({
      kind: "notifications_mark_all_seen",
      receiptsCreated: 4,
    });

    expect(
      parseSafeAdminAuditDetailSummary({
        action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
        changes: null,
        metadata: { receiptsCreated: 4, leaked: "bad" },
      })
    ).toEqual({
      kind: "notifications_mark_all_seen",
      receiptsCreated: null,
    });

    expect(
      parseSafeAdminAuditDetailSummary({
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        changes: null,
        metadata: { reason: "auth_service_error" },
      })
    ).toEqual({
      kind: "auth_login_failed",
      reason: "auth_service_error",
    });
  });
});
