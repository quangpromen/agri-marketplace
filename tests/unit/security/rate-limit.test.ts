import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  headersGet: vi.fn(),
  redisConstructor: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

vi.mock("next/headers", () => ({
  headers: () => ({ get: mocks.headersGet }),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class Redis {
    constructor(options: unknown) {
      mocks.redisConstructor(options);
    }
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow = vi.fn(() => "sliding-window");
    limit = mocks.limit;
  },
}));

describe("checkFormRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.limit.mockReset();
    mocks.headersGet.mockReset();
    mocks.redisConstructor.mockReset();
    mocks.captureOperationalError.mockReset();
    mocks.headersGet.mockImplementation((name: string) =>
      name === "x-forwarded-for" ? "203.0.113.10, 10.0.0.1" : null
    );
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    process.env.RATE_LIMIT_IP_SALT = "test-salt";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RATE_LIMIT_IP_SALT;
  });

  it("cho phép request còn quota và không gửi IP thô tới Upstash", async () => {
    mocks.limit.mockResolvedValue({ success: true, reason: undefined });
    const { checkFormRateLimit } = await import("@/server/security/rate-limit");

    await expect(checkFormRateLimit("contact")).resolves.toEqual({ success: true });
    expect(mocks.captureOperationalError).not.toHaveBeenCalled();
    expect(mocks.limit).toHaveBeenCalledWith(expect.stringMatching(/^contact:[a-f0-9]{64}$/));
    expect(mocks.limit.mock.calls[0][0]).not.toContain("203.0.113.10");
  });

  it("trả thời gian chờ khi hết quota", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reason: undefined,
      reset: Date.now() + 120_000,
    });
    const { checkFormRateLimit } = await import("@/server/security/rate-limit");

    const result = await checkFormRateLimit("newsletter");
    expect(result).toMatchObject({ success: false, retryAfterSeconds: expect.any(Number) });
    if (!result.success) {
      expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(119);
      expect(result.message).toContain("phút");
    }
  });

  it("fail-open khi Upstash timeout", async () => {
    mocks.limit.mockResolvedValue({ success: false, reason: "timeout" });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { checkFormRateLimit } = await import("@/server/security/rate-limit");

    await expect(checkFormRateLimit("contact")).resolves.toEqual({ success: true });
    expect(mocks.captureOperationalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ service: "upstash", form: "contact" })
    );
  });

  it("fail-open khi Upstash ném lỗi", async () => {
    mocks.limit.mockRejectedValue(new Error("Upstash unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { checkFormRateLimit } = await import("@/server/security/rate-limit");

    await expect(checkFormRateLimit("contact")).resolves.toEqual({ success: true });
  });

  it("không khởi tạo Redis nếu thiếu cấu hình", async () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { checkFormRateLimit } = await import("@/server/security/rate-limit");

    await expect(checkFormRateLimit("contact")).resolves.toEqual({ success: true });
    expect(mocks.redisConstructor).not.toHaveBeenCalled();
  });
});
