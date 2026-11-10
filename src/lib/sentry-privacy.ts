import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<!\d)(?:\+?84|0)[\s().-]*(?:3|5|7|8|9)(?:[\s().-]*\d){8}(?!\d)/g;
const SECRET_PATTERN = /\b(?:Bearer\s+)?(?:re_|sntrys_|sk_|pk_)[A-Za-z0-9._-]{8,}\b/gi;

function redactText(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[Filtered email]")
    .replace(PHONE_PATTERN, "[Filtered phone]")
    .replace(SECRET_PATTERN, "[Filtered secret]");
}

function stripQuery(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url, "https://sentry.invalid");
    return parsedUrl.origin === "https://sentry.invalid"
      ? parsedUrl.pathname
      : `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
}

export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent {
  delete event.user;
  delete event.extra;
  delete event.breadcrumbs;

  if (event.request) {
    event.request = {
      method: event.request.method,
      url: stripQuery(event.request.url),
    };
  }

  if (event.message) {
    event.message = redactText(event.message);
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) {
      exception.value = redactText(exception.value);
    }
  }

  return event;
}
