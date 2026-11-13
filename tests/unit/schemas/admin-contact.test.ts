import { describe, expect, it } from "vitest";
import {
  ADMIN_CONTACTS_PATH,
  CONTACT_SUBMISSION_STATUSES,
  EMAIL_DELIVERY_STATUSES,
  MAX_ADMIN_CONTACT_PAGE,
  MAX_ADMIN_CONTACT_SEARCH_LENGTH,
  buildAdminContactDetailHref,
  buildAdminContactsHref,
  contactSubmissionIdSchema,
  contactSubmissionStatusSchema,
  getSafeMailtoHref,
  getSafeTelHref,
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

    for (const invalidStatus of ["pending", "sent", "failed", "deleted", "NEW", ""]) {
      expect(contactSubmissionStatusSchema.safeParse(invalidStatus).success).toBe(false);
      expect(
        updateContactStatusSchema.safeParse({
          id: VALID_UUID,
          status: invalidStatus,
        }).success
      ).toBe(false);
    }
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
  });

  it("tạo href danh sách và chi tiết giữ nguyên bộ lọc sạch sẽ", () => {
    expect(buildAdminContactsHref()).toBe(ADMIN_CONTACTS_PATH);
    expect(buildAdminContactsHref({ page: 1 })).toBe(ADMIN_CONTACTS_PATH);

    const href = buildAdminContactsHref({
      q: "an",
      status: "new",
      emailStatus: "failed",
      service: "hop-rau-tuan",
      page: 2,
    });

    expect(href).toBe(
      "/admin/lien-he?q=an&status=new&emailStatus=failed&service=hop-rau-tuan&page=2"
    );

    const detailHref = buildAdminContactDetailHref(VALID_UUID, {
      q: "an",
      status: "new",
      page: 2,
    });
    expect(detailHref).toBe(`/admin/lien-he/${VALID_UUID}?q=an&status=new&page=2`);
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

