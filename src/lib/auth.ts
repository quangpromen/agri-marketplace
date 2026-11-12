import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { authSchema } from "@/db/auth-schema";
import { db } from "@/db/client";
import { MAX_ADMIN_PASSWORD_LENGTH, MIN_ADMIN_PASSWORD_LENGTH } from "@/schemas/auth";

const MIN_SECRET_LENGTH = 32;

export type AuthEnvConfig = {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
};

export function resolveAuthEnv(
  envSource: Record<string, string | undefined> = process.env
): AuthEnvConfig {
  const secret = envSource.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET chưa được cấu hình. Vui lòng thiết lập biến môi trường này."
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET không hợp lệ (cần tối thiểu ${MIN_SECRET_LENGTH} ký tự).`
    );
  }

  const rawBaseUrl = envSource.BETTER_AUTH_URL?.trim();

  if (!rawBaseUrl) {
    throw new Error(
      "BETTER_AUTH_URL chưa được cấu hình. Vui lòng thiết lập biến môi trường này."
    );
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error("BETTER_AUTH_URL không phải là một địa chỉ URL hợp lệ.");
  }

  const origins = new Set<string>([parsedBaseUrl.origin]);
  const publicSiteUrl = envSource.NEXT_PUBLIC_SITE_URL?.trim();

  if (publicSiteUrl) {
    try {
      origins.add(new URL(publicSiteUrl).origin);
    } catch {
      // Bỏ qua NEXT_PUBLIC_SITE_URL nếu không hợp lệ; giữ nguyên origin từ BETTER_AUTH_URL.
    }
  }

  return {
    secret,
    baseURL: parsedBaseUrl.origin,
    trustedOrigins: Array.from(origins),
  };
}

export function createAuthOptions(
  envSource: Record<string, string | undefined> = process.env
) {
  const { secret, baseURL, trustedOrigins } = resolveAuthEnv(envSource);
  const isProductionEnv = envSource.NODE_ENV === "production";

  return {
    appName: "Mộc Farm Admin",
    baseURL,
    secret,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true as const,
      minPasswordLength: MIN_ADMIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_ADMIN_PASSWORD_LENGTH,
      autoSignIn: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      useSecureCookies: isProductionEnv,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: isProductionEnv,
        path: "/",
      },
    },
    // nextCookies() bắt buộc đứng cuối danh sách plugins theo tài liệu Better Auth.
    plugins: [nextCookies()],
  };
}

type BetterAuthInstance = ReturnType<typeof betterAuth<ReturnType<typeof createAuthOptions>>>;

let cachedAuthInstance: BetterAuthInstance | null = null;

export function getAuth(): BetterAuthInstance {
  if (!cachedAuthInstance) {
    cachedAuthInstance = betterAuth(createAuthOptions());
  }

  return cachedAuthInstance;
}

export const auth = {
  get handler() {
    return getAuth().handler;
  },
  get api() {
    return getAuth().api;
  },
  get options() {
    return getAuth().options;
  },
  get $context() {
    return getAuth().$context;
  },
  get $ERROR_CODES() {
    return getAuth().$ERROR_CODES;
  },
};

