"use client";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletter, type NewsletterFormState } from "@/actions/subscribe-newsletter";
import { Button } from "@/components/ui/button";

const initialNewsletterFormState: NewsletterFormState = { status: "idle" };

function FooterNewsletterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      disabled={pending}
      className="min-h-[38px] w-full gap-1.5 text-xs font-semibold"
    >
      <span>{pending ? "Đang đăng ký..." : "Đăng ký ngay"}</span>
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
}

export function FooterNewsletterForm() {
  const [state, formAction] = useFormState(subscribeNewsletter, initialNewsletterFormState);
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.status === "success") setShowSuccess(true);
  }, [state.status]);

  if (showSuccess) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-white/10 p-3 text-xs text-cream"
        role="status"
      >
        <Check className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
        <span>Cảm ơn bạn đã đăng ký nhận tin!</span>
      </div>
    );
  }

  const emailError = state.fieldErrors?.email?.[0];

  return (
    <form
      action={formAction}
      className="space-y-2"
      aria-label="Đăng ký nhận bản tin ở chân trang"
      noValidate
    >
      <div>
        <label htmlFor="footer-email-input" className="sr-only">
          Địa chỉ email
        </label>
        <input
          id="footer-email-input"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Nhập email của bạn..."
          autoComplete="email"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "footer-email-error" : undefined}
          className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-cream/50 focus:outline-none focus:ring-2 focus:ring-secondary"
        />
        {emailError ? (
          <p id="footer-email-error" className="mt-1 text-xs text-red-200">
            {emailError}
          </p>
        ) : null}
      </div>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="footer-newsletter-website">Website</label>
        <input
          id="footer-newsletter-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <FooterNewsletterSubmitButton />
      <div aria-live="polite">
        {state.status === "error" && state.message ? (
          <p className="text-xs text-red-200" role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
