import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { verifyGoogleState } from "@/lib/calendar/oauth-state";
import { exchangeGoogleCode } from "@/lib/calendar/google";
import { apiError } from "@/lib/http/response";

export async function GET(request: Request) {
  try { const session = await currentSession(); if (!session) return NextResponse.redirect(new URL("/admin/login", request.url)); const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state"); if (!code || !state) return NextResponse.json({ error: "Réponse OAuth incomplète" }, { status: 400 }); const verified = await verifyGoogleState(state); if (verified.userId !== session.user.id) return NextResponse.json({ error: "État OAuth refusé" }, { status: 403 }); await exchangeGoogleCode(verified.staffId, code); return NextResponse.redirect(new URL("/admin/equipe?google=connected", request.url)); }
  catch (error) { return apiError(error); }
}
