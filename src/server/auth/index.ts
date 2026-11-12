import "server-only";

export { auth, createAuthOptions, getAuth, resolveAuthEnv, type AuthEnvConfig } from "@/lib/auth";
export {
  getSession,
  type AuthenticatedAdminSession,
  type AuthenticatedAdminUser,
  type AuthenticatedSessionRecord,
} from "./get-session";
export { requireAdmin } from "./require-admin";

