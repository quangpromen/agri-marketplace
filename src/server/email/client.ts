import { Resend } from "resend";

let resendClient: Resend | null = null;

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getResendFromEmail(): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return fromEmail;
}

export function getContactNotificationEmail(): string {
  const notificationEmail = process.env.CONTACT_NOTIFICATION_EMAIL?.trim();

  if (!notificationEmail) {
    throw new Error("CONTACT_NOTIFICATION_EMAIL is not configured.");
  }

  return notificationEmail;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const resend = getResendClient();
  const from = getResendFromEmail();

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}
