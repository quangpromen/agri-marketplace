import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionApi: vi.fn(),
  signInEmailApi: vi.fn(),
  signOutApi: vi.fn(),
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
  headers: vi.fn(() => new Headers({ cookie: "better-auth.session_token=signed-cookie" })),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/db/client", () => ({
  db: {},
}));

import { loginAdmin, logoutAdmin } from "@/actions/admin-auth";
import { createAuthOptions, getAuth, resolveAuthEnv } from "@/lib/auth";
import {
  GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
  GENERIC_INVALID_CREDENTIALS_MESSAGE,
} from "@/schemas/auth";
import { getSession, requireAdmin } from "@/server/auth";

describe("Better Auth configuration & environment validation", () => {
  it("tắt đăng ký công khai (disableSignUp = true) và yêu cầu mật khẩu tối thiểu 12 ký tự", () => {
    const options = createAuthOptions({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "test_only_secret_with_at_least_32_characters_long",
      BETTER_AUTH_URL: "https://mocfarm.vn",
      NEXT_PUBLIC_SITE_URL: "https://mocfarm.vn",
    });

    expect(options.emailAndPassword.enabled).toBe(true);
    expect(options.emailAndPassword.disableSignUp).toBe(true);
    expect(options.emailAndPassword.minPasswordLength).toBe(12);
    expect(options.session.cookieCache.enabled).toBe(false);
    expect(options.advanced.useSecureCookies).toBe(true);
    expect(options.plugins.at(-1)?.id).toBe("next-cookies");
  });

  it("báo lỗi cấu hình rõ ràng khi thiếu env và không làm lộ secret/token/cookie", () => {
    expect(() =>
      resolveAuthEnv({
        BETTER_AUTH_SECRET: "",
        BETTER_AUTH_URL: "http://localhost:3000",
      })
    ).toThrow(/BETTER_AUTH_SECRET/);

    const shortSecret = "short_secret_value_123";
    try {
      resolveAuthEnv({
        BETTER_AUTH_SECRET: shortSecret,
        BETTER_AUTH_URL: "http://localhost:3000",
      });
      expect.unreachable("Phải ném lỗi khi secret ngắn hơn 32 ký tự");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(shortSecret);
    }

    const malformedUrlWithToken = "not-a-url-with-secret-token-value";
    try {
      resolveAuthEnv({
        BETTER_AUTH_SECRET: "test_only_secret_with_at_least_32_characters_long",
        BETTER_AUTH_URL: malformedUrlWithToken,
      });
      expect.unreachable("Phải ném lỗi khi BETTER_AUTH_URL sai định dạng");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(malformedUrlWithToken);
    }
  });
});

describe("getSession & requireAdmin", () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "test_only_secret_with_at_least_32_characters_long";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    const authInstance = getAuth();
    vi.spyOn(authInstance.api, "getSession").mockImplementation(mocks.getSessionApi);
    vi.spyOn(authInstance.api, "signInEmail").mockImplementation(mocks.signInEmailApi);
    vi.spyOn(authInstance.api, "signOut").mockImplementation(mocks.signOutApi);

    mocks.getSessionApi.mockReset();
    mocks.signInEmailApi.mockReset();
    mocks.signOutApi.mockReset();
    mocks.redirect.mockClear();
  });

  it("requireAdmin trả về user và session khi session hợp lệ", async () => {
    const now = Date.now();
    const validSession = {
      user: {
        id: "user_admin_1",
        email: "admin@mocfarm.vn",
        name: "Quản trị Mộc Farm",
        emailVerified: true,
        image: null,
        createdAt: new Date(now - 60_000),
        updatedAt: new Date(now - 60_000),
      },
      session: {
        id: "sess_1",
        userId: "user_admin_1",
        token: "valid_session_token",
        expiresAt: new Date(now + 3_600_000),
        createdAt: new Date(now - 60_000),
        updatedAt: new Date(now - 60_000),
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
      },
    };

    mocks.getSessionApi.mockResolvedValue(validSession);

    const result = await requireAdmin(new Headers());

    expect(result.user.email).toBe("admin@mocfarm.vn");
    expect(result.session.id).toBe("sess_1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("requireAdmin từ chối và redirect về /admin/login khi không có session", async () => {
    mocks.getSessionApi.mockResolvedValue(null);

    await expect(requireAdmin(new Headers())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("requireAdmin từ chối khi session đã hết hạn hoặc không hợp lệ", async () => {
    const now = Date.now();
    mocks.getSessionApi.mockResolvedValueOnce({
      user: {
        id: "user_admin_1",
        email: "admin@mocfarm.vn",
        name: "Quản trị Mộc Farm",
        emailVerified: true,
        createdAt: new Date(now - 120_000),
        updatedAt: new Date(now - 120_000),
      },
      session: {
        id: "sess_expired",
        userId: "user_admin_1",
        token: "expired_token",
        expiresAt: new Date(now - 1_000),
        createdAt: new Date(now - 120_000),
        updatedAt: new Date(now - 120_000),
      },
    });

    await expect(requireAdmin(new Headers())).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login"
    );

    mocks.getSessionApi.mockResolvedValueOnce({
      user: {
        id: "user_admin_1",
        email: "admin@mocfarm.vn",
        name: "Quản trị Mộc Farm",
        emailVerified: true,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      session: {
        id: "sess_mismatch",
        userId: "other_user",
        token: "mismatch_token",
        expiresAt: new Date(now + 60_000),
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    });

    expect(await getSession(new Headers())).toBeNull();
  });
});

describe("loginAdmin & logoutAdmin Server Actions", () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "test_only_secret_with_at_least_32_characters_long";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";

    const authInstance = getAuth();
    vi.spyOn(authInstance.api, "signInEmail").mockImplementation(mocks.signInEmailApi);
    vi.spyOn(authInstance.api, "signOut").mockImplementation(mocks.signOutApi);

    mocks.signInEmailApi.mockReset();
    mocks.signOutApi.mockReset();
    mocks.redirect.mockClear();
  });

  it("không bao giờ trả password trong form state khi lỗi validation", async () => {
    const formData = new FormData();
    formData.set("email", "invalid-email");
    formData.set("password", "MySuperSecretPassword123!");
    formData.set("callbackURL", "/admin");

    const state = await loginAdmin({ status: "idle" }, formData);

    expect(state.status).toBe("validation_error");
    expect(JSON.stringify(state)).not.toContain("MySuperSecretPassword123!");
    expect("password" in state).toBe(false);
  });

  it("trả thông báo chung và không làm lộ password/token/cookie khi sai thông tin đăng nhập hoặc lỗi hệ thống", async () => {
    const rawPassword = "SensitivePasswordValue!999";
    const rawToken = "session_token_secret_abc123";
    const rawCookie = "better-auth.session_token=cookie_secret_xyz789";

    mocks.signInEmailApi.mockRejectedValueOnce({
      status: "UNAUTHORIZED",
      statusCode: 401,
      body: { code: "INVALID_EMAIL_OR_PASSWORD" },
      message: `Invalid credentials for password=${rawPassword} token=${rawToken} cookie=${rawCookie}`,
    });

    const formData = new FormData();
    formData.set("email", "  ADMIN@MocFarm.vn ");
    formData.set("password", rawPassword);
    formData.set("callbackURL", "https://evil.example/steal");

    const authFailState = await loginAdmin({ status: "idle" }, formData);

    expect(authFailState).toEqual({
      status: "error",
      message: GENERIC_INVALID_CREDENTIALS_MESSAGE,
      submittedEmail: "admin@mocfarm.vn",
    });
    expect(JSON.stringify(authFailState)).not.toContain(rawPassword);
    expect(JSON.stringify(authFailState)).not.toContain(rawToken);
    expect(JSON.stringify(authFailState)).not.toContain(rawCookie);

    mocks.signInEmailApi.mockRejectedValueOnce(
      new Error(`Database failure with password=${rawPassword} token=${rawToken} cookie=${rawCookie}`)
    );

    const serverFailState = await loginAdmin({ status: "idle" }, formData);

    expect(serverFailState).toEqual({
      status: "error",
      message: GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
      submittedEmail: "admin@mocfarm.vn",
    });
    expect(JSON.stringify(serverFailState)).not.toContain(rawPassword);
    expect(JSON.stringify(serverFailState)).not.toContain(rawToken);
    expect(JSON.stringify(serverFailState)).not.toContain(rawCookie);
  });

  it("chặn open redirect và chỉ redirect về đường dẫn nội bộ sau khi đăng nhập thành công", async () => {
    mocks.signInEmailApi.mockResolvedValue({
      token: "session_tok_1",
      user: {
        id: "user_admin_1",
        email: "admin@mocfarm.vn",
        name: "Admin",
      },
    });

    const formData = new FormData();
    formData.set("email", "admin@mocfarm.vn");
    formData.set("password", "ValidAdminPassword123!");
    formData.set("callbackURL", "https://evil.example/phishing");

    await expect(loginAdmin({ status: "idle" }, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin"
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/admin");
  });

  it("logoutAdmin gọi signOut để xóa session và redirect về /admin/login", async () => {
    mocks.signOutApi.mockResolvedValue({ success: true });

    await expect(logoutAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mocks.signOutApi).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/login");
  });
});

