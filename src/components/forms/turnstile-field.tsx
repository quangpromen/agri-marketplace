"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type TurnstileStatus = "loading" | "ready" | "verified" | "expired" | "error";

type TurnstileFieldProps = {
  error?: string;
  resetSignal?: unknown;
  size?: "normal" | "compact" | "flexible";
  theme?: "light" | "dark" | "auto";
  tone?: "light" | "dark";
  className?: string;
};

export function TurnstileField({
  error,
  resetSignal,
  size = "normal",
  theme = "light",
  tone = "light",
  className = "",
}: TurnstileFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const isFirstRender = useRef(true);
  const statusId = useId();
  const errorId = useId();

  const [token, setToken] = useState("");
  const [status, setStatus] = useState<TurnstileStatus>("loading");
  const [clientError, setClientError] = useState<string | null>(null);
  const [dismissedServerError, setDismissedServerError] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!resetSignal) {
      return;
    }

    setToken("");
    setClientError(null);
    setDismissedServerError(false);
    setStatus("ready");
    turnstileRef.current?.reset();
  }, [resetSignal]);

  const handleRetry = () => {
    setToken("");
    setClientError(null);
    setDismissedServerError(false);
    setStatus("loading");
    turnstileRef.current?.reset();
  };

  const helperTextClass =
    tone === "dark" ? "text-xs text-cream/80" : "text-xs text-muted-foreground";
  const errorTextClass =
    tone === "dark" ? "text-xs text-red-200" : "text-xs text-destructive";
  const retryButtonClass =
    tone === "dark"
      ? "mt-1 inline-flex text-xs font-semibold text-accent underline hover:text-white"
      : "mt-1 inline-flex text-xs font-semibold text-primary underline hover:text-primary/80";

  if (!siteKey) {
    return (
      <div
        role="group"
        aria-label="Xác minh bảo mật"
        className={`space-y-1 ${className}`}
      >
        <input type="hidden" name="turnstileToken" value="" readOnly />
        <p className={errorTextClass} role="alert">
          Chưa cấu hình khóa xác minh bảo mật Turnstile.
        </p>
      </div>
    );
  }

  const activeServerError = dismissedServerError ? undefined : error;
  const displayedError = activeServerError || clientError;

  return (
    <div
      role="group"
      aria-label="Xác minh bảo mật Cloudflare Turnstile"
      aria-busy={status === "loading"}
      aria-describedby={displayedError ? errorId : statusId}
      className={`space-y-1.5 ${className}`}
    >
      <input type="hidden" name="turnstileToken" value={token} readOnly />

      <div className="min-h-[65px]">
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          options={{
            theme,
            size,
            language: "vi",
            responseField: false,
          }}
          onWidgetLoad={() => {
            setStatus((current) =>
              current === "verified" ? current : "ready"
            );
          }}
          onSuccess={(verifiedToken) => {
            setToken(verifiedToken);
            setClientError(null);
            setDismissedServerError(true);
            setStatus("verified");
          }}
          onExpire={() => {
            setToken("");
            setStatus("expired");
            setClientError(
              "Phiên xác minh bảo mật đã hết hạn. Vui lòng xác minh lại."
            );
          }}
          onError={() => {
            setToken("");
            setStatus("error");
            setClientError(
              "Không thể tải hộp kiểm bảo mật. Vui lòng nhấn thử lại."
            );
          }}
        />
      </div>

      <div id={statusId} aria-live="polite">
        {status === "loading" ? (
          <p className={helperTextClass}>
            Đang tải hộp kiểm xác minh bảo mật...
          </p>
        ) : null}
      </div>

      {displayedError ? (
        <div id={errorId} aria-live="polite">
          <p className={errorTextClass} role="alert">
            {displayedError}
          </p>
          {status === "error" || status === "expired" ? (
            <button
              type="button"
              onClick={handleRetry}
              className={retryButtonClass}
            >
              Thử lại xác minh bảo mật
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
