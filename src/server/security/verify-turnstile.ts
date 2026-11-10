import { captureOperationalError } from "@/server/observability/capture-error";

const TURNSTILE_VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_VERIFY_TIMEOUT_MS = 8000;

export const TURNSTILE_TOKEN_FIELD = "turnstileToken";

export type TurnstileVerificationFailureCode =
  | "missing_token"
  | "expired_or_duplicate"
  | "invalid_token"
  | "config_error"
  | "verification_unavailable";

export type TurnstileVerificationResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: TurnstileVerificationFailureCode;
      message: string;
    };

type CloudflareSiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(
  token: string | null | undefined
): Promise<TurnstileVerificationResult> {
  const trimmedToken = typeof token === "string" ? token.trim() : "";

  if (!trimmedToken) {
    return {
      success: false,
      code: "missing_token",
      message: "Vui lòng hoàn thành bước xác minh bảo mật trước khi gửi.",
    };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not configured.");
    return {
      success: false,
      code: "config_error",
      message: "Hệ thống xác minh bảo mật chưa sẵn sàng. Vui lòng thử lại sau ít phút.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: trimmedToken,
    });

    const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      captureOperationalError(new Error(`Cloudflare Turnstile returned HTTP ${response.status}`), {
        service: "turnstile",
        operation: "verify_token",
      });
      console.error(`Cloudflare Turnstile siteverify returned HTTP ${response.status}.`);
      return {
        success: false,
        code: "verification_unavailable",
        message: "Không thể xác minh bảo mật lúc này. Vui lòng thử lại sau ít phút.",
      };
    }

    const data = (await response.json()) as CloudflareSiteverifyResponse;

    if (data.success === true) {
      return {
        success: true,
      };
    }

    const errorCodes = Array.isArray(data["error-codes"]) ? data["error-codes"] : [];

    if (errorCodes.includes("timeout-or-duplicate")) {
      return {
        success: false,
        code: "expired_or_duplicate",
        message: "Phiên xác minh bảo mật đã hết hạn. Vui lòng thực hiện xác minh lại.",
      };
    }

    return {
      success: false,
      code: "invalid_token",
      message: "Xác minh bảo mật không thành công. Vui lòng thử lại bước xác minh.",
    };
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";

    captureOperationalError(error, {
      service: "turnstile",
      operation: "verify_token",
    });

    console.error(
      isAbortError
        ? "Cloudflare Turnstile siteverify request timed out."
        : "Unable to verify Cloudflare Turnstile token."
    );

    return {
      success: false,
      code: "verification_unavailable",
      message: "Không thể kết nối dịch vụ xác minh bảo mật. Vui lòng thử lại sau ít phút.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
