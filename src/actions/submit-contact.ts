"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contactSubmissions } from "@/db/schema";
import { contactSubmissionSchema } from "@/schemas/contact";
import { sendContactEmails } from "@/server/email";

type ContactFieldName = "name" | "phone" | "email" | "service" | "message" | "website";

export type ContactFormState = {
  status: "idle" | "success" | "validation_error" | "error";
  message?: string;
  submittedName?: string;
  fieldErrors?: Partial<Record<ContactFieldName, string[]>>;
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<Partial<Record<ContactFieldName, string[]>>>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field !== "string") {
      return errors;
    }

    const typedField = field as ContactFieldName;
    errors[typedField] = [...(errors[typedField] ?? []), issue.message];
    return errors;
  }, {});
}

export async function submitContact(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const result = contactSubmissionSchema.safeParse({
    name: getFormValue(formData, "name"),
    phone: getFormValue(formData, "phone"),
    email: getFormValue(formData, "email"),
    service: getFormValue(formData, "service"),
    message: getFormValue(formData, "message"),
    website: getFormValue(formData, "website"),
  });

  if (!result.success) {
    return {
      status: "validation_error",
      message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
      fieldErrors: getFieldErrors(result.error.issues),
    };
  }

  let submissionId: string;

  try {
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email,
        service: result.data.service,
        message: result.data.message,
      })
      .returning({ id: contactSubmissions.id });

    submissionId = submission.id;
  } catch (error) {
    console.error("Unable to save contact submission", error);

    return {
      status: "error",
      message: "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau ít phút.",
    };
  }

  let nextEmailStatus: "sent" | "failed" = "sent";

  try {
    await sendContactEmails({
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      service: result.data.service,
      message: result.data.message,
    });
  } catch (emailError) {
    nextEmailStatus = "failed";
    console.error(
      "Unable to send contact submission emails:",
      emailError instanceof Error ? emailError.message : "Unknown email error"
    );
  }

  try {
    await db
      .update(contactSubmissions)
      .set({
        emailStatus: nextEmailStatus,
        updatedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, submissionId));
  } catch (statusError) {
    console.error(
      "Unable to update contact submission email status:",
      statusError instanceof Error ? statusError.message : "Unknown database error"
    );
  }

  return {
    status: "success",
    submittedName: result.data.name,
  };
}
