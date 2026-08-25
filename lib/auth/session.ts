import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const SESSION_DAYS = 7;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, context?: { userAgent?: string; ipHash?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.refreshToken.create({ data: { userId, tokenHash: tokenHash(token), expiresAt, userAgent: context?.userAgent?.slice(0, 255), ipHash: context?.ipHash } });
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
    priority: "high",
  });
}

export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.refreshToken.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true, staff: { select: { id: true } } } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) return null;
  return { sessionId: session.id, expiresAt: session.expiresAt, user: session.user };
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) await db.refreshToken.updateMany({ where: { tokenHash: tokenHash(token), revokedAt: null }, data: { revokedAt: new Date() } });
  store.delete(SESSION_COOKIE_NAME);
}
