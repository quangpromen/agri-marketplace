import { NextResponse } from "next/server";
import { adminUserIdSchema } from "@/schemas/admin-notifications";
import { getAdminNotificationSummary } from "@/server/admin/notifications";
import { type AuthenticatedAdminSession } from "@/server/auth/get-session";
import { requireAdmin } from "@/server/auth/require-admin";
import { captureOperationalError } from "@/server/observability/capture-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie",
} as const;

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { digest?: unknown; message?: unknown };
  if (
    typeof candidate.digest === "string" &&
    candidate.digest.startsWith("NEXT_REDIRECT")
  ) {
    return true;
  }

  return (
    error instanceof Error &&
    typeof candidate.message === "string" &&
    candidate.message.startsWith("NEXT_REDIRECT")
  );
}

export async function GET(request: Request): Promise<Response> {
  let session: AuthenticatedAdminSession;

  try {
    session = await requireAdmin(request.headers);
  } catch (error) {
    if (isNextRedirectError(error)) {
      return NextResponse.json(
        { error: "Chưa xác thực." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    captureOperationalError(error, {
      service: "neon",
      operation: "require_admin_for_notifications",
    });

    return NextResponse.json(
      { error: "Không thể xác thực phiên quản trị lúc này." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  const parsedAdminId = adminUserIdSchema.safeParse(session.user.id);
  if (!parsedAdminId.success) {
    return NextResponse.json(
      { error: "Chưa xác thực." },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const summary = await getAdminNotificationSummary(parsedAdminId.data);
    return NextResponse.json(summary, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    captureOperationalError(error, {
      service: "neon",
      operation: "get_admin_notification_summary",
    });

    return NextResponse.json(
      { error: "Không thể tải thông báo lúc này." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

