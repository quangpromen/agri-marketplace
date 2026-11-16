import "server-only";

import { and, asc, desc, eq, gt, gte, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { adminAuditLogs } from "@/db/schema";
import {
  ADMIN_AUDIT_PAGE_SIZE,
  type AdminAuditAction,
  type AdminAuditCursor,
  type AdminAuditFilters,
  type AdminAuditResult,
  type AdminAuditTargetType,
  type SafeAdminAuditDetailSummary,
  adminAuditActionSchema,
  adminAuditResultSchema,
  adminAuditTargetTypeSchema,
  encodeAdminAuditCursor,
  getAuditPeriodStartDate,
  normalizeNullableActorNameSnapshot,
  normalizeNullableActorUserId,
  normalizeNullableEmailSnapshot,
  normalizeNullableTargetId,
  parseSafeAdminAuditDetailSummary,
} from "@/schemas/admin-audit";
import { requireAdmin } from "@/server/auth/require-admin";

export type AdminAuditLogListItem = {
  id: string;
  actorUserId: string | null;
  actorNameSnapshot: string | null;
  actorEmailSnapshot: string | null;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType | null;
  targetId: string | null;
  result: AdminAuditResult;
  detailSummary: SafeAdminAuditDetailSummary;
  createdAt: Date;
};

export type AdminAuditLogListResult = {
  items: AdminAuditLogListItem[];
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
  isFirstPage: boolean;
};

const auditListSelectColumns = {
  id: adminAuditLogs.id,
  actorUserId: adminAuditLogs.actorUserId,
  actorNameSnapshot: adminAuditLogs.actorNameSnapshot,
  actorEmailSnapshot: adminAuditLogs.actorEmailSnapshot,
  action: adminAuditLogs.action,
  targetType: adminAuditLogs.targetType,
  targetId: adminAuditLogs.targetId,
  result: adminAuditLogs.result,
  changes: adminAuditLogs.changes,
  metadata: adminAuditLogs.metadata,
  createdAt: adminAuditLogs.createdAt,
};

export function buildAdminAuditFilterConditions(
  filters: Omit<AdminAuditFilters, "cursor">,
  now: Date = new Date()
): SQL[] {
  const conditions: SQL[] = [];

  if (filters.action) {
    conditions.push(eq(adminAuditLogs.action, filters.action));
  }

  if (filters.result) {
    conditions.push(eq(adminAuditLogs.result, filters.result));
  }

  if (filters.period) {
    const startDate = getAuditPeriodStartDate(filters.period, now);
    conditions.push(gte(adminAuditLogs.createdAt, startDate));
  }

  return conditions;
}

export function buildAdminAuditCursorCondition(
  cursor: AdminAuditCursor
): SQL | undefined {
  if (cursor.direction === "prev") {
    return or(
      gt(adminAuditLogs.createdAt, cursor.createdAt),
      and(
        eq(adminAuditLogs.createdAt, cursor.createdAt),
        gt(adminAuditLogs.id, cursor.id)
      )
    );
  }

  return or(
    lt(adminAuditLogs.createdAt, cursor.createdAt),
    and(
      eq(adminAuditLogs.createdAt, cursor.createdAt),
      lt(adminAuditLogs.id, cursor.id)
    )
  );
}

export function buildAdminAuditWhereClause(
  filters: AdminAuditFilters,
  now: Date = new Date()
): SQL | undefined {
  const conditions = buildAdminAuditFilterConditions(filters, now);

  if (filters.cursor) {
    const cursorCondition = buildAdminAuditCursorCondition(filters.cursor);
    if (cursorCondition) {
      conditions.push(cursorCondition);
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function toSafeAdminAuditLogListItem(
  row: {
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
    createdAt: Date | string;
  }
): AdminAuditLogListItem | null {
  const parsedAction = adminAuditActionSchema.safeParse(row.action);
  const parsedResult = adminAuditResultSchema.safeParse(row.result);

  if (!parsedAction.success || !parsedResult.success) {
    return null;
  }

  const parsedTargetType = row.targetType
    ? adminAuditTargetTypeSchema.safeParse(row.targetType)
    : null;

  const createdAtDate =
    row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  const safeCreatedAt = Number.isNaN(createdAtDate.getTime())
    ? new Date(0)
    : createdAtDate;

  return {
    id: row.id,
    actorUserId: normalizeNullableActorUserId(row.actorUserId),
    actorNameSnapshot: normalizeNullableActorNameSnapshot(
      row.actorNameSnapshot
    ),
    actorEmailSnapshot: normalizeNullableEmailSnapshot(row.actorEmailSnapshot),
    action: parsedAction.data,
    targetType: parsedTargetType?.success ? parsedTargetType.data : null,
    targetId: normalizeNullableTargetId(row.targetId),
    result: parsedResult.data,
    detailSummary: parseSafeAdminAuditDetailSummary({
      action: parsedAction.data,
      changes: row.changes,
      metadata: row.metadata,
    }),
    createdAt: safeCreatedAt,
  };
}

export async function listAdminAuditLogs(
  filters: AdminAuditFilters = {},
  now: Date = new Date()
): Promise<AdminAuditLogListResult> {
  await requireAdmin();

  const pageSize = ADMIN_AUDIT_PAGE_SIZE;
  const cursor = filters.cursor;
  const isBackwardCursor = cursor?.direction === "prev";
  const whereClause = buildAdminAuditWhereClause(filters, now);

  if (isBackwardCursor) {
    const newerRows = await db
      .select(auditListSelectColumns)
      .from(adminAuditLogs)
      .where(whereClause)
      .orderBy(asc(adminAuditLogs.createdAt), asc(adminAuditLogs.id))
      .limit(pageSize + 1);

    const hasMoreNewer = newerRows.length > pageSize;
    const slicedRows = newerRows.slice(0, pageSize).reverse();
    const items = slicedRows
      .map(toSafeAdminAuditLogListItem)
      .filter((item): item is AdminAuditLogListItem => item !== null);

    if (items.length === 0) {
      const baseConditions = buildAdminAuditFilterConditions(filters, now);
      const baseWhere =
        baseConditions.length > 0 ? and(...baseConditions) : undefined;
      const fallbackRows = await db
        .select(auditListSelectColumns)
        .from(adminAuditLogs)
        .where(baseWhere)
        .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
        .limit(pageSize + 1);

      const fallbackHasNext = fallbackRows.length > pageSize;
      const fallbackItems = fallbackRows
        .slice(0, pageSize)
        .map(toSafeAdminAuditLogListItem)
        .filter((item): item is AdminAuditLogListItem => item !== null);
      const lastItem = fallbackItems[fallbackItems.length - 1];

      return {
        items: fallbackItems,
        pageSize,
        hasNextPage: fallbackHasNext && Boolean(lastItem),
        hasPreviousPage: false,
        nextCursor:
          fallbackHasNext && lastItem
            ? encodeAdminAuditCursor(
                { createdAt: lastItem.createdAt, id: lastItem.id },
                "next"
              )
            : null,
        previousCursor: null,
        isFirstPage: true,
      };
    }

    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    return {
      items,
      pageSize,
      hasNextPage: Boolean(lastItem),
      hasPreviousPage: hasMoreNewer && Boolean(firstItem),
      nextCursor: lastItem
        ? encodeAdminAuditCursor(
            { createdAt: lastItem.createdAt, id: lastItem.id },
            "next"
          )
        : null,
      previousCursor:
        hasMoreNewer && firstItem
          ? encodeAdminAuditCursor(
              { createdAt: firstItem.createdAt, id: firstItem.id },
              "prev"
            )
          : null,
      isFirstPage: !hasMoreNewer,
    };
  }

  const rows = await db
    .select(auditListSelectColumns)
    .from(adminAuditLogs)
    .where(whereClause)
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(pageSize + 1);

  const hasNextPage = rows.length > pageSize;
  const items = rows
    .slice(0, pageSize)
    .map(toSafeAdminAuditLogListItem)
    .filter((item): item is AdminAuditLogListItem => item !== null);

  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const hasPreviousPage = Boolean(cursor && firstItem);

  return {
    items,
    pageSize,
    hasNextPage: hasNextPage && Boolean(lastItem),
    hasPreviousPage,
    nextCursor:
      hasNextPage && lastItem
        ? encodeAdminAuditCursor(
            { createdAt: lastItem.createdAt, id: lastItem.id },
            "next"
          )
        : null,
    previousCursor:
      hasPreviousPage && firstItem
        ? encodeAdminAuditCursor(
            { createdAt: firstItem.createdAt, id: firstItem.id },
            "prev"
          )
        : null,
    isFirstPage: !cursor,
  };
}
