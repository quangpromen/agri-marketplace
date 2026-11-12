import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-privacy";

describe("scrubSentryEvent", () => {
  it("loại bỏ PII, request body, headers, extra và breadcrumbs", () => {
    const event: ErrorEvent = {
      type: undefined,
      message: "Không gửi được email an@example.com cho 0912 345 678",
      user: { id: "user-id", email: "an@example.com", ip_address: "203.0.113.1" },
      extra: { formData: { message: "Nội dung riêng tư" } },
      breadcrumbs: [{ message: "Bearer re_123456789-secret" }],
      request: {
        method: "POST",
        url: "https://mocfarm.vn/lien-he?email=an@example.com",
        headers: { authorization: "Bearer secret" },
        data: { phone: "0912345678" },
      },
      exception: {
        values: [{ type: "Error", value: "Resend failed for an@example.com" }],
      },
    };

    const result = scrubSentryEvent(event);

    expect(result.user).toBeUndefined();
    expect(result.extra).toBeUndefined();
    expect(result.breadcrumbs).toBeUndefined();
    expect(result.request).toEqual({ method: "POST", url: "https://mocfarm.vn/lien-he" });
    expect(result.message).toBe("Không gửi được email [Filtered email] cho [Filtered phone]");
    expect(result.exception?.values?.[0]?.value).toBe("Resend failed for [Filtered email]");
  });

  it("xóa query string khỏi URL tương đối", () => {
    const result = scrubSentryEvent({
      type: undefined,
      request: { url: "/lien-he?turnstileToken=secret#form" },
    });

    expect(result.request?.url).toBe("/lien-he");
  });

  it("ẩn mật khẩu, session token, cookie và secret khỏi message và exception", () => {
    const result = scrubSentryEvent({
      type: undefined,
      message:
        "Auth failed: password=SuperSecretPassword123! session_token=tok_abc123456 cookie=better-auth.session_token=xyz987",
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Header authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 BETTER_AUTH_SECRET=my_super_secret_key_32_chars",
          },
        ],
      },
    });

    expect(result.message).not.toContain("SuperSecretPassword123!");
    expect(result.message).not.toContain("tok_abc123456");
    expect(result.message).not.toContain("xyz987");
    expect(result.exception?.values?.[0]?.value).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(result.exception?.values?.[0]?.value).not.toContain("my_super_secret_key_32_chars");
  });
});
