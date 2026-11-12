import { z } from "zod";

export const ADMIN_DASHBOARD_PATH = "/admin";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const MIN_ADMIN_PASSWORD_LENGTH = 12;
export const MAX_ADMIN_PASSWORD_LENGTH = 128;

export const GENERIC_INVALID_CREDENTIALS_MESSAGE =
  "Email hoặc mật khẩu không đúng.";

export const GENERIC_AUTH_SERVICE_ERROR_MESSAGE =
  "Không thể xử lý đăng nhập lúc này. Vui lòng thử lại sau ít phút.";

const INTERNAL_ORIGIN = "http://internal.mocfarm.local";
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

export function isSafeInternalCallbackUrl(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    CONTROL_CHAR_PATTERN.test(trimmed)
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) {
      return false;
    }

    if (
      parsed.pathname === ADMIN_LOGIN_PATH ||
      parsed.pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)
    ) {
      return false;
    }

    return parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

export const internalCallbackUrlSchema = z
  .string()
  .trim()
  .refine(isSafeInternalCallbackUrl, "Đường dẫn chuyển hướng nội bộ không hợp lệ.");

export function sanitizeCallbackUrl(
  rawUrl: string | null | undefined,
  fallback: string = ADMIN_DASHBOARD_PATH
): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return fallback;
  }

  const parsed = internalCallbackUrlSchema.safeParse(rawUrl);
  if (!parsed.success) {
    return fallback;
  }

  const url = new URL(parsed.data, INTERNAL_ORIGIN);
  return `${url.pathname}${url.search}${url.hash}`;
}

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Vui lòng nhập địa chỉ email hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .max(MAX_ADMIN_PASSWORD_LENGTH, `Mật khẩu tối đa ${MAX_ADMIN_PASSWORD_LENGTH} ký tự.`),
  callbackURL: internalCallbackUrlSchema.default(ADMIN_DASHBOARD_PATH),
});

export const adminBootstrapSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên quản trị viên cần có ít nhất 2 ký tự.")
    .max(100, "Tên quản trị viên tối đa 100 ký tự."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email quản trị viên không hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  password: z
    .string()
    .min(
      MIN_ADMIN_PASSWORD_LENGTH,
      `Mật khẩu quản trị viên cần tối thiểu ${MIN_ADMIN_PASSWORD_LENGTH} ký tự.`
    )
    .max(
      MAX_ADMIN_PASSWORD_LENGTH,
      `Mật khẩu quản trị viên tối đa ${MAX_ADMIN_PASSWORD_LENGTH} ký tự.`
    ),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminBootstrapInput = z.infer<typeof adminBootstrapSchema>;

