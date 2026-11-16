import { z } from "zod";
import {
  type ContactSubmissionStatus,
   type RawSearchParams,
  contactSubmissionIdSchema,
  contactSubmissionStatusSchema,
} from "@/schemas/admin-contact";

export const ADMIN_AUDIT_LOGS_PATH = "/admin/audit-logs";
export const ADMIN_AUDIT_PAGE_SIZE = 25;
export const MAX_ADMIN_AUDIT_ACTOR_ID_LENGTH = 128;
export const MAX_ADMIN_AUDIT_ACTOR_NAME_LENGTH = 100;
export const MAX_ADMIN_AUDIT_EMAIL_LENGTH = 254;
export const MAX_ADMIN_AUDIT_TARGET_ID_LENGTH = 128;
export const MAX_ADMIN_AUDIT_CURSOR_LENGTH = 200;

export const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
export const SEVEN_DAYS_IN_MS = 7 * TWENTY_FOUR_HOURS_IN_MS;
export const THIRTY_DAYS_IN_MS = 30 * TWENTY_FOUR_HOURS_IN_MS;

export const ADMIN_AUDIT_ACTIONS = {
  AUTH_LOGIN_SUCCEEDED: "auth.login_succeeded",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_LOGOUT_SUCCEEDED: "auth.logout_succeeded",
  CONTACT_STATUS_CHANGED: "contact.status_changed",
  NOTIFICATIONS_MARK_ALL_SEEN: "notifications.mark_all_seen",
} as const;

export const ADMIN_AUDIT_ACTION_VALUES = [
  ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
  ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
  ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED,
  ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
  ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTION_VALUES)[number];

export const ADMIN_AUDIT_RESULTS = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

export const ADMIN_AUDIT_RESULT_VALUES = [
  ADMIN_AUDIT_RESULTS.SUCCESS,
  ADMIN_AUDIT_RESULTS.FAILURE,
] as const;

export type AdminAuditResult = (typeof ADMIN_AUDIT_RESULT_VALUES)[number];

export const ADMIN_AUDIT_TARGET_TYPES = {
  ADMIN_SESSION: "admin_session",
  CONTACT_SUBMISSION: "contact_submission",
  ADMIN_NOTIFICATIONS: "admin_notifications",
} as const;

export const ADMIN_AUDIT_TARGET_TYPE_VALUES = [
  ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
  ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
  ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
] as const;

export type AdminAuditTargetType =
  (typeof ADMIN_AUDIT_TARGET_TYPE_VALUES)[number];

export const ADMIN_AUDIT_PERIOD_FILTERS = ["24h", "7d", "30d"] as const;
export type AdminAuditPeriodFilter =
  (typeof ADMIN_AUDIT_PERIOD_FILTERS)[number];

export const ADMIN_AUDIT_CURSOR_DIRECTIONS = ["next", "prev"] as const;
export type AdminAuditCursorDirection =
  (typeof ADMIN_AUDIT_CURSOR_DIRECTIONS)[number];

export const ADMIN_LOGIN_FAILURE_REASONS = [
  "invalid_credentials",
  "auth_service_error",
] as const;
export type AdminLoginFailureReason =
  (typeof ADMIN_LOGIN_FAILURE_REASONS)[number];

export const PROHIBITED_AUDIT_PAYLOAD_KEYS = [
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
] as const;

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const CONTROL_CHAR_GLOBAL_PATTERN = /[\u0000-\u001F\u007F]/g;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const ISO_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;

export const adminAuditActionSchema = z.enum(
  ADMIN_AUDIT_ACTION_VALUES,
  "Hành động nhật ký không hợp lệ."
);

export const adminAuditResultSchema = z.enum(
  ADMIN_AUDIT_RESULT_VALUES,
  "Kết quả nhật ký không hợp lệ."
);

export const adminAuditTargetTypeSchema = z.enum(
  ADMIN_AUDIT_TARGET_TYPE_VALUES,
  "Loại đối tượng tác động không hợp lệ."
);

export const adminAuditPeriodFilterSchema = z.enum(
  ADMIN_AUDIT_PERIOD_FILTERS,
  "Khoảng thời gian lọc không hợp lệ."
);

export function normalizeNullableActorUserId(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(CONTROL_CHAR_GLOBAL_PATTERN, "").trim();
  if (
    cleaned.length === 0 ||
    cleaned.length > MAX_ADMIN_AUDIT_ACTOR_ID_LENGTH
  ) {
    return null;
  }
  return cleaned;
}

export function normalizeNullableActorNameSnapshot(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value
    .replace(CONTROL_CHAR_GLOBAL_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_ADMIN_AUDIT_ACTOR_NAME_LENGTH)
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function normalizeNullableEmailSnapshot(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const candidate = value
    .replace(CONTROL_CHAR_GLOBAL_PATTERN, "")
    .trim()
    .toLowerCase();
  if (
    candidate.length === 0 ||
    candidate.length > MAX_ADMIN_AUDIT_EMAIL_LENGTH ||
    CONTROL_CHAR_PATTERN.test(candidate)
  ) {
    return null;
  }
  const parsed = z.string().email().max(MAX_ADMIN_AUDIT_EMAIL_LENGTH).safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function normalizeNullableTargetId(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(CONTROL_CHAR_GLOBAL_PATTERN, "").trim();
  if (
    cleaned.length === 0 ||
    cleaned.length > MAX_ADMIN_AUDIT_TARGET_ID_LENGTH
  ) {
    return null;
  }
  return cleaned;
}

export const adminAuditRequiredActorIdSchema = z
  .string()
  .transform((val) => normalizeNullableActorUserId(val))
  .refine((val): val is string => typeof val === "string" && val.length > 0, {
    message: "Mã quản trị viên thực hiện không hợp lệ.",
  });

export const adminAuditNullableActorIdSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeNullableActorUserId(val));

export const adminAuditNullableActorNameSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeNullableActorNameSnapshot(val));

export const adminAuditNullableEmailSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeNullableEmailSnapshot(val));

export const adminAuditNullableTargetIdSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => normalizeNullableTargetId(val));

export const contactStatusAuditChangesSchema = z
  .object({
    status: z
      .object({
        from: contactSubmissionStatusSchema,
        to: contactSubmissionStatusSchema,
      })
      .strict()
      .refine((value) => value.from !== value.to, {
        message: "Trạng thái trước và sau thay đổi phải khác nhau.",
      }),
  })
  .strict();

export type ContactStatusAuditChanges = z.infer<
  typeof contactStatusAuditChangesSchema
>;

export const notificationsMarkAllSeenMetadataSchema = z
  .object({
    receiptsCreated: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export type NotificationsMarkAllSeenMetadata = z.infer<
  typeof notificationsMarkAllSeenMetadataSchema
>;

export const authLoginFailedMetadataSchema = z
  .object({
    reason: z.enum(ADMIN_LOGIN_FAILURE_REASONS),
  })
  .strict();

export type AuthLoginFailedMetadata = z.infer<
  typeof authLoginFailedMetadataSchema
>;

export type AdminAuditChanges = ContactStatusAuditChanges;
export type AdminAuditMetadata =
  | NotificationsMarkAllSeenMetadata
  | AuthLoginFailedMetadata;

export const authLoginSucceededAuditEventSchema = z
  .object({
    action: z.literal(ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED),
    result: z.literal(ADMIN_AUDIT_RESULTS.SUCCESS),
    targetType: z.literal(ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION),
    targetId: z.null().optional().default(null),
    actorUserId: adminAuditRequiredActorIdSchema,
    actorNameSnapshot: adminAuditNullableActorNameSchema,
    actorEmailSnapshot: adminAuditNullableEmailSchema,
    changes: z.null().optional().default(null),
    metadata: z.null().optional().default(null),
  })
  .strict();

export const authLoginFailedAuditEventSchema = z
  .object({
    action: z.literal(ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED),
    result: z.literal(ADMIN_AUDIT_RESULTS.FAILURE),
    targetType: z.literal(ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION),
    targetId: z.null().optional().default(null),
    actorUserId: z.null().optional().default(null),
    actorNameSnapshot: z.null().optional().default(null),
    actorEmailSnapshot: adminAuditNullableEmailSchema,
    changes: z.null().optional().default(null),
    metadata: authLoginFailedMetadataSchema.nullable().optional().default(null),
  })
  .strict();

export const authLogoutSucceededAuditEventSchema = z
  .object({
    action: z.literal(ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED),
    result: z.literal(ADMIN_AUDIT_RESULTS.SUCCESS),
    targetType: z.literal(ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION),
    targetId: z.null().optional().default(null),
    actorUserId: adminAuditNullableActorIdSchema,
    actorNameSnapshot: adminAuditNullableActorNameSchema,
    actorEmailSnapshot: adminAuditNullableEmailSchema,
    changes: z.null().optional().default(null),
    metadata: z.null().optional().default(null),
  })
  .strict();

export const contactStatusChangedAuditEventSchema = z
  .object({
    action: z.literal(ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED),
    result: z.literal(ADMIN_AUDIT_RESULTS.SUCCESS),
    targetType: z.literal(ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION),
    targetId: contactSubmissionIdSchema,
    actorUserId: adminAuditRequiredActorIdSchema,
    actorNameSnapshot: adminAuditNullableActorNameSchema,
    actorEmailSnapshot: adminAuditNullableEmailSchema,
    changes: contactStatusAuditChangesSchema,
    metadata: z.null().optional().default(null),
  })
  .strict();

export const notificationsMarkAllSeenAuditEventSchema = z
  .object({
    action: z.literal(ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN),
    result: z.literal(ADMIN_AUDIT_RESULTS.SUCCESS),
    targetType: z.literal(ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS),
    targetId: adminAuditNullableTargetIdSchema,
    actorUserId: adminAuditRequiredActorIdSchema,
    actorNameSnapshot: adminAuditNullableActorNameSchema,
    actorEmailSnapshot: adminAuditNullableEmailSchema,
    changes: z.null().optional().default(null),
    metadata: notificationsMarkAllSeenMetadataSchema,
  })
  .strict();

export const adminAuditWriteEventSchema = z.discriminatedUnion("action", [
  authLoginSucceededAuditEventSchema,
  authLoginFailedAuditEventSchema,
  authLogoutSucceededAuditEventSchema,
  contactStatusChangedAuditEventSchema,
  notificationsMarkAllSeenAuditEventSchema,
]);

export type AdminAuditWriteEventInput = z.input<
  typeof adminAuditWriteEventSchema
>;
export type ValidatedAdminAuditWriteEvent = z.output<
  typeof adminAuditWriteEventSchema
>;

export const adminAuditActorSchema = z
  .object({
    userId: adminAuditRequiredActorIdSchema,
    name: adminAuditNullableActorNameSchema,
    email: adminAuditNullableEmailSchema,
  })
  .strict();

export type AdminAuditActorInput = {
  userId: string;
  name?: string | null;
  email?: string | null;
};

export type ValidatedAdminAuditActor = z.output<typeof adminAuditActorSchema>;

export type AdminAuditCursor = {
  createdAt: Date;
  createdAtIso: string;
  id: string;
  direction: AdminAuditCursorDirection;
};

export function encodeAdminAuditCursor(
  input: {
    createdAt: Date | string;
    id: string;
  },
  direction: AdminAuditCursorDirection = "next"
): string {
  const date =
    input.createdAt instanceof Date
      ? input.createdAt
      : new Date(input.createdAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Thời gian con trỏ phân trang không hợp lệ.");
  }

  const parsedId = contactSubmissionIdSchema.parse(input.id);
  const parsedDirection = z.enum(ADMIN_AUDIT_CURSOR_DIRECTIONS).parse(direction);
  const rawPayload = `${date.toISOString()}|${parsedId}|${parsedDirection}`;

  return Buffer.from(rawPayload, "utf8").toString("base64url");
}

export function decodeAdminAuditCursor(
  rawCursor: string | null | undefined
): AdminAuditCursor | null {
  if (typeof rawCursor !== "string") {
    return null;
  }

  const trimmed = rawCursor.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_ADMIN_AUDIT_CURSOR_LENGTH ||
    !BASE64URL_PATTERN.test(trimmed)
  ) {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(trimmed, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!decoded || CONTROL_CHAR_PATTERN.test(decoded)) {
    return null;
  }

  const parts = decoded.split("|");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const [rawCreatedAt, rawId, rawDirection = "next"] = parts;
  if (!rawCreatedAt || !ISO_UTC_TIMESTAMP_PATTERN.test(rawCreatedAt)) {
    return null;
  }

  const parsedDate = new Date(rawCreatedAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const parsedId = contactSubmissionIdSchema.safeParse(rawId);
  if (!parsedId.success) {
    return null;
  }

  const parsedDirection = z
    .enum(ADMIN_AUDIT_CURSOR_DIRECTIONS)
    .safeParse(rawDirection);
  if (!parsedDirection.success) {
    return null;
  }

  return {
    createdAt: parsedDate,
    createdAtIso: parsedDate.toISOString(),
    id: parsedId.data,
    direction: parsedDirection.data,
  };
}

export const adminAuditCursorSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ADMIN_AUDIT_CURSOR_LENGTH)
  .transform((val) => decodeAdminAuditCursor(val))
  .refine((val): val is AdminAuditCursor => val !== null, {
    message: "Con trỏ phân trang không hợp lệ.",
  });

export type AdminAuditFilters = {
  action?: AdminAuditAction;
  result?: AdminAuditResult;
  period?: AdminAuditPeriodFilter;
  cursor?: AdminAuditCursor;
};

export function getAuditPeriodStartDate(
  period: AdminAuditPeriodFilter,
  now: Date = new Date()
): Date {
  switch (period) {
    case "24h":
      return new Date(now.getTime() - TWENTY_FOUR_HOURS_IN_MS);
    case "7d":
      return new Date(now.getTime() - SEVEN_DAYS_IN_MS);
    case "30d":
      return new Date(now.getTime() - THIRTY_DAYS_IN_MS);
  }
}

function pickSingleParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function parseAdminAuditSearchParams(
  rawParams: RawSearchParams | URLSearchParams | undefined
): AdminAuditFilters {
  if (!rawParams) {
    return {};
  }

  const getParam = (key: string): string | undefined => {
    if (rawParams instanceof URLSearchParams) {
      return rawParams.get(key) ?? undefined;
    }
    return pickSingleParam(rawParams[key]);
  };

  const rawAction = getParam("action")?.trim();
  const parsedAction =
    rawAction && rawAction !== "all"
      ? adminAuditActionSchema.safeParse(rawAction)
      : null;

  const rawResult = getParam("result")?.trim();
  const parsedResult =
    rawResult && rawResult !== "all"
      ? adminAuditResultSchema.safeParse(rawResult)
      : null;

  const rawPeriod = getParam("period")?.trim();
  const parsedPeriod =
    rawPeriod && rawPeriod !== "all"
      ? adminAuditPeriodFilterSchema.safeParse(rawPeriod)
      : null;

  const rawCursor = getParam("cursor")?.trim();
  const parsedCursor = rawCursor ? decodeAdminAuditCursor(rawCursor) : null;

  return {
    ...(parsedAction?.success ? { action: parsedAction.data } : {}),
    ...(parsedResult?.success ? { result: parsedResult.data } : {}),
    ...(parsedPeriod?.success ? { period: parsedPeriod.data } : {}),
    ...(parsedCursor ? { cursor: parsedCursor } : {}),
  };
}

export function hasActiveAdminAuditFilters(
  filters: Pick<AdminAuditFilters, "action" | "result" | "period">
): boolean {
  return Boolean(filters.action || filters.result || filters.period);
}

export function buildAdminAuditLogsHref(options?: {
  action?: AdminAuditAction;
  result?: AdminAuditResult;
  period?: AdminAuditPeriodFilter;
  cursor?: string | null;
}): string {
  if (!options) {
    return ADMIN_AUDIT_LOGS_PATH;
  }

  const params = new URLSearchParams();

  if (options.action) {
    params.set("action", options.action);
  }
  if (options.result) {
    params.set("result", options.result);
  }
  if (options.period) {
    params.set("period", options.period);
  }
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  const queryString = params.toString();
  return queryString
    ? `${ADMIN_AUDIT_LOGS_PATH}?${queryString}`
    : ADMIN_AUDIT_LOGS_PATH;
}

export type AdminAuditActionPresentationMeta = {
  label: string;
  shortLabel: string;
  description: string;
  categoryLabel: string;
  badgeClassName: string;
};

export const ADMIN_AUDIT_ACTION_META: Record<
  AdminAuditAction,
  AdminAuditActionPresentationMeta
> = {
  [ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED]: {
    label: "Đăng nhập thành công",
    shortLabel: "Đăng nhập",
    description: "Quản trị viên đăng nhập hợp lệ vào khu vực quản trị.",
    categoryLabel: "Xác thực",
    badgeClassName: "border-emerald-300 bg-emerald-50 text-emerald-950",
  },
  [ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED]: {
    label: "Đăng nhập thất bại",
    shortLabel: "Đăng nhập lỗi",
    description: "Nỗ lực đăng nhập quản trị bị từ chối.",
    categoryLabel: "Xác thực",
    badgeClassName: "border-red-300 bg-red-50 text-red-950",
  },
  [ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED]: {
    label: "Đăng xuất quản trị",
    shortLabel: "Đăng xuất",
    description: "Quản trị viên kết thúc phiên làm việc.",
    categoryLabel: "Xác thực",
    badgeClassName: "border-stone-300 bg-stone-100 text-stone-900",
  },
  [ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED]: {
    label: "Cập nhật trạng thái yêu cầu tư vấn",
    shortLabel: "Đổi trạng thái tư vấn",
    description: "Thay đổi trạng thái xử lý của yêu cầu tư vấn khách hàng.",
    categoryLabel: "Yêu cầu tư vấn",
    badgeClassName: "border-sky-300 bg-sky-50 text-sky-950",
  },
  [ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN]: {
    label: "Đánh dấu đã xem tất cả thông báo",
    shortLabel: "Đã xem thông báo",
    description: "Quản trị viên đánh dấu toàn bộ thông báo chưa xem là đã xem.",
    categoryLabel: "Thông báo",
    badgeClassName: "border-amber-300 bg-amber-50 text-amber-950",
  },
};

export type AdminAuditResultPresentationMeta = {
  label: string;
  badgeClassName: string;
};

export const ADMIN_AUDIT_RESULT_META: Record<
  AdminAuditResult,
  AdminAuditResultPresentationMeta
> = {
  [ADMIN_AUDIT_RESULTS.SUCCESS]: {
    label: "Thành công",
    badgeClassName: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  [ADMIN_AUDIT_RESULTS.FAILURE]: {
    label: "Thất bại",
    badgeClassName: "border-red-300 bg-red-50 text-red-900 font-bold",
  },
};

export const ADMIN_AUDIT_TARGET_TYPE_META: Record<
  AdminAuditTargetType,
  { label: string }
> = {
  [ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION]: {
    label: "Phiên quản trị",
  },
  [ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION]: {
    label: "Yêu cầu tư vấn",
  },
  [ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS]: {
    label: "Thông báo quản trị",
  },
};

export const ADMIN_AUDIT_ACTION_FILTER_OPTIONS: ReadonlyArray<{
  value: AdminAuditAction;
  label: string;
}> = ADMIN_AUDIT_ACTION_VALUES.map((value) => ({
  value,
  label: ADMIN_AUDIT_ACTION_META[value].label,
}));

export const ADMIN_AUDIT_RESULT_FILTER_OPTIONS: ReadonlyArray<{
  value: AdminAuditResult;
  label: string;
}> = ADMIN_AUDIT_RESULT_VALUES.map((value) => ({
  value,
  label: ADMIN_AUDIT_RESULT_META[value].label,
}));

export const ADMIN_AUDIT_PERIOD_FILTER_OPTIONS: ReadonlyArray<{
  value: AdminAuditPeriodFilter;
  label: string;
}> = [
  { value: "24h", label: "24 giờ qua" },
  { value: "7d", label: "7 ngày gần nhất" },
  { value: "30d", label: "30 ngày gần nhất" },
];

export function truncateAuditTargetId(
  targetId: string | null | undefined
): { short: string; full: string } | null {
  const normalized = normalizeNullableTargetId(targetId);
  if (!normalized) {
    return null;
  }

  if (normalized.length <= 16) {
    return {
      short: normalized,
      full: normalized,
    };
  }

  return {
    short: `${normalized.slice(0, 8)}…${normalized.slice(-6)}`,
    full: normalized,
  };
}

export type SafeAdminAuditDetailSummary =
  | {
      kind: "contact_status_transition";
      from: ContactSubmissionStatus;
      to: ContactSubmissionStatus;
    }
  | {
      kind: "notifications_mark_all_seen";
      receiptsCreated: number | null;
    }
  | {
      kind: "auth_login_succeeded";
    }
  | {
      kind: "auth_login_failed";
      reason: AdminLoginFailureReason;
    }
  | {
      kind: "auth_logout_succeeded";
    }
  | {
      kind: "generic";
    };

export function parseSafeAdminAuditDetailSummary(input: {
  action: AdminAuditAction;
  changes: unknown;
  metadata: unknown;
}): SafeAdminAuditDetailSummary {
  switch (input.action) {
    case ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED: {
      const parsed = contactStatusAuditChangesSchema.safeParse(input.changes);
      if (parsed.success) {
        return {
          kind: "contact_status_transition",
          from: parsed.data.status.from,
          to: parsed.data.status.to,
        };
      }
      return { kind: "generic" };
    }
    case ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN: {
      const parsed = notificationsMarkAllSeenMetadataSchema.safeParse(
        input.metadata
      );
      return {
        kind: "notifications_mark_all_seen",
        receiptsCreated: parsed.success ? parsed.data.receiptsCreated : null,
      };
    }
    case ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED:
      return { kind: "auth_login_succeeded" };
    case ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED: {
      const parsed = authLoginFailedMetadataSchema.safeParse(input.metadata);
      return {
        kind: "auth_login_failed",
        reason: parsed.success ? parsed.data.reason : "invalid_credentials",
      };
    }
    case ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED:
      return { kind: "auth_logout_succeeded" };
  }
}
