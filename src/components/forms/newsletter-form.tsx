"use client";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Check, Send } from "lucide-react";
import {
  subscribeNewsletter,
  type NewsletterFormState,
} from "@/actions/subscribe-newsletter";
import { TurnstileField } from "@/components/forms/turnstile-field";

const initialNewsletterFormState: NewsletterFormState = { status: "idle" };

function NewsletterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={
        pending ? "Đang gửi đăng ký nhận tin" : "Gửi đăng ký nhận tin"
      }
      className="focus-ring absolute right-2 top-1.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-dark shadow-md transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:right-2 sm:top-2 sm:h-12 sm:w-12"
    >
      <Send className="h-5 w-5 text-dark" aria-hidden="true" />
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(
    subscribeNewsletter,
    initialNewsletterFormState
  );
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.status === "success") setShowSuccess(true);
  }, [state.status]);

  if (showSuccess) {
    return (
      <div
        className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border border-accent/40 bg-accent/20 p-4 text-sm font-semibold text-accent"
        role="status"
      >
        <Check className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span>
          Cảm ơn bạn! Mộc Farm sẽ gửi bản tin mùa vụ định kỳ đến bạn.
        </span>
      </div>
    );
  }

  const emailError = state.fieldErrors?.email?.[0];
  const turnstileError = state.fieldErrors?.turnstileToken?.[0];

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-xl"
      aria-label="Đăng ký nhận thông tin nông sản"
      noValidate
    >
      <div className="relative">
        <label htmlFor="newsletter-email" className="sr-only">
          Địa chỉ email nhận tin
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Nhập địa chỉ email của bạn..."
          autoComplete="email"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "newsletter-email-error" : undefined}
          className="h-14 w-full rounded-full border-0 bg-white pl-6 pr-20 text-sm text-dark shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-accent/40 sm:h-16 sm:text-base"
        />
        <NewsletterSubmitButton />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="newsletter-website">Website</label>
        <input
          id="newsletter-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div aria-live="polite">
        {emailError ? (
          <p id="newsletter-email-error" className="mt-2 text-sm text-red-200">
            {emailError}
          </p>
        ) : null}
        {state.status === "error" && state.message ? (
          <p className="mt-2 text-sm text-red-200" role="alert">
            {state.message}
          </p>
        ) : null}
      </div>

      <TurnstileField
        error={turnstileError}
        resetSignal={
          state.status === "validation_error" || state.status === "error"
            ? state
            : null
        }
        theme="dark"
        tone="dark"
        className="mt-4 flex flex-col items-center"
      />
    </form>
  );
}
