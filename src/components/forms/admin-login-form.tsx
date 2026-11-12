"use client";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Lock, LogIn } from "lucide-react";
import {
  loginAdmin,
  type AdminLoginFormState,
} from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import {
  ADMIN_DASHBOARD_PATH,
  sanitizeCallbackUrl,
} from "@/schemas/auth";

const initialLoginFormState: AdminLoginFormState = {
  status: "idle",
};

interface AdminLoginFormProps {
  callbackUrl?: string;
}

function AdminLoginFormFields({
  safeCallbackUrl,
  state,
}: {
  safeCallbackUrl: string;
  state: AdminLoginFormState;
}) {
  const { pending } = useFormStatus();
  const [email, setEmail] = useState(state.submittedEmail ?? "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof state.submittedEmail === "string") {
      setEmail(state.submittedEmail);
    }
    if (state.status === "error" || state.status === "validation_error") {
      setPassword("");
    }
  }, [state]);

  const fieldErrors = state.fieldErrors ?? {};
  const emailError = fieldErrors.email?.[0];
  const passwordError = fieldErrors.password?.[0];
  const hasGeneralError =
    (state.status === "error" || state.status === "validation_error") &&
    Boolean(state.message);

  const emailDescribedBy =
    [
      emailError ? "admin-login-email-error" : null,
      state.status === "error" && hasGeneralError ? "admin-login-form-error" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const passwordDescribedBy =
    [
      passwordError ? "admin-login-password-error" : null,
      state.status === "error" && hasGeneralError ? "admin-login-form-error" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <>
      <input type="hidden" name="callbackURL" value={safeCallbackUrl} />

      <div aria-live="polite" aria-atomic="true">
        {hasGeneralError ? (
          <div
            id="admin-login-form-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-login-email"
          className="block text-xs font-semibold text-foreground"
        >
          Địa chỉ email <span className="text-destructive">*</span>
        </label>
        <input
          id="admin-login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@mocfarm.vn"
          aria-invalid={Boolean(emailError) || state.status === "error"}
          aria-describedby={emailDescribedBy}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        {emailError ? (
          <p id="admin-login-email-error" className="text-xs text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-login-password"
          className="block text-xs font-semibold text-foreground"
        >
          Mật khẩu <span className="text-destructive">*</span>
        </label>
        <input
          id="admin-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu quản trị"
          aria-invalid={Boolean(passwordError) || state.status === "error"}
          aria-describedby={passwordDescribedBy}
          className="focus-ring h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        />
        {passwordError ? (
          <p id="admin-login-password-error" className="text-xs text-destructive">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={pending}
          className="w-full gap-2 font-bold"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span>{pending ? "Đang xác thực..." : "Đăng nhập quản trị"}</span>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>Khu vực nội bộ dành riêng cho quản trị viên Mộc Farm.</span>
      </div>
    </>
  );
}

export function AdminLoginForm({
  callbackUrl = ADMIN_DASHBOARD_PATH,
}: AdminLoginFormProps) {
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
  const [state, formAction] = useFormState(loginAdmin, initialLoginFormState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      aria-label="Biểu mẫu đăng nhập quản trị Mộc Farm"
      method="post"
      noValidate
    >
      <AdminLoginFormFields safeCallbackUrl={safeCallbackUrl} state={state} />
    </form>
  );
}

