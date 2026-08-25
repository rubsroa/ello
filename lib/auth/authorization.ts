import "server-only";
import type { UserRole } from "@prisma/client";
import { currentSession } from "@/lib/auth/session";

export class AuthenticationError extends Error {}
export class AuthorizationError extends Error {}

export async function requireUser(roles?: readonly UserRole[]) {
  const session = await currentSession();
  if (!session) throw new AuthenticationError("Authentification requise");
  if (roles && !roles.includes(session.user.role)) throw new AuthorizationError("Droits insuffisants");
  return session.user;
}
