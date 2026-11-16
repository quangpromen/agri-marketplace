"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESULTS,
  ADMIN_AUDIT_TARGET_TYPES,
} from "@/schemas/admin-audit";
import {
  ADMIN_LOGIN_PATH,
  adminLoginSchema,
  GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
  GENERIC_INVALID_CREDENTIALS_MESSAGE,
  sanitizeCallbackUrl,
} from "@/schemas/auth";
import { writeBestEffortAdminAuditLog } from "@/server/admin/audit-log";
import { getSession } from "@/server/auth/get-session";

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

  let authenticatedUser: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null = null;

  try {
    const response = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: new Headers(headers()),
    });

    if (response && response.user && typeof response.user.id === "string") {
      authenticatedUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
      };
    }
  } catch (error) {
    if (isCredentialAuthFailure(error)) {
      await writeBestEffortAdminAuditLog(
        {
          action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
          result: ADMIN_AUDIT_RESULTS.FAILURE,
          targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
          targetId: null,
          actorUserId: null,
          actorNameSnapshot: null,
          actorEmailSnapshot: parsed.data.email,
          changes: null,
          metadata: {
            reason: "invalid_credentials",
          },
        },
        "audit_admin_login_failed"
      );

      return {
        status: "error",
        message: GENERIC_INVALID_CREDENTIALS_MESSAGE,
        submittedEmail: parsed.data.email,
      };
    }

    await writeBestEffortAdminAuditLog(
      {
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        targetId: null,
        actorUserId: null,
        actorNameSnapshot: null,
        actorEmailSnapshot: parsed.data.email,
        changes: null,
        metadata: {
          reason: "auth_service_error",
        },
      },
      "audit_admin_login_failed"
    );

    return {
      status: "error",
      message: GENERIC_AUTH_SERVICE_ERROR_MESSAGE,
      submittedEmail: parsed.data.email,
    };
  }

  if (!authenticatedUser) {
    await writeBestEffortAdminAuditLog(
      {
        action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        result: ADMIN_AUDIT_RESULTS.FAILURE,
        targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
        targetId: null,
        actorUserId: null,
        actorNameSnapshot: null,
        actorEmailSnapshot: parsed.data.email,
        changes: null,
        metadata: {
          reason: "invalid_credentials",
        },
      },
      "audit_admin_login_failed"
    );

    return {
      status: "error",
      message: GENERIC_INVALID_CREDENTIALS_MESSAGE,
      submittedEmail: parsed.data.email,
    };
  }

  await writeBestEffortAdminAuditLog(
    {
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGIN_SUCCEEDED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      targetId: null,
      actorUserId: authenticatedUser.id,
      actorNameSnapshot: authenticatedUser.name ?? null,
      actorEmailSnapshot: authenticatedUser.email ?? parsed.data.email,
      changes: null,
      metadata: null,
    },
    "audit_admin_login_succeeded"
  );

  return redirect(sanitizeCallbackUrl(parsed.data.callbackURL)) as never;
}

export async function logoutAdmin(): Promise<void> {
  const requestHeaders = new Headers(headers());
  const existingSession = await getSession(requestHeaders);

  try {
    await auth.api.signOut({
      headers: requestHeaders,
    });
  } catch {
    // Luôn chuyển hướng về trang đăng nhập kể cả khi session đã hết hạn trước đó.
  }

  await writeBestEffortAdminAuditLog(
    {
      action: ADMIN_AUDIT_ACTIONS.AUTH_LOGOUT_SUCCEEDED,
      result: ADMIN_AUDIT_RESULTS.SUCCESS,
      targetType: ADMIN_AUDIT_TARGET_TYPES.ADMIN_SESSION,
      targetId: null,
      actorUserId: existingSession?.user.id ?? null,
      actorNameSnapshot: existingSession?.user.name ?? null,
      actorEmailSnapshot: existingSession?.user.email ?? null,
      changes: null,
      metadata: null,
    },
    "audit_admin_logout_succeeded"
  );

  return redirect(ADMIN_LOGIN_PATH) as never;
}

