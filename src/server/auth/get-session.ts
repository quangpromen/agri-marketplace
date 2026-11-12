import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type AuthenticatedAdminUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedSessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthenticatedAdminSession = {
  user: AuthenticatedAdminUser;
  session: AuthenticatedSessionRecord;
};

function isValidAuthenticatedSession(
  candidate: unknown
): candidate is AuthenticatedAdminSession {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const record = candidate as {
    user?: Partial<AuthenticatedAdminUser>;
    session?: Partial<AuthenticatedSessionRecord>;
  };

  const user = record.user;
  const session = record.session;

  if (!user || !session) {
    return false;
  }

  if (
    typeof user.id !== "string" ||
    user.id.trim().length === 0 ||
    typeof user.email !== "string" ||
    user.email.trim().length === 0 ||
    typeof user.name !== "string" ||
    user.name.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof session.id !== "string" ||
    session.id.trim().length === 0 ||
    typeof session.userId !== "string" ||
    session.userId !== user.id ||
    typeof session.token !== "string" ||
    session.token.trim().length === 0 ||
    !session.expiresAt
  ) {
    return false;
  }

  const expiresAtMs = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return false;
  }

  return true;
}

export async function getSession(
  requestHeaders?: Headers
): Promise<AuthenticatedAdminSession | null> {
  try {
    const resolvedHeaders = requestHeaders ?? new Headers(headers());
    const result = await auth.api.getSession({
      headers: resolvedHeaders,
      query: {
        disableCookieCache: true,
      },
    });

    if (!isValidAuthenticatedSession(result)) {
      return null;
    }

    return {
      user: {
        ...result.user,
        createdAt: new Date(result.user.createdAt),
        updatedAt: new Date(result.user.updatedAt),
      },
      session: {
        ...result.session,
        expiresAt: new Date(result.session.expiresAt),
        createdAt: new Date(result.session.createdAt),
        updatedAt: new Date(result.session.updatedAt),
      },
    };
  } catch {
    return null;
  }
}

