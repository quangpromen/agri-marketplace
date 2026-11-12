import { describe, expect, it } from "vitest";
import {
  ADMIN_DASHBOARD_PATH,
  adminBootstrapSchema,
  adminLoginSchema,
  internalCallbackUrlSchema,
  sanitizeCallbackUrl,
} from "@/schemas/auth";

describe("adminLoginSchema & internalCallbackUrlSchema", () => {
  it("chấp nhận email hợp lệ, chuẩn hóa email (trim + lowercase) và giữ callbackURL nội bộ", () => {
    const result = adminLoginSchema.parse({
      email: "  Admin@MocFarm.VN  ",
      password: "ValidPassword123!",
      callbackURL: "/admin",
    });

    expect(result).toEqual({
      email: "admin@mocfarm.vn",
      password: "ValidPassword123!",
      callbackURL: "/admin",
    });
  });

  it("từ chối email không hợp lệ", () => {
    const result = adminLoginSchema.safeParse({
      email: "khong-phai-email",
      password: "ValidPassword123!",
      callbackURL: "/admin",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("từ chối mật khẩu trống", () => {
    const result = adminLoginSchema.safeParse({
      email: "admin@mocfarm.vn",
      password: "",
      callbackURL: "/admin",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it.each(["/admin", "/admin?tab=overview", "/admin/settings"])(
    "chấp nhận callback URL nội bộ hợp lệ: %s",
    (callbackURL) => {
      const parsed = internalCallbackUrlSchema.safeParse(callbackURL);
      expect(parsed.success).toBe(true);
    }
  );

  it("từ chối https://evil.example", () => {
    const parsed = internalCallbackUrlSchema.safeParse("https://evil.example");
    expect(parsed.success).toBe(false);
    expect(sanitizeCallbackUrl("https://evil.example")).toBe(ADMIN_DASHBOARD_PATH);
  });

  it("từ chối //evil.example", () => {
    const parsed = internalCallbackUrlSchema.safeParse("//evil.example");
    expect(parsed.success).toBe(false);
    expect(sanitizeCallbackUrl("//evil.example")).toBe(ADMIN_DASHBOARD_PATH);
  });

  it.each([
    "http://evil.example/admin",
    "javascript:alert(1)",
    "/\\evil.example",
    "/admin/login",
    "",
  ])("từ chối và fallback an toàn với callback URL nguy hiểm hoặc vòng lặp: %s", (unsafeUrl) => {
    expect(internalCallbackUrlSchema.safeParse(unsafeUrl).success).toBe(false);
    expect(sanitizeCallbackUrl(unsafeUrl)).toBe(ADMIN_DASHBOARD_PATH);
  });
});

describe("adminBootstrapSchema", () => {
  it("chuẩn hóa tên, email và yêu cầu mật khẩu từ 12 ký tự", () => {
    const valid = adminBootstrapSchema.parse({
      name: "  Quản Trị Mộc Farm  ",
      email: "  ADMIN@MocFarm.vn ",
      password: "StrongAdminPassword123!",
    });

    expect(valid).toEqual({
      name: "Quản Trị Mộc Farm",
      email: "admin@mocfarm.vn",
      password: "StrongAdminPassword123!",
    });

    const tooShort = adminBootstrapSchema.safeParse({
      name: "Admin",
      email: "admin@mocfarm.vn",
      password: "short-pass",
    });
    expect(tooShort.success).toBe(false);
  });
});

