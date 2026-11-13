import { describe, expect, it } from "vitest";
import {
  CONTACT_STATUS_META,
  CONTACT_STATUS_OPTIONS,
  EMAIL_STATUS_META,
  EMAIL_STATUS_OPTIONS,
  formatAdminDateTime,
} from "@/lib/admin-contact-presentation";
import {
  CONTACT_SUBMISSION_STATUSES,
  EMAIL_DELIVERY_STATUSES,
} from "@/schemas/admin-contact";

describe("admin-contact presentation helpers", () => {
  it("ánh xạ đầy đủ metadata và options cho tất cả trạng thái xử lý và gửi email", () => {
    expect(CONTACT_STATUS_OPTIONS.map((item) => item.value)).toEqual([
      ...CONTACT_SUBMISSION_STATUSES,
    ]);
    expect(EMAIL_STATUS_OPTIONS.map((item) => item.value)).toEqual([
      ...EMAIL_DELIVERY_STATUSES,
    ]);

    for (const status of CONTACT_SUBMISSION_STATUSES) {
      expect(CONTACT_STATUS_META[status].label.length).toBeGreaterThan(0);
      expect(CONTACT_STATUS_META[status].description.length).toBeGreaterThan(0);
      expect(CONTACT_STATUS_META[status].badgeClassName.length).toBeGreaterThan(0);
    }

    for (const emailStatus of EMAIL_DELIVERY_STATUSES) {
      expect(EMAIL_STATUS_META[emailStatus].label.length).toBeGreaterThan(0);
      expect(EMAIL_STATUS_META[emailStatus].description.length).toBeGreaterThan(0);
      expect(EMAIL_STATUS_META[emailStatus].badgeClassName.length).toBeGreaterThan(0);
    }
  });

  it("formatAdminDateTime định dạng theo múi giờ Asia/Ho_Chi_Minh và xử lý an toàn giá trị rỗng hoặc không hợp lệ", () => {
    expect(formatAdminDateTime(null)).toBe("—");
    expect(formatAdminDateTime(undefined)).toBe("—");
    expect(formatAdminDateTime("not-a-valid-date")).toBe("—");

    // 2026-11-12T08:30:00Z = 15:30 12/11/2026 tại Asia/Ho_Chi_Minh (+07:00)
    const formattedFromDate = formatAdminDateTime(new Date("2026-11-12T08:30:00Z"));
    const formattedFromIso = formatAdminDateTime("2026-11-12T08:30:00Z");

    expect(formattedFromDate).toContain("15:30");
    expect(formattedFromDate).toContain("12/11/2026");
    expect(formattedFromIso).toBe(formattedFromDate);
  });
});

