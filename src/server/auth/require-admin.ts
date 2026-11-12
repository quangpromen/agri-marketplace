import "server-only";

import { redirect } from "next/navigation";
import { ADMIN_LOGIN_PATH } from "@/schemas/auth";
import { getSession, type AuthenticatedAdminSession } from "./get-session";

export async function requireAdmin(
  requestHeaders?: Headers
): Promise<AuthenticatedAdminSession> {
  const session = await getSession(requestHeaders);

  if (!session) {
    return redirect(ADMIN_LOGIN_PATH) as never;
  }

  return session;
}

