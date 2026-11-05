"use server";

import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSubscriptionSchema } from "@/schemas/newsletter";

type NewsletterFieldName = "email" | "website";

export type NewsletterFormState = {
  status: "idle" | "success" | "validation_error" | "error";
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
  const result = newsletterSubscriptionSchema.safeParse({
    email: getFormValue(formData, "email"),
    website: getFormValue(formData, "website"),
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

    return {
      status: "success",
    };
  } catch (error) {
    console.error("Unable to save newsletter subscription", error);

    return {
      status: "error",
      message: "Không thể đăng ký nhận tin lúc này. Vui lòng thử lại sau ít phút.",
    };
  }
}
