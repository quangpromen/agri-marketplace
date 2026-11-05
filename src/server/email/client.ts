import { Resend } from "resend";

let resendClient: Resend | null = null;

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

