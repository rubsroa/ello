import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  try { assertSameOrigin(request); await deleteSession(); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
