import * as Sentry from "@sentry/nextjs";

type MonitoredService = "neon" | "resend" | "turnstile" | "upstash";

type CaptureOperationalErrorOptions = {
  service: MonitoredService;
  operation: string;
  form?: "contact" | "newsletter";
};

export function captureOperationalError(
  error: unknown,
  { service, operation, form }: CaptureOperationalErrorOptions
): void {
  Sentry.withScope((scope) => {
    scope.setTag("service", service);
    scope.setTag("operation", operation);

    if (form) {
      scope.setTag("form", form);
    }

    scope.setLevel(service === "upstash" ? "warning" : "error");
    Sentry.captureException(
      error instanceof Error ? error : new Error("Unknown operational error")
    );
  });
}
