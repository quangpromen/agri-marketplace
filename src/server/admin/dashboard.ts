import "server-only";

import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { contactSubmissions } from "@/db/schema";
import {
  CONTACT_SUBMISSION_STATUSES,
  type ContactSubmissionStatus,
  type EmailDeliveryStatus,
  getSevenDaysAgo,
} from "@/schemas/admin-contact";

export const ADMIN_DASHBOARD_RECENT_LIMIT = 5;
export const ADMIN_DASHBOARD_TREND_DAYS = 14;
export const ADMIN_DASHBOARD_TIMEZONE = "Asia/Ho_Chi_Minh";

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export type AdminDashboardTrendPoint = {
  date: string;
  label: string;
  count: number;
};

export type AdminDashboardStatusDistributionItem = {
  status: ContactSubmissionStatus;
  count: number;
  percentage: number;
};

export type AdminDashboardStatusDistribution = {
  total: number;
  items: AdminDashboardStatusDistributionItem[];
};

export type AdminDashboardRecentSubmission = {
  id: string;
  name: string;
  service: string;
  status: ContactSubmissionStatus;
  emailStatus: EmailDeliveryStatus;
  createdAt: Date;
};

export type AdminDashboardData = {
  totalCount: number;
  newCount: number;
  openCount: number;
  failedEmailCount: number;
  lastSevenDaysCount: number;
  trend: AdminDashboardTrendPoint[];
  statusDistribution: AdminDashboardStatusDistribution;
  recentSubmissions: AdminDashboardRecentSubmission[];
};

export type VietnamTrendWindow = {
  startUtc: Date;
  endExclusiveUtc: Date;
  days: Array<{ date: string; label: string }>;
};

export type DashboardTrendRow = {
  localDate: string | Date;
  total: number | string;
};

const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ADMIN_DASHBOARD_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Extracts year, month, and day in Asia/Ho_Chi_Minh regardless of host timezone.
 */
export function getVietnamCalendarDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = vietnamDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

/**
 * Builds an inclusive 14-day local calendar window ending on `now`'s Vietnam date.
 */
export function getVietnamTrendWindow(
  now: Date = new Date(),
  dayCount: number = ADMIN_DASHBOARD_TREND_DAYS
): VietnamTrendWindow {
  const { year, month, day } = getVietnamCalendarDateParts(now);
  const days: Array<{ date: string; label: string }> = [];

  for (let offset = -(dayCount - 1); offset <= 0; offset += 1) {
    const utcCalendarDate = new Date(Date.UTC(year, month - 1, day + offset));
    const y = utcCalendarDate.getUTCFullYear();
    const m = utcCalendarDate.getUTCMonth() + 1;
    const d = utcCalendarDate.getUTCDate();

    days.push({
      date: `${y}-${padTwoDigits(m)}-${padTwoDigits(d)}`,
      label: `${padTwoDigits(d)}/${padTwoDigits(m)}`,
    });
  }

  const startUtc = new Date(
    Date.UTC(year, month - 1, day - (dayCount - 1), 0, 0, 0, 0) - VIETNAM_UTC_OFFSET_MS
  );
  const endExclusiveUtc = new Date(
    Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - VIETNAM_UTC_OFFSET_MS
  );

  return {
    startUtc,
    endExclusiveUtc,
    days,
  };
}

/**
 * Parameterized PostgreSQL expression converting timestamptz to YYYY-MM-DD in Asia/Ho_Chi_Minh.
 */
export function getVietnamLocalDateSql() {
  return sql<string>`to_char(${contactSubmissions.createdAt} AT TIME ZONE ${ADMIN_DASHBOARD_TIMEZONE}, 'YYYY-MM-DD')`.as(
    "local_date"
  );
}

function normalizeRowDateKey(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value.trim().slice(0, 10);
}

export function buildFourteenDayTrend(
  rows: DashboardTrendRow[],
  days: Array<{ date: string; label: string }>
): AdminDashboardTrendPoint[] {
  const countsByDate = new Map<string, number>();

  for (const row of rows) {
    const dateKey = normalizeRowDateKey(row.localDate);
    const parsedCount = Number(row.total ?? 0);
    if (!dateKey || !Number.isFinite(parsedCount) || parsedCount <= 0) {
      continue;
    }
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + parsedCount);
  }

  return days.map((day) => ({
    date: day.date,
    label: day.label,
    count: countsByDate.get(day.date) ?? 0,
  }));
}

/**
 * Computes status counts and 1-decimal rounded percentages without distorting values to force 100.0%.
 */
export function buildStatusDistribution(
  countsByStatus: Record<ContactSubmissionStatus, number>,
  totalCount: number
): AdminDashboardStatusDistribution {
  const safeTotal = Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 0;

  return {
    total: safeTotal,
    items: CONTACT_SUBMISSION_STATUSES.map((status) => {
      const rawCount = countsByStatus[status] ?? 0;
      const safeCount = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 0;
      const percentage =
        safeTotal > 0 ? Math.round((safeCount / safeTotal) * 1000) / 10 : 0;

      return {
        status,
        count: safeCount,
        percentage,
      };
    }),
  };
}

const recentSubmissionSelectColumns = {
  id: contactSubmissions.id,
  name: contactSubmissions.name,
  service: contactSubmissions.service,
  status: contactSubmissions.status,
  emailStatus: contactSubmissions.emailStatus,
  createdAt: contactSubmissions.createdAt,
};

export async function getAdminDashboardData(
  now: Date = new Date()
): Promise<AdminDashboardData> {
  const sevenDaysAgo = getSevenDaysAgo(now);
  const trendWindow = getVietnamTrendWindow(now, ADMIN_DASHBOARD_TREND_DAYS);
  const localDateExpr = getVietnamLocalDateSql();

  const [
    statusCountRows,
    failedEmailRows,
    lastSevenDaysRows,
    recentSubmissions,
    trendRows,
  ] = await Promise.all([
    db
      .select({
        status: contactSubmissions.status,
        total: count(),
      })
      .from(contactSubmissions)
      .groupBy(contactSubmissions.status),
    db
      .select({ total: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.emailStatus, "failed")),
    db
      .select({ total: count() })
      .from(contactSubmissions)
      .where(gte(contactSubmissions.createdAt, sevenDaysAgo)),
    db
      .select(recentSubmissionSelectColumns)
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt), desc(contactSubmissions.id))
      .limit(ADMIN_DASHBOARD_RECENT_LIMIT),
    db
      .select({
        localDate: localDateExpr,
        total: count(),
      })
      .from(contactSubmissions)
      .where(
        and(
          gte(contactSubmissions.createdAt, trendWindow.startUtc),
          lt(contactSubmissions.createdAt, trendWindow.endExclusiveUtc)
        )
      )
      .groupBy(({ localDate }) => localDate),
  ]);

  let totalCount = 0;
  const countsByStatus: Record<ContactSubmissionStatus, number> = {
    new: 0,
    contacted: 0,
    resolved: 0,
    spam: 0,
  };

  for (const row of statusCountRows) {
    const groupCount = Number(row.total ?? 0);
    totalCount += groupCount;

    if (row.status in countsByStatus) {
      countsByStatus[row.status as ContactSubmissionStatus] += groupCount;
    }
  }

  return {
    totalCount,
    newCount: countsByStatus.new,
    openCount: countsByStatus.new + countsByStatus.contacted,
    failedEmailCount: Number(failedEmailRows[0]?.total ?? 0),
    lastSevenDaysCount: Number(lastSevenDaysRows[0]?.total ?? 0),
    trend: buildFourteenDayTrend(trendRows, trendWindow.days),
    statusDistribution: buildStatusDistribution(countsByStatus, totalCount),
    recentSubmissions,
  };
}

