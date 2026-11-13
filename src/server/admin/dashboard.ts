import "server-only";

import { count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { contactSubmissions } from "@/db/schema";
import {
  type ContactSubmissionStatus,
  type EmailDeliveryStatus,
  getSevenDaysAgo,
} from "@/schemas/admin-contact";

export const ADMIN_DASHBOARD_RECENT_LIMIT = 5;

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
  recentSubmissions: AdminDashboardRecentSubmission[];
};

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

  const [
    statusCountRows,
    failedEmailRows,
    lastSevenDaysRows,
    recentSubmissions,
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
  ]);

  let totalCount = 0;
  let newCount = 0;
  let contactedCount = 0;

  for (const row of statusCountRows) {
    const groupCount = Number(row.total ?? 0);
    totalCount += groupCount;

    if (row.status === "new") {
      newCount += groupCount;
    } else if (row.status === "contacted") {
      contactedCount += groupCount;
    }
  }

  return {
    totalCount,
    newCount,
    openCount: newCount + contactedCount,
    failedEmailCount: Number(failedEmailRows[0]?.total ?? 0),
    lastSevenDaysCount: Number(lastSevenDaysRows[0]?.total ?? 0),
    recentSubmissions,
  };
}

