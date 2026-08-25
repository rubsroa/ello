import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin, clientAddress, enforceRateLimit, hashIdentifier } from "@/lib/security/request";

const schema = z.object({ email: z.email().max(191).transform((value) => value.toLowerCase()), password: z.string().min(8).max(200) });
const DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYhBbPzVtvwg9rZMFZbV0QfSgIN5WJle";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = clientAddress(request);
    enforceRateLimit(`login:${hashIdentifier(ip)}`, 5, 15 * 60_000);
    const input = schema.parse(await request.json());
    enforceRateLimit(`login-account:${hashIdentifier(input.email)}`, 10, 30 * 60_000);
    const user = await db.user.findUnique({ where: { email: input.email } });
    const valid = await compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.active) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    await db.refreshToken.updateMany({ where: { userId: user.id, expiresAt: { lt: new Date() }, revokedAt: null }, data: { revokedAt: new Date() } });
    await createSession(user.id, { userAgent: request.headers.get("user-agent") ?? undefined, ipHash: hashIdentifier(ip) });
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await db.auditLog.create({ data: { userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, ipHash: hashIdentifier(ip) } });
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) { return apiError(error); }
}
