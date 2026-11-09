import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "@/server/security/verify-turnstile";

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
  });

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
    vi.unstubAllGlobals();
  });

  it("không gọi Cloudflare khi thiếu token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken(" ")).resolves.toMatchObject({
      success: false,
      code: "missing_token",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trả config_error khi thiếu secret", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(verifyTurnstileToken("token")).resolves.toMatchObject({
      success: false,
      code: "config_error",
    });
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("chấp nhận token được Cloudflare xác minh", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken(" valid-token ")).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("siteverify"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("response=valid-token"),
      })
    );
  });

  it("phân biệt token hết hạn hoặc đã dùng", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ success: false, "error-codes": ["timeout-or-duplicate"] }),
            { status: 200 }
          )
        )
    );

    await expect(verifyTurnstileToken("token")).resolves.toMatchObject({
      success: false,
      code: "expired_or_duplicate",
    });
  });

  it("trả verification_unavailable khi Cloudflare lỗi mạng", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(verifyTurnstileToken("token")).resolves.toMatchObject({
      success: false,
      code: "verification_unavailable",
    });
  });
});
