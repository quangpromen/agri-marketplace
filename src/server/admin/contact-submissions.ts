import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { contactSubmissions } from "@/db/schema";
import {
  ADMIN_CONTACT_PAGE_SIZE,
  type AdminContactFilters,
  type ContactSubmissionStatus,
  type EmailDeliveryStatus,
  contactSubmissionIdSchema,
  updateContactStatusSchema,
} from "@/schemas/admin-contact";
import { contactServiceValues, getContactServiceLabel } from "@/schemas/contact";

export type ContactSubmissionListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  status: ContactSubmissionStatus;
  emailStatus: EmailDeliveryStatus;
  createdAt: Date;
};

export type ContactSubmissionDetail = ContactSubmissionListItem & {
  message: string;
  updatedAt: Date;
};

export type ContactSubmissionListResult = {
  items: ContactSubmissionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isOutOfRange: boolean;
};

export type ContactServiceOption = {
  value: string;
  label: string;
};

export type UpdateContactSubmissionStatusResult =
  | {
      ok: true;
      data: {
        id: string;
        status: ContactSubmissionStatus;
        updatedAt: Date;
      };
    }
  | {
      ok: false;
      reason: "validation" | "not_found";
    };

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function buildContactSubmissionWhereClause(
  filters: Omit<AdminContactFilters, "page">
): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.status) {
    conditions.push(eq(contactSubmissions.status, filters.status));
  }

  if (filters.emailStatus) {
    conditions.push(eq(contactSubmissions.emailStatus, filters.emailStatus));
  }

  if (filters.service) {
    conditions.push(eq(contactSubmissions.service, filters.service));
  }

  if (filters.q) {
    const normalizedQuery = filters.q.trim();
    if (normalizedQuery.length > 0) {
      const pattern = `%${escapeLikePattern(normalizedQuery)}%`;
      const searchConditions: SQL[] = [
        ilike(contactSubmissions.name, pattern),
        ilike(contactSubmissions.email, pattern),
        ilike(contactSubmissions.phone, pattern),
      ];

      const compactedPhone = normalizedQuery.replace(/[\s().-]/g, "");
      if (
        compactedPhone !== normalizedQuery &&
        /^[\d\s+().-]+$/.test(normalizedQuery) &&
        /\d/.test(compactedPhone) &&
        compactedPhone.length >= 2
      ) {
        searchConditions.push(
          ilike(contactSubmissions.phone, `%${escapeLikePattern(compactedPhone)}%`)
        );
      }

      const searchClause = or(...searchConditions);
      if (searchClause) {
        conditions.push(searchClause);
      }
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const listSelectColumns = {
  id: contactSubmissions.id,
  name: contactSubmissions.name,
  phone: contactSubmissions.phone,
  email: contactSubmissions.email,
  service: contactSubmissions.service,
  status: contactSubmissions.status,
  emailStatus: contactSubmissions.emailStatus,
  createdAt: contactSubmissions.createdAt,
};

async function fetchContactSubmissionPage(
  whereClause: SQL | undefined,
  page: number,
  pageSize: number
): Promise<ContactSubmissionListItem[]> {
  return db
    .select(listSelectColumns)
    .from(contactSubmissions)
    .where(whereClause)
    .orderBy(desc(contactSubmissions.createdAt), desc(contactSubmissions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function listContactSubmissions(
  filters: AdminContactFilters
): Promise<ContactSubmissionListResult> {
  const pageSize = ADMIN_CONTACT_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page);
  const whereClause = buildContactSubmissionWhereClause(filters);

  const [countRows, initialItems] = await Promise.all([
    db.select({ total: count() }).from(contactSubmissions).where(whereClause),
    fetchContactSubmissionPage(whereClause, requestedPage, pageSize),
  ]);

  const totalCount = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isOutOfRange = requestedPage > totalPages;
  const effectivePage = isOutOfRange ? totalPages : requestedPage;

  if (totalCount === 0) {
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      isOutOfRange: requestedPage > 1,
    };
  }

  const items =
    isOutOfRange && initialItems.length === 0
      ? await fetchContactSubmissionPage(whereClause, effectivePage, pageSize)
      : initialItems;

  return {
    items,
    totalCount,
    page: effectivePage,
    pageSize,
    totalPages,
    isOutOfRange,
  };
}

export async function listDistinctContactServices(): Promise<ContactServiceOption[]> {
  const seen = new Set<string>(contactServiceValues);
  const options: ContactServiceOption[] = contactServiceValues.map((value) => ({
    value,
    label: getContactServiceLabel(value),
  }));

  const rows = await db
    .selectDistinct({ service: contactSubmissions.service })
    .from(contactSubmissions)
    .orderBy(asc(contactSubmissions.service));

  for (const row of rows) {
    const value = row.service.trim();
    if (value.length > 0 && !seen.has(value)) {
      seen.add(value);
      options.push({
        value,
        label: getContactServiceLabel(value),
      });
    }
  }

  return options;
}

export async function getContactSubmissionById(
  id: string
): Promise<ContactSubmissionDetail | null> {
  const parsedId = contactSubmissionIdSchema.safeParse(id);
  if (!parsedId.success) {
    return null;
  }

  const [submission] = await db
    .select({
      ...listSelectColumns,
      message: contactSubmissions.message,
      updatedAt: contactSubmissions.updatedAt,
    })
    .from(contactSubmissions)
    .where(eq(contactSubmissions.id, parsedId.data))
    .limit(1);

  return submission ?? null;
}

export async function updateContactSubmissionStatus(input: {
  id: string;
  status: string;
}): Promise<UpdateContactSubmissionStatusResult> {
  const parsed = updateContactStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "validation" };
  }

  const now = new Date();

  const [updated] = await db
    .update(contactSubmissions)
    .set({
      status: parsed.data.status,
      updatedAt: now,
    })
    .where(eq(contactSubmissions.id, parsed.data.id))
    .returning({
      id: contactSubmissions.id,
      status: contactSubmissions.status,
      updatedAt: contactSubmissions.updatedAt,
    });

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    data: updated,
  };
}
