import { siteConfig } from "@/config/site";
import { getContactServiceLabel, type ContactSubmissionInput } from "@/schemas/contact";
import { getContactNotificationEmail, sendEmail } from "./client";

export type ContactEmailPayload = Omit<ContactSubmissionInput, "website">;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactNotificationEmail(
  payload: ContactEmailPayload
): Promise<void> {
  const to = getContactNotificationEmail();
  const serviceLabel = getContactServiceLabel(payload.service);

  const safeName = escapeHtml(payload.name);
  const safePhone = escapeHtml(payload.phone);
  const safeEmail = escapeHtml(payload.email);
  const safeService = escapeHtml(serviceLabel);
  const safeMessage = escapeHtml(payload.message).replace(/\r?\n/g, "<br />");

  await sendEmail({
    to,
    replyTo: payload.email,
    subject: `[${siteConfig.name}] Liên hệ mới từ ${payload.name} - ${serviceLabel}`,
    text: [
      `Thông tin liên hệ mới từ website ${siteConfig.name}:`,
      "",
      `- Họ và tên: ${payload.name}`,
      `- Số điện thoại: ${payload.phone}`,
      `- Email: ${payload.email}`,
      `- Chủ đề: ${serviceLabel} (${payload.service})`,
      "",
      "Nội dung lời nhắn:",
      payload.message,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
        <h2 style="margin-bottom: 12px; color: #14532d;">Liên hệ mới từ ${escapeHtml(siteConfig.name)}</h2>
        <p style="margin-top: 0;">Hệ thống vừa ghi nhận một yêu cầu liên hệ mới:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Họ và tên:</td>
            <td style="padding: 8px 0;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Số điện thoại:</td>
            <td style="padding: 8px 0;">${safePhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Chủ đề:</td>
            <td style="padding: 8px 0;">${safeService}</td>
          </tr>
        </table>
        <div style="padding: 12px 16px; background-color: #f9fafb; border-left: 4px solid #15803d; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-weight: bold;">Nội dung lời nhắn:</p>
          <p style="margin: 0;">${safeMessage}</p>
        </div>
      </div>
    `,
  });
}

export async function sendContactConfirmationEmail(
  payload: ContactEmailPayload
): Promise<void> {
  const serviceLabel = getContactServiceLabel(payload.service);

  const safeName = escapeHtml(payload.name);
  const safePhone = escapeHtml(payload.phone);
  const safeService = escapeHtml(serviceLabel);

  await sendEmail({
    to: payload.email,
    subject: `${siteConfig.name} đã nhận được yêu cầu liên hệ của bạn`,
    text: [
      `Chào ${payload.name},`,
      "",
      `Cảm ơn bạn đã liên hệ với ${siteConfig.name} về chủ đề "${serviceLabel}".`,
      `Đội ngũ của chúng tôi đã ghi nhận thông tin và sẽ phản hồi qua số điện thoại ${payload.phone} hoặc email này trong thời gian sớm nhất.`,
      "",
      `Nếu cần hỗ trợ gấp, bạn có thể liên hệ hotline: ${siteConfig.contact.phoneDisplay}.`,
      "",
      `Trân trọng,`,
      siteConfig.name,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
        <h2 style="margin-bottom: 12px; color: #14532d;">Cảm ơn bạn đã liên hệ với ${escapeHtml(siteConfig.name)}</h2>
        <p>Chào <strong>${safeName}</strong>,</p>
        <p>
          Chúng tôi đã nhận được yêu cầu của bạn về chủ đề <strong>${safeService}</strong>.
          Đội ngũ ${escapeHtml(siteConfig.name)} sẽ liên hệ lại với bạn qua số điện thoại <strong>${safePhone}</strong> hoặc email này trong thời gian sớm nhất.
        </p>
        <p>
          Nếu cần hỗ trợ khẩn cấp, bạn có thể gọi trực tiếp hotline:
          <strong>${escapeHtml(siteConfig.contact.phoneDisplay)}</strong>.
        </p>
        <p style="margin-top: 24px;">
          Trân trọng,<br />
          <strong>${escapeHtml(siteConfig.name)}</strong>
        </p>
      </div>
    `,
  });
}

export async function sendContactEmails(payload: ContactEmailPayload): Promise<void> {
  const results = await Promise.allSettled([
    sendContactNotificationEmail(payload),
    sendContactConfirmationEmail(payload),
  ]);

  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) =>
      result.reason instanceof Error ? result.reason.message : "Email delivery failed"
    );

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

export async function sendNewsletterConfirmationEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Xác nhận đăng ký bản tin ${siteConfig.name}`,
    text: [
      `Chào bạn,`,
      "",
      `Cảm ơn bạn đã đăng ký nhận bản tin từ ${siteConfig.name}.`,
      "Bạn sẽ nhận được thông tin mùa vụ nông sản hữu cơ, kiến thức canh tác bền vững và các hoạt động mới nhất từ nông trại.",
      "",
      "Trân trọng,",
      siteConfig.name,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px;">
        <h2 style="margin-bottom: 12px; color: #14532d;">Đăng ký bản tin ${escapeHtml(siteConfig.name)} thành công</h2>
        <p>Chào bạn,</p>
        <p>
          Cảm ơn bạn đã đăng ký nhận bản tin từ <strong>${escapeHtml(siteConfig.name)}</strong>.
          Chúng tôi sẽ gửi đến bạn thông tin mùa vụ nông sản hữu cơ, chia sẻ kỹ thuật canh tác sinh thái và các hoạt động mới nhất tại nông trại.
        </p>
        <p style="margin-top: 24px;">
          Trân trọng,<br />
          <strong>${escapeHtml(siteConfig.name)}</strong>
        </p>
      </div>
    `,
  });
}
