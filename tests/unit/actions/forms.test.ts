import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  verifyTurnstile: vi.fn(),
  sendContactEmails: vi.fn(),
  sendNewsletterEmail: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  contactValues: vi.fn(),
  contactReturning: vi.fn(),
  newsletterValues: vi.fn(),
  newsletterUpsert: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  captureOperationalError: vi.fn(),
}));

vi.mock("@/server/observability/capture-error", () => ({
  captureOperationalError: mocks.captureOperationalError,
}));

vi.mock("@/server/security/rate-limit", () => ({
  checkFormRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/server/security/verify-turnstile", () => ({
  TURNSTILE_TOKEN_FIELD: "turnstileToken",
  verifyTurnstileToken: mocks.verifyTurnstile,
}));

vi.mock("@/server/email", () => ({
  sendContactEmails: mocks.sendContactEmails,
  sendNewsletterConfirmationEmail: mocks.sendNewsletterEmail,
}));

vi.mock("@/db/client", () => ({
  db: {
    insert: mocks.insert,
    update: mocks.update,
  },
}));

import { subscribeNewsletter } from "@/actions/subscribe-newsletter";
import { submitContact } from "@/actions/submit-contact";

function createContactFormData() {
  const data = new FormData();
  data.set("name", " Nguyễn Văn An ");
  data.set("phone", "0912 345 678");
  data.set("email", " AN@Example.com ");
  data.set("service", "hop-rau-tuan");
  data.set("message", "Tôi muốn được tư vấn thêm.");
  data.set("website", "");
  data.set("turnstileToken", "valid-token");
  return data;
}

function createNewsletterFormData() {
  const data = new FormData();
  data.set("email", " NEWS@Example.com ");
  data.set("website", "");
  data.set("turnstileToken", "valid-token");
  return data;
}

describe("form Server Actions", () => {
  beforeEach(() => {
    mocks.checkRateLimit.mockReset().mockResolvedValue({ success: true });
    mocks.verifyTurnstile.mockReset().mockResolvedValue({ success: true });
    mocks.sendContactEmails.mockReset().mockResolvedValue(undefined);
    mocks.sendNewsletterEmail.mockReset().mockResolvedValue(undefined);
    mocks.captureOperationalError.mockReset();

    mocks.contactReturning.mockReset().mockResolvedValue([{ id: "contact-id" }]);
    mocks.contactValues.mockReset().mockReturnValue({ returning: mocks.contactReturning });
    mocks.newsletterUpsert.mockReset().mockResolvedValue(undefined);
    mocks.newsletterValues
      .mockReset()
      .mockReturnValue({ onConflictDoUpdate: mocks.newsletterUpsert });
    mocks.insert.mockReset();
    mocks.insert
      .mockReturnValueOnce({ values: mocks.contactValues })
      .mockReturnValue({ values: mocks.newsletterValues });

    mocks.updateWhere.mockReset().mockResolvedValue(undefined);
    mocks.updateSet.mockReset().mockReturnValue({ where: mocks.updateWhere });
    mocks.update.mockReset().mockReturnValue({ set: mocks.updateSet });
  });

  it("contact: dừng trước Neon, Turnstile và Resend khi bị rate-limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      success: false,
      retryAfterSeconds: 60,
      message: "Thử lại sau.",
    });

    const result = await submitContact({ status: "idle" }, createContactFormData());

    expect(result).toEqual({ status: "rate_limited", message: "Thử lại sau." });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.sendContactEmails).not.toHaveBeenCalled();
  });

  it("contact: dừng trước Neon và Resend nếu Turnstile từ chối", async () => {
    mocks.verifyTurnstile.mockResolvedValue({
      success: false,
      code: "invalid_token",
      message: "Token không hợp lệ.",
    });

    const result = await submitContact({ status: "idle" }, createContactFormData());

    expect(result).toMatchObject({
      status: "validation_error",
      fieldErrors: { turnstileToken: ["Token không hợp lệ."] },
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.sendContactEmails).not.toHaveBeenCalled();
  });

  it("contact: ghi Neon, gửi Resend và cập nhật trạng thái sent", async () => {
    const result = await submitContact({ status: "idle" }, createContactFormData());

    expect(result).toEqual({ status: "success", submittedName: "Nguyễn Văn An" });
    expect(mocks.contactValues).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "0912345678",
        email: "an@example.com",
      })
    );
    expect(mocks.sendContactEmails).toHaveBeenCalledOnce();
    expect(mocks.updateSet).toHaveBeenCalledWith(expect.objectContaining({ emailStatus: "sent" }));
  });

  it("contact: vẫn thành công và lưu failed khi Resend lỗi", async () => {
    mocks.sendContactEmails.mockRejectedValue(new Error("Resend unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(submitContact({ status: "idle" }, createContactFormData())).resolves.toMatchObject(
      { status: "success" }
    );
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ emailStatus: "failed" })
    );
    expect(mocks.captureOperationalError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ service: "resend", form: "contact" })
    );
  });

  it("newsletter: ghi email chuẩn hóa vào Neon rồi gửi Resend", async () => {
    // Contact insert uses the first one-shot mock; consume it only in contact tests.
    mocks.insert.mockReset().mockReturnValue({ values: mocks.newsletterValues });

    const result = await subscribeNewsletter({ status: "idle" }, createNewsletterFormData());

    expect(result).toEqual({ status: "success" });
    expect(mocks.newsletterValues).toHaveBeenCalledWith(
      expect.objectContaining({ email: "news@example.com", status: "active" })
    );
    expect(mocks.newsletterUpsert).toHaveBeenCalledOnce();
    expect(mocks.sendNewsletterEmail).toHaveBeenCalledWith("news@example.com");
  });

  it("newsletter: dừng trước Neon và Resend khi bị rate-limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      success: false,
      retryAfterSeconds: 120,
      message: "Quá nhiều yêu cầu.",
    });

    const result = await subscribeNewsletter({ status: "idle" }, createNewsletterFormData());

    expect(result).toEqual({ status: "rate_limited", message: "Quá nhiều yêu cầu." });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.sendNewsletterEmail).not.toHaveBeenCalled();
  });
});
