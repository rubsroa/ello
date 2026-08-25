import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin, clientAddress, enforceRateLimit, hashIdentifier } from "@/lib/security/request";

const schema = z.object({ name: z.string().trim().min(2).max(150), email: z.email().max(191).transform((value) => value.toLowerCase()), phone: z.string().trim().max(32).optional(), message: z.string().trim().min(10).max(3000) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`contact:${hashIdentifier(clientAddress(request))}`, 5, 60 * 60_000);
    const input = schema.parse(await request.json());
    await db.contactRequest.create({ data: { ...input, phone: input.phone || null } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return apiError(error); }
}
