import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

type FormRateLimitScope = "contact" | "newsletter";

export type FormRateLimitResult =
  | { success: true }
  | {
      success: false;
      retryAfterSeconds: number;
      message: string;
    };

const RATE_LIMIT_TIMEOUT_MS = 1_000;
const FALLBACK_CLIENT_IP = "127.0.0.1";

let rateLimiters: Record<FormRateLimitScope, Ratelimit> | null | undefined;
let hasLoggedMissingConfiguration = false;

function getRateLimiters(): Record<FormRateLimitScope, Ratelimit> | null {
  if (rateLimiters !== undefined) {
    return rateLimiters;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const ipSalt = process.env.RATE_LIMIT_IP_SALT?.trim();

  if (!url || !token || !ipSalt) {
    if (!hasLoggedMissingConfiguration) {
      console.warn(
        "Rate limiting is disabled because Upstash or RATE_LIMIT_IP_SALT is not configured."
      );
      hasLoggedMissingConfiguration = true;
    }

    rateLimiters = null;
    return rateLimiters;
  }

  const redis = new Redis({ url, token });

  rateLimiters = {
    contact: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "moc-farm:ratelimit:contact",
      timeout: RATE_LIMIT_TIMEOUT_MS,
      analytics: false,
    }),
    newsletter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "15 m"),
      prefix: "moc-farm:ratelimit:newsletter",
      timeout: RATE_LIMIT_TIMEOUT_MS,
      analytics: false,
    }),
  };

  return rateLimiters;
}

function getClientIp(): string {
  const requestHeaders = headers();
  const forwardedFor =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for") ??
    requestHeaders.get("x-real-ip");

  const candidate = forwardedFor?.split(",")[0]?.trim();
  return candidate && isIP(candidate) ? candidate : FALLBACK_CLIENT_IP;
}

function getRateLimitIdentifier(scope: FormRateLimitScope): string {
  const ipSalt = process.env.RATE_LIMIT_IP_SALT?.trim();

  if (!ipSalt) {
    throw new Error("RATE_LIMIT_IP_SALT is not configured.");
  }

  const hashedIp = createHmac("sha256", ipSalt).update(getClientIp()).digest("hex");

  return `${scope}:${hashedIp}`;
}

function getRateLimitMessage(retryAfterSeconds: number): string {
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau khoảng ${retryAfterMinutes} phút.`;
}

export async function checkFormRateLimit(scope: FormRateLimitScope): Promise<FormRateLimitResult> {
  const limiters = getRateLimiters();

  if (!limiters) {
    return { success: true };
  }

  try {
    const result = await limiters[scope].limit(getRateLimitIdentifier(scope));

    if (result.reason === "timeout") {
      console.warn("Rate limit check timed out; allowing the request.");
      return { success: true };
    }

    if (result.success) {
      return { success: true };
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

    return {
      success: false,
      retryAfterSeconds,
      message: getRateLimitMessage(retryAfterSeconds),
    };
  } catch {
    console.error("Unable to check the form rate limit; allowing the request.");
    return { success: true };
  }
}
