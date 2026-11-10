"use server";

import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSubscriptionSchema } from "@/schemas/newsletter";
import { sendNewsletterConfirmationEmail } from "@/server/email";
import { captureOperationalError } from "@/server/observability/capture-error";
import { checkFormRateLimit } from "@/server/security/rate-limit";
import { TURNSTILE_TOKEN_FIELD, verifyTurnstileToken } from "@/server/security/verify-turnstile";

type NewsletterFieldName = "email" | "website" | "turnstileToken";

export type NewsletterFormState = {
  status: "idle" | "success" | "validation_error" | "rate_limited" | "error";
  message?: string;
  fieldErrors?: Partial<Record<NewsletterFieldName, string[]>>;
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<Partial<Record<NewsletterFieldName, string[]>>>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field !== "string") {
      return errors;
    }

    const typedField = field as NewsletterFieldName;
    errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    return errors;
  }, {});
}

export async function subscribeNewsletter(
  _previousState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const website = getFormValue(formData, "website");

  if (website.trim().length > 0) {
    return {
      status: "validation_error",
      message: "Yêu cầu không hợp lệ.",
      fieldErrors: {
        website: ["Yêu cầu không hợp lệ."],
      },
    };
  }

  const rateLimit = await checkFormRateLimit("newsletter");

  if (!rateLimit.success) {
    return {
      status: "rate_limited",
      message: rateLimit.message,
    };
  }

  const turnstileToken = getFormValue(formData, TURNSTILE_TOKEN_FIELD);
  const turnstileVerification = await verifyTurnstileToken(turnstileToken);

  if (!turnstileVerification.success) {
    return {
      status: "validation_error",
      message: turnstileVerification.message,
      fieldErrors: {
        turnstileToken: [turnstileVerification.message],
      },
    };
  }

  const result = newsletterSubscriptionSchema.safeParse({
    email: getFormValue(formData, "email"),
    website,
  });

  if (!result.success) {
    return {
      status: "validation_error",
      fieldErrors: getFieldErrors(result.error.issues),
    };
  }

  try {
    const now = new Date();

    await db
      .insert(newsletterSubscribers)
      .values({
        email: result.data.email,
        status: "active",
        subscribedAt: now,
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          status: "active",
          subscribedAt: now,
          unsubscribedAt: null,
          updatedAt: now,
        },
      });
  } catch (error) {
    captureOperationalError(error, {
      service: "neon",
      operation: "upsert_newsletter_subscription",
      form: "newsletter",
    });
    console.error("Unable to save newsletter subscription", error);

    return {
      status: "error",
      message: "Không thể đăng ký nhận tin lúc này. Vui lòng thử lại sau ít phút.",
    };
  }

  try {
    await sendNewsletterConfirmationEmail(result.data.email);
  } catch (emailError) {
    captureOperationalError(emailError, {
      service: "resend",
      operation: "send_newsletter_confirmation",
      form: "newsletter",
    });
    console.error(
      "Unable to send newsletter confirmation email:",
      emailError instanceof Error ? emailError.message : "Unknown email error"
    );
  }

  return {
    status: "success",
  };
}
