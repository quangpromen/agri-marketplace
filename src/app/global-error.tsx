"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Đã xảy ra lỗi</h1>
            <p className="text-sm text-muted-foreground">
              Hệ thống đã ghi nhận sự cố. Vui lòng thử tải lại nội dung.
            </p>
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
