"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  ADMIN_LOGIN_PATH,
  adminLoginSchema,
  GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
  GENERIC_INVALID_CREDENTIALS_MESSAGE,
  sanitizeCallbackUrl,
} from "@/schemas/auth";

export type AdminLoginFieldName = "email" | "password" | "callbackURL";

export type AdminLoginFormState = {
  status: "idle" | "validation_error" | "error";
  message?: string;
  submittedEmail?: string;
  fieldErrors?: Partial<Record<AdminLoginFieldName, string[]>>;
};

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<Partial<Record<AdminLoginFieldName, string[]>>>(
    (errors, issue) => {
      const field = issue.path[0];

      if (
        field !== "email" &&
        field !== "password" &&
        field !== "callbackURL"
      ) {
        return errors;
      }

      errors[field] = [...(errors[field] ?? []), issue.message];
      return errors;
    },
    {}
  );
}

function isCredentialAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    status?: string | number;
    statusCode?: number;
    body?: { code?: string };
  };

  if (
    candidate.statusCode === 400 ||
    candidate.statusCode === 401 ||
    candidate.statusCode === 403 ||
    candidate.status === "UNAUTHORIZED" ||
    candidate.status === "BAD_REQUEST" ||
    candidate.status === "FORBIDDEN"
  ) {
    return true;
  }

  const code = candidate.body?.code;
  return (
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    code === "INVALID_EMAIL" ||
    code === "INVALID_PASSWORD" ||
    code === "EMAIL_NOT_VERIFIED"
  );
}

export async function loginAdmin(
  _previousState: AdminLoginFormState,
  formData: FormData
): Promise<AdminLoginFormState> {
  const rawEmail = getFormValue(formData, "email");
  const rawPassword = getFormValue(formData, "password");
  const rawCallbackUrl = getFormValue(formData, "callbackURL");
  const safeCallbackUrl = sanitizeCallbackUrl(rawCallbackUrl);
  const normalizedEmailPreview = rawEmail.trim().toLowerCase();

  const parsed = adminLoginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    callbackURL: safeCallbackUrl,
  });

  if (!parsed.success) {
    return {
      status: "validation_error",
      message: "Vui lòng kiểm tra lại thông tin đăng nhập.",
      submittedEmail: normalizedEmailPreview,
      fieldErrors: getFieldErrors(parsed.error.issues),
    };
  }

  let isAuthenticated = false;

  try {
    const response = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: new Headers(headers()),
    });

    if (response && response.user) {
      isAuthenticated = true;
    }
  } catch (error) {
    if (isCredentialAuthFailure(error)) {
      return {
        status: "error",
        message: GENERIC_INVALID_CREDENTIALS_MESSAGE,
        submittedEmail: parsed.data.email,
      };
    }

    return {
      status: "error",
      message: GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
      submittedEmail: parsed.data.email,
    };
  }

  if (!isAuthenticated) {
    return {
      status: "error",
      message: GENERIC_INVALID_CREDENTIALS_MESSAGE,
      submittedEmail: parsed.data.email,
    };
  }

  return redirect(sanitizeCallbackUrl(parsed.data.callbackURL)) as never;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await auth.api.signOut({
      headers: new Headers(headers()),
    });
  } catch {
    // Luôn chuyển hướng về trang đăng nhập kể cả khi session đã hết hạn trước đó.
  }

  return redirect(ADMIN_LOGIN_PATH) as never;
}

