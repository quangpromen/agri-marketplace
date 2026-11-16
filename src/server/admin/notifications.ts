import "server-only";

import { and, count, desc, eq, notExists, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  adminNotificationReads,
  adminNotificationStates,
  contactSubmissions,
} from "@/db/schema";
import { formatAdminRelativeTime } from "@/lib/admin-contact-presentation";
import { buildAdminContactDetailHref } from "@/schemas/admin-contact";
import {
  ADMIN_NOTIFICATION_DROPDOWN_LIMIT,
  type AdminNotificationItem,
  type AdminNotificationSummary,
  adminUserIdSchema,
  markAllNotificationsSeenSchema,
} from "@/schemas/admin-notifications";
import { getContactServiceLabel } from "@/schemas/contact";
import { prepareMarkAllNotificationsAuditContext } from "@/server/admin/audit-log";

type UnreadSubmissionRow = {
  id: string;
  name: string;
  service: string;
  createdAt: Date | string;
};

type NotificationStateResolution = {
  lastSeenAt: Date;
  initializedNow: boolean;
};

const notificationSummarySelectColumns = {
  id: contactSubmissions.id,
  name: contactSubmissions.name,
  service: contactSubmissions.service,
  createdAt: contactSubmissions.createdAt,
};

function toValidDate(
  value: Date | string | null | undefined,
  fallback: Date = new Date()
): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}

function extractExecuteRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    return result as Array<Record<string, unknown>>;
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }

  return [];
}

function toAdminNotificationItem(
  row: UnreadSubmissionRow,
  serverTime: Date
): AdminNotificationItem {
  const createdAtDate = toValidDate(row.createdAt, serverTime);
  const customerName = row.name.trim() || "Khách hàng";
  const serviceLabel =
    getContactServiceLabel(row.service).trim() || "Yêu cầu tư vấn";

  return {
    id: row.id,
    customerName,
    serviceLabel,
    createdAt: createdAtDate.toISOString(),
    relativeTime: formatAdminRelativeTime(createdAtDate, serverTime),
    detailUrl: buildAdminContactDetailHref(row.id),
  };
}

function buildUnreadNotExistsCondition(adminUserId: string) {
  return notExists(
    db
      .select({ one: sql`1` })
      .from(adminNotificationReads)
      .where(
        and(
          eq(adminNotificationReads.adminUserId, adminUserId),
          eq(adminNotificationReads.contactSubmissionId, contactSubmissions.id)
        )
      )
  );
}

/**
 * Resolves the admin's notification state and lazily initializes read receipts
 * on first access. Uses a single atomic writable CTE statement (safe on neon-http,
 * which executes single statements and `db.batch` atomically without interactive
 * `db.transaction` callbacks) so historical rows are receipted inside the same
 * snapshot and concurrent first-access winners/losers cannot double-mark late commits.
 */
export async function ensureAdminNotificationState(
  adminUserId: string
): Promise<NotificationStateResolution> {
  const normalizedAdminId = adminUserIdSchema.parse(adminUserId);

  const [existingState] = await db
    .select({
      lastSeenAt: adminNotificationStates.lastSeenAt,
    })
    .from(adminNotificationStates)
    .where(eq(adminNotificationStates.adminUserId, normalizedAdminId))
    .limit(1);

  if (existingState) {
    return {
      lastSeenAt: toValidDate(existingState.lastSeenAt),
      initializedNow: false,
    };
  }

  const initResult = await db.execute<{ lastSeenAt: Date | string }>(sql`
    WITH inserted_state AS (
      INSERT INTO "admin_notification_states" (
        "admin_user_id",
        "last_seen_at",
        "created_at",
        "updated_at"
      )
      VALUES (${normalizedAdminId}, now(), now(), now())
      ON CONFLICT ("admin_user_id") DO NOTHING
      RETURNING "admin_user_id", "last_seen_at"
    ),
    inserted_reads AS (
      INSERT INTO "admin_notification_reads" (
        "admin_user_id",
        "contact_submission_id",
        "read_at"
      )
      SELECT
        "inserted_state"."admin_user_id",
        "cs"."id",
        "inserted_state"."last_seen_at"
      FROM "inserted_state"
      CROSS JOIN "contact_submissions" AS "cs"
      ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING
    )
    SELECT "last_seen_at" AS "lastSeenAt"
    FROM "inserted_state"
  `);

  const [insertedState] = extractExecuteRows(initResult);
  if (insertedState?.lastSeenAt) {
    return {
      lastSeenAt: toValidDate(insertedState.lastSeenAt as Date | string),
      initializedNow: true,
    };
  }

  const [concurrentState] = await db
    .select({
      lastSeenAt: adminNotificationStates.lastSeenAt,
    })
    .from(adminNotificationStates)
    .where(eq(adminNotificationStates.adminUserId, normalizedAdminId))
    .limit(1);

  if (!concurrentState) {
    throw new Error("Không thể khởi tạo trạng thái thông báo quản trị viên.");
  }

  return {
    lastSeenAt: toValidDate(concurrentState.lastSeenAt),
    initializedNow: false,
  };
}

export async function getAdminNotificationSummary(
  adminUserId: string
): Promise<AdminNotificationSummary> {
  const normalizedAdminId = adminUserIdSchema.parse(adminUserId);
  const state = await ensureAdminNotificationState(normalizedAdminId);

  if (state.initializedNow) {
    return {
      unreadCount: 0,
      items: [],
      serverTime: state.lastSeenAt.toISOString(),
    };
  }

  const unreadCondition = buildUnreadNotExistsCondition(normalizedAdminId);

  const countQuery = db
    .select({
      total: count(),
      serverTime: sql<Date | string>`now()`,
    })
    .from(contactSubmissions)
    .where(unreadCondition);

  const listQuery = db
    .select(notificationSummarySelectColumns)
    .from(contactSubmissions)
    .where(unreadCondition)
    .orderBy(desc(contactSubmissions.createdAt), desc(contactSubmissions.id))
    .limit(ADMIN_NOTIFICATION_DROPDOWN_LIMIT);

  const [countRows, unreadRows] = await db.batch([countQuery, listQuery]);

  const serverTime = toValidDate(countRows[0]?.serverTime);
  const rawTotal = Number(countRows[0]?.total ?? 0);
  const items = unreadRows
    .slice(0, ADMIN_NOTIFICATION_DROPDOWN_LIMIT)
    .map((row) => toAdminNotificationItem(row, serverTime));
  const normalizedTotal =
    Number.isFinite(rawTotal) && rawTotal > 0 ? Math.floor(rawTotal) : 0;
  const unreadCount =
    normalizedTotal === 0 && items.length > 0 ? items.length : normalizedTotal;

  return {
    unreadCount,
    items,
    serverTime: serverTime.toISOString(),
  };
}

export async function markAllAdminNotificationsSeen(
  adminUserId: string,
  actor?: {
    name?: string | null;
    email?: string | null;
  }
): Promise<{ ok: true; lastSeenAt: string; receiptsCreated: number }> {
  const parsed = markAllNotificationsSeenSchema.parse({ adminUserId });
  const auditContext = prepareMarkAllNotificationsAuditContext({
    userId: parsed.adminUserId,
    name: actor?.name,
    email: actor?.email,
  });

  const cteResult = await db.execute(sql`
    WITH inserted_reads AS (
      INSERT INTO "admin_notification_reads" (
        "admin_user_id",
        "contact_submission_id",
        "read_at"
      )
      SELECT
        ${auditContext.actorUserId},
        "cs"."id",
        now()
      FROM "contact_submissions" AS "cs"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "admin_notification_reads" AS "r"
        WHERE "r"."admin_user_id" = ${auditContext.actorUserId}
          AND "r"."contact_submission_id" = "cs"."id"
      )
      ON CONFLICT ("admin_user_id", "contact_submission_id") DO NOTHING
      RETURNING 1
    ),
    receipt_summary AS (
      SELECT COUNT(*)::int AS "receipts_created"
      FROM "inserted_reads"
    ),
    upserted_state AS (
      INSERT INTO "admin_notification_states" (
        "admin_user_id",
        "last_seen_at",
        "created_at",
        "updated_at"
      )
      VALUES (${auditContext.actorUserId}, now(), now(), now())
      ON CONFLICT ("admin_user_id") DO UPDATE SET
        "last_seen_at" = now(),
        "updated_at" = now()
      RETURNING "admin_user_id", "last_seen_at"
    ),
    actor_profile AS (
      SELECT
        "id",
        LEFT(TRIM("name"), 100) AS "name",
        LEFT(LOWER(TRIM("email")), 254) AS "email"
      FROM "user"
      WHERE "id" = ${auditContext.actorUserId}
      LIMIT 1
    ),
    inserted_audit AS (
      INSERT INTO "admin_audit_logs" (
        "actor_user_id",
        "actor_name_snapshot",
        "actor_email_snapshot",
        "action",
        "target_type",
        "target_id",
        "result",
        "changes",
        "metadata",
        "created_at"
      )
      SELECT
        "upserted_state"."admin_user_id",
        COALESCE(${auditContext.actorNameSnapshot}, "actor_profile"."name"),
        COALESCE(${auditContext.actorEmailSnapshot}, "actor_profile"."email"),
        ${auditContext.action},
        ${auditContext.targetType},
        "upserted_state"."admin_user_id",
        ${auditContext.result},
        NULL,
        jsonb_build_object(
          'receiptsCreated',
          "receipt_summary"."receipts_created"
        ),
        "upserted_state"."last_seen_at"
      FROM "upserted_state"
      CROSS JOIN "receipt_summary"
      LEFT JOIN "actor_profile"
        ON "actor_profile"."id" = "upserted_state"."admin_user_id"
      RETURNING "id"
    )
    SELECT
      "upserted_state"."admin_user_id" AS "adminUserId",
      "upserted_state"."last_seen_at" AS "lastSeenAt",
      "receipt_summary"."receipts_created" AS "receiptsCreated",
      "inserted_audit"."id" AS "auditLogId"
    FROM "upserted_state"
    CROSS JOIN "receipt_summary"
    INNER JOIN "inserted_audit"
      ON TRUE
  `);

  const [updatedState] = extractExecuteRows(cteResult);
  if (!updatedState || !updatedState.auditLogId) {
    throw new Error("Không thể cập nhật trạng thái đã xem thông báo.");
  }

  const rawReceiptsCreated = Number(updatedState.receiptsCreated ?? 0);
  const receiptsCreated =
    Number.isFinite(rawReceiptsCreated) && rawReceiptsCreated >= 0
      ? Math.floor(rawReceiptsCreated)
      : 0;

  return {
    ok: true,
    lastSeenAt: toValidDate(
      updatedState.lastSeenAt as Date | string
    ).toISOString(),
    receiptsCreated,
  };
}
