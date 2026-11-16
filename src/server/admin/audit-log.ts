import "server-only";

import { db } from "@/db/client";
import { adminAuditLogs } from "@/db/schema";
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
  type AdminAuditActorInput,
  type AdminAuditWriteEventInput,
  PROHIBITED_AUDIT_PAYLOAD_KEYS,
  type ValidatedAdminAuditActor,
  type ValidatedAdminAuditWriteEvent,
  adminAuditActorSchema,
  adminAuditWriteEventSchema,
} from "@/schemas/admin-audit";
import {
  type ContactSubmissionStatus,
  contactSubmissionIdSchema,
  contactSubmissionStatusSchema,
} from "@/schemas/admin-contact";
import { captureOperationalError } from "@/server/observability/capture-error";

const PROHIBITED_KEY_SET = new Set<string>(
  PROHIBITED_AUDIT_PAYLOAD_KEYS.map((key) => key.toLowerCase())
);

function hasProhibitedAuditKeys(value: unknown, depth: number = 0): boolean {
  if (depth > 5 || !value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasProhibitedAuditKeys(item, depth + 1));
  }

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    const normalizedKey = key.trim().toLowerCase();
    if (PROHIBITED_KEY_SET.has(normalizedKey)) {
      return true;
    }

    if (hasProhibitedAuditKeys(nestedValue, depth + 1)) {
      return true;
    }
  }

  return false;
}

function buildCleanChangesObject(
  event: ValidatedAdminAuditWriteEvent
): Record<string, unknown> | null {
  if (event.action === ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED) {
    return {
      status: {
        from: event.changes.status.from,
        to: event.changes.status.to,
      },
    };
  }

  return null;
}

function buildCleanMetadataObject(
  event: ValidatedAdminAuditWriteEvent
): Record<string, unknown> | null {
  if (event.action === ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN) {
    return {
      receiptsCreated: event.metadata.receiptsCreated,
    };
  }

  if (
    event.action === ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED &&
    event.metadata
  ) {
    return {
      reason: event.metadata.reason,
    };
  }

  return null;
}

/**
 * Validates and normalizes an audit event against the strict allowlist contract.
 * Rejects any payload containing prohibited keys or unsupported action/result/target combinations.
 */
export function validateAndNormalizeAdminAuditEvent(
  input: AdminAuditWriteEventInput
): ValidatedAdminAuditWriteEvent {
  if (hasProhibitedAuditKeys(input)) {
    throw new Error("Dữ liệu nhật ký kiểm toán chứa trường bị cấm.");
  }

  const parsed = adminAuditWriteEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Sự kiện nhật ký kiểm toán không hợp lệ.");
  }

  return parsed.data;
}

export function validateAdminAuditActor(
  actor: AdminAuditActorInput
): ValidatedAdminAuditActor {
  if (hasProhibitedAuditKeys(actor)) {
    throw new Error("Thông tin quản trị viên thực hiện chứa trường bị cấm.");
  }

  const parsed = adminAuditActorSchema.safeParse(actor);
  if (!parsed.success) {
    throw new Error("Thông tin phiên quản trị viên không hợp lệ để ghi nhật ký.");
  }

  return parsed.data;
}

export function prepareContactStatusChangeAuditContext(input: {
  actor: AdminAuditActorInput;
  targetId: string;
  toStatus: ContactSubmissionStatus;
}): {
  actorUserId: string;
  actorNameSnapshot: string | null;
  actorEmailSnapshot: string | null;
  action: typeof ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED;
  targetType: typeof ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION;
  targetId: string;
  result: typeof ADMIN_AUDIT_RESULTS.SUCCESS;
  toStatus: ContactSubmissionStatus;
} {
  const actor = validateAdminAuditActor(input.actor);
  const targetId = contactSubmissionIdSchema.parse(input.targetId);
  const toStatus = contactSubmissionStatusSchema.parse(input.toStatus);

  return {
    actorUserId: actor.userId,
    actorNameSnapshot: actor.name,
    actorEmailSnapshot: actor.email,
    action: ADMIN_AUDIT_ACTIONS.CONTACT_STATUS_CHANGED,
    targetType: ADMIN_AUDIT_TARGET_TYPES.CONTACT_SUBMISSION,
    targetId,
    result: ADMIN_AUDIT_RESULTS.SUCCESS,
    toStatus,
  };
}

export function prepareMarkAllNotificationsAuditContext(
  actor: AdminAuditActorInput
): {
  actorUserId: string;
  actorNameSnapshot: string | null;
  actorEmailSnapshot: string | null;
  action: typeof ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN;
  targetType: typeof ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS;
  targetId: string;
  result: typeof ADMIN_AUDIT_RESULTS.SUCCESS;
} {
  const validatedActor = validateAdminAuditActor(actor);

  return {
    actorUserId: validatedActor.userId,
    actorNameSnapshot: validatedActor.name,
    actorEmailSnapshot: validatedActor.email,
    action: ADMIN_AUDIT_ACTIONS.NOTIFICATIONS_MARK_ALL_SEEN,
    targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_NOTIFICATIONS,
    targetId: validatedActor.userId,
    result: ADMIN_AUDIT_RESULTS.SUCCESS,
  };
}

/**
 * Mode 1a: Builds a validated Drizzle insert query for atomic `db.batch(...)` usage.
 */
export function buildTransactionalAdminAuditInsertQuery(
  input: AdminAuditWriteEventInput
) {
  const event = validateAndNormalizeAdminAuditEvent(input);

  return db
    .insert(adminAuditLogs)
    .values({
      actorUserId: event.actorUserId,
      actorNameSnapshot: event.actorNameSnapshot,
      actorEmailSnapshot: event.actorEmailSnapshot,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      result: event.result,
      changes: buildCleanChangesObject(event),
      metadata: buildCleanMetadataObject(event),
    })
    .returning({
      id: adminAuditLogs.id,
    });
}

/**
 * Mode 1b: Inserts a validated append-only audit record and throws if persistence fails.
 */
export async function writeTransactionalAdminAuditLog(
  input: AdminAuditWriteEventInput
): Promise<{ id: string }> {
  const [inserted] = await buildTransactionalAdminAuditInsertQuery(input);

  if (!inserted?.id) {
    throw new Error("Không thể ghi nhận nhật ký hoạt động quản trị.");
  }

  return { id: inserted.id };
}

/**
 * Mode 2: Best-effort security audit writer for authentication boundaries (login/logout)
 * that cannot share an interactive database transaction with the auth provider.
 * Never throws or exposes internal errors, and scrubs all payload details before reporting.
 */
export async function writeBestEffortAdminAuditLog(
  input: AdminAuditWriteEventInput,
  operation: string = "write_admin_audit_log"
): Promise<boolean> {
  try {
    await writeTransactionalAdminAuditLog(input);
    return true;
  } catch {
    captureOperationalError(
      new Error(`Admin audit log persistence failed (${operation})`),
      {
        service: "neon",
        operation,
      }
    );
    return false;
  }
}
