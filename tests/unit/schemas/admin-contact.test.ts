import { describe, expect, it } from "vitest";
import {
  ADMIN_CONTACTS_PATH,
  CONTACT_SUBMISSION_STATUSES,
  EMAIL_DELIVERY_STATUSES,
  MAX_ADMIN_CONTACT_PAGE,
  MAX_ADMIN_CONTACT_SEARCH_LENGTH,
  adminContactPeriodFilterSchema,
  adminContactStatusFilterSchema,
  buildAdminContactDetailHref,
  buildAdminContactsHref,
  contactSubmissionIdSchema,
  contactSubmissionStatusSchema,
  getSafeMailtoHref,
  getSafeTelHref,
  getSevenDaysAgo,
  hasActiveAdminContactFilters,
  normalizeAdminContactSearch,
  parseAdminContactSearchParams,
  updateContactStatusSchema,
} from "@/schemas/admin-contact";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("admin-contact schemas", () => {
  it("chỉ chấp nhận UUID hợp lệ cho id yêu cầu", () => {
    expect(contactSubmissionIdSchema.safeParse(` ${VALID_UUID} `).success).toBe(true);

    for (const invalidId of [
      "",
      "123",
      "not-a-uuid",
      "550e8400-e29b-41d4-a716-44665544000Z",
      "' OR 1=1 --",
    ]) {
      expect(contactSubmissionIdSchema.safeParse(invalidId).success).toBe(false);
    }
  });

  it("chỉ chấp nhận 4 trạng thái xử lý hợp lệ", () => {
    for (const status of CONTACT_SUBMISSION_STATUSES) {
      expect(contactSubmissionStatusSchema.safeParse(status).success).toBe(true);
    }

    for (const invalidStatus of [
      "open",
      "pending",
      "sent",
      "failed",
      "deleted",
      "NEW",
      "",
    ]) {
      expect(contactSubmissionStatusSchema.safeParse(invalidStatus).success).toBe(false);
      expect(
        updateContactStatusSchema.safeParse({
          id: VALID_UUID,
          status: invalidStatus,
        }).success
      ).toBe(false);
    }

    expect(adminContactStatusFilterSchema.safeParse("open").success).toBe(true);
    expect(adminContactPeriodFilterSchema.safeParse("7d").success).toBe(true);
    expect(adminContactPeriodFilterSchema.safeParse("30d").success).toBe(false);
  });

  it("chuẩn hóa và giới hạn độ dài từ khóa tìm kiếm", () => {
    expect(normalizeAdminContactSearch("   ")).toBeUndefined();
    expect(normalizeAdminContactSearch("  Nguyễn\t\nVăn   An  ")).toBe("Nguyễn Văn An");

    const longInput = "a".repeat(MAX_ADMIN_CONTACT_SEARCH_LENGTH + 50);
    const normalized = normalizeAdminContactSearch(longInput);
    expect(normalized).toHaveLength(MAX_ADMIN_CONTACT_SEARCH_LENGTH);
  });

  it("xử lý an toàn search params hợp lệ và không hợp lệ từ URL", () => {
    expect(parseAdminContactSearchParams(undefined)).toEqual({ page: 1 });

    expect(
      parseAdminContactSearchParams({
        q: ["  lan@example.com  ", "other"],
        status: "contacted",
        emailStatus: "failed",
        service: "hop-rau-tuan",
        page: "3",
      })
    ).toEqual({
      q: "lan@example.com",
      status: "contacted",
      emailStatus: "failed",
      service: "hop-rau-tuan",
      page: 3,
    });

    for (const badPage of ["0", "-1", "-999", "abc", "1.5", "", "NaN"]) {
      expect(parseAdminContactSearchParams({ page: badPage }).page).toBe(1);
    }

    expect(parseAdminContactSearchParams({ page: "999999999999999999999" }).page).toBe(
      MAX_ADMIN_CONTACT_PAGE
    );

    expect(
      parseAdminContactSearchParams({
        status: "invalid_status",
        emailStatus: "invalid_email_status",
        service: "all",
      })
    ).toEqual({ page: 1 });

    expect(
      parseAdminContactSearchParams({
        status: "all",
        emailStatus: EMAIL_DELIVERY_STATUSES[2],
        service: "a".repeat(120),
      })
    ).toEqual({
      emailStatus: "failed",
      page: 1,
    });

    expect(
      parseAdminContactSearchParams({
        status: "open",
        period: "7d",
      })
    ).toEqual({
      status: "open",
      period: "7d",
      page: 1,
    });

    for (const invalidPeriod of ["30d", "1d", "all", "7D", "invalid", ""]) {
      expect(
        parseAdminContactSearchParams({
          period: invalidPeriod,
        })
      ).toEqual({ page: 1 });
    }
  });

  it("hasActiveAdminContactFilters nhận diện đầy đủ bộ lọc bao gồm status=open và period=7d", () => {
    expect(hasActiveAdminContactFilters({})).toBe(false);
    expect(hasActiveAdminContactFilters({ q: "lan" })).toBe(true);
    expect(hasActiveAdminContactFilters({ status: "open" })).toBe(true);
    expect(hasActiveAdminContactFilters({ emailStatus: "failed" })).toBe(true);
    expect(hasActiveAdminContactFilters({ service: "hop-rau-tuan" })).toBe(true);
    expect(hasActiveAdminContactFilters({ period: "7d" })).toBe(true);
  });

  it("getSevenDaysAgo tính chính xác 7 chu kỳ 24 giờ từ mốc now", () => {
    const fixedNow = new Date("2026-11-13T17:41:54.123Z");
    expect(getSevenDaysAgo(fixedNow).toISOString()).toBe(
      "2026-11-06T17:41:54.123Z"
    );
  });

  it("tạo href danh sách và chi tiết giữ nguyên bộ lọc sạch sẽ", () => {
    expect(buildAdminContactsHref()).toBe(ADMIN_CONTACTS_PATH);
    expect(buildAdminContactsHref({ page: 1 })).toBe(ADMIN_CONTACTS_PATH);
    expect(buildAdminContactsHref({ status: "open" })).toBe(
      "/admin/lien-he?status=open"
    );
    expect(buildAdminContactsHref({ period: "7d" })).toBe(
      "/admin/lien-he?period=7d"
    );

    const href = buildAdminContactsHref({
      q: "an",
      status: "open",
      emailStatus: "failed",
      service: "hop-rau-tuan",
      period: "7d",
      page: 2,
    });

    expect(href).toBe(
      "/admin/lien-he?q=an&status=open&emailStatus=failed&service=hop-rau-tuan&period=7d&page=2"
    );

    const detailHref = buildAdminContactDetailHref(VALID_UUID, {
      q: "an",
      status: "open",
      period: "7d",
      page: 2,
    });
    expect(detailHref).toBe(
      `/admin/lien-he/${VALID_UUID}?q=an&status=open&period=7d&page=2`
    );
  });

  it("chỉ tạo mailto và tel link khi dữ liệu an toàn", () => {
    expect(getSafeMailtoHref("  khach@mocfarm.vn ")).toBe("mailto:khach@mocfarm.vn");
    expect(getSafeMailtoHref("javascript:alert(1)")).toBeNull();
    expect(getSafeMailtoHref("user@example.com?subject=inject")).toBeNull();

    expect(getSafeTelHref("0912 345 678")).toBe("tel:0912345678");
    expect(getSafeTelHref("(+84) 912-345-678")).toBe("tel:+84912345678");
    expect(getSafeTelHref("javascript:alert(1)")).toBeNull();
    expect(getSafeTelHref("123")).toBeNull();
  });
});

