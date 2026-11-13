import { z } from "zod";

export const ADMIN_CONTACTS_PATH = "/admin/lien-he";
export const ADMIN_CONTACT_PAGE_SIZE = 20;
export const MAX_ADMIN_CONTACT_SEARCH_LENGTH = 100;
export const MAX_ADMIN_CONTACT_SERVICE_LENGTH = 100;
export const MAX_ADMIN_CONTACT_PAGE = 100_000;

export const CONTACT_SUBMISSION_STATUSES = [
  "new",
  "contacted",
  "resolved",
  "spam",
] as const;

export const OPEN_CONTACT_SUBMISSION_STATUSES = ["new", "contacted"] as const;

export const ADMIN_CONTACT_STATUS_FILTER_VALUES = [
  ...CONTACT_SUBMISSION_STATUSES,
  "open",
] as const;

export const ADMIN_CONTACT_PERIOD_FILTERS = ["7d"] as const;

export const EMAIL_DELIVERY_STATUSES = ["pending", "sent", "failed"] as const;

export const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export type ContactSubmissionStatus = (typeof CONTACT_SUBMISSION_STATUSES)[number];
export type AdminContactStatusFilter = ContactSubmissionStatus | "open";
export type AdminContactPeriodFilter = (typeof ADMIN_CONTACT_PERIOD_FILTERS)[number];
export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number];

export function getSevenDaysAgo(now: Date = new Date()): Date {
  return new Date(now.getTime() - SEVEN_DAYS_IN_MS);
}

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const CONTROL_CHAR_GLOBAL_PATTERN = /[\u0000-\u001F\u007F]/g;
const POSITIVE_INT_STRING_PATTERN = /^\d+$/;

export const contactSubmissionIdSchema = z
  .string()
  .trim()
  .uuid("Mã yêu cầu tư vấn không hợp lệ.");

export const contactSubmissionStatusSchema = z.enum(
  CONTACT_SUBMISSION_STATUSES,
  "Trạng thái xử lý không hợp lệ."
);

export const adminContactStatusFilterSchema = z.enum(
  ADMIN_CONTACT_STATUS_FILTER_VALUES,
  "Bộ lọc trạng thái xử lý không hợp lệ."
);

export const adminContactPeriodFilterSchema = z.enum(
  ADMIN_CONTACT_PERIOD_FILTERS,
  "Bộ lọc khoảng thời gian không hợp lệ."
);

export const emailDeliveryStatusSchema = z.enum(
  EMAIL_DELIVERY_STATUSES,
  "Trạng thái gửi email không hợp lệ."
);

export const updateContactStatusSchema = z.object({
  id: contactSubmissionIdSchema,
  status: contactSubmissionStatusSchema,
});

export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;

export const adminContactSearchQuerySchema = z
  .string()
  .transform((value) =>
    value
      .replace(CONTROL_CHAR_GLOBAL_PATTERN, " ")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, MAX_ADMIN_CONTACT_SEARCH_LENGTH)
      .trim()
  )
  .pipe(z.string().min(1).max(MAX_ADMIN_CONTACT_SEARCH_LENGTH));

export const adminContactServiceFilterSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ADMIN_CONTACT_SERVICE_LENGTH)
  .refine(
    (value) => value !== "all" && !CONTROL_CHAR_PATTERN.test(value),
    "Bộ lọc dịch vụ không hợp lệ."
  );

export const adminContactPageSchema = z
  .string()
  .trim()
  .regex(POSITIVE_INT_STRING_PATTERN)
  .transform((value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed)) {
      return MAX_ADMIN_CONTACT_PAGE;
    }
    return Math.min(parsed, MAX_ADMIN_CONTACT_PAGE);
  })
  .pipe(z.number().int().min(1).max(MAX_ADMIN_CONTACT_PAGE));

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type AdminContactFilters = {
  q?: string;
  status?: AdminContactStatusFilter;
  emailStatus?: EmailDeliveryStatus;
  service?: string;
  period?: AdminContactPeriodFilter;
  page: number;
};

function pickSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function normalizeAdminContactSearch(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const parsed = adminContactSearchQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export function parseAdminContactSearchParams(
  rawParams: RawSearchParams | URLSearchParams | undefined
): AdminContactFilters {
  if (!rawParams) {
    return { page: 1 };
  }

  const getParam = (key: string): string | undefined => {
    if (rawParams instanceof URLSearchParams) {
      return rawParams.get(key) ?? undefined;
    }
    return pickSingleParam(rawParams[key]);
  };

  const q = normalizeAdminContactSearch(getParam("q"));

  const rawStatus = getParam("status")?.trim();
  const parsedStatus =
    rawStatus && rawStatus !== "all"
      ? adminContactStatusFilterSchema.safeParse(rawStatus)
      : null;

  const rawEmailStatus = getParam("emailStatus")?.trim();
  const parsedEmailStatus =
    rawEmailStatus && rawEmailStatus !== "all"
      ? emailDeliveryStatusSchema.safeParse(rawEmailStatus)
      : null;

  const rawService = getParam("service");
  const parsedService =
    typeof rawService === "string"
      ? adminContactServiceFilterSchema.safeParse(rawService)
      : null;

  const rawPeriod = getParam("period")?.trim();
  const parsedPeriod =
    rawPeriod && rawPeriod !== "all"
      ? adminContactPeriodFilterSchema.safeParse(rawPeriod)
      : null;

  const rawPage = getParam("page");
  const parsedPage =
    typeof rawPage === "string" ? adminContactPageSchema.safeParse(rawPage) : null;

  return {
    ...(q ? { q } : {}),
    ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
    ...(parsedEmailStatus?.success ? { emailStatus: parsedEmailStatus.data } : {}),
    ...(parsedService?.success ? { service: parsedService.data } : {}),
    ...(parsedPeriod?.success ? { period: parsedPeriod.data } : {}),
    page: parsedPage?.success ? parsedPage.data : 1,
  };
}

export function hasActiveAdminContactFilters(
  filters: Omit<AdminContactFilters, "page">
): boolean {
  return Boolean(
    filters.q || filters.status || filters.emailStatus || filters.service || filters.period
  );
}

function buildAdminContactQueryString(
  filters: Partial<AdminContactFilters>
): string {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.emailStatus) {
    params.set("emailStatus", filters.emailStatus);
  }
  if (filters.service) {
    params.set("service", filters.service);
  }
  if (filters.period) {
    params.set("period", filters.period);
  }
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params.toString();
}

export function buildAdminContactsHref(filters: Partial<AdminContactFilters> = {}): string {
  const queryString = buildAdminContactQueryString(filters);
  return queryString ? `${ADMIN_CONTACTS_PATH}?${queryString}` : ADMIN_CONTACTS_PATH;
}

export function buildAdminContactDetailHref(
  id: string,
  listFilters?: Partial<AdminContactFilters>
): string {
  const basePath = `${ADMIN_CONTACTS_PATH}/${encodeURIComponent(id)}`;
  if (!listFilters) {
    return basePath;
  }

  const queryString = buildAdminContactQueryString(listFilters);
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getSafeMailtoHref(email: string): string | null {
  const trimmed = email.trim();
  if (
    CONTROL_CHAR_PATTERN.test(trimmed) ||
    /[<>?"'#\s]/.test(trimmed) ||
    !z.string().email().max(254).safeParse(trimmed).success
  ) {
    return null;
  }
  return `mailto:${trimmed}`;
}

export function getSafeTelHref(phone: string): string | null {
  const compacted = phone.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(compacted)) {
    return null;
  }
  return `tel:${compacted}`;
}
