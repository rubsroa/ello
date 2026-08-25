import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { googleAuthorizationUrl } from "@/lib/calendar/google";
import { createGoogleState } from "@/lib/calendar/oauth-state";
import { apiError } from "@/lib/http/response";

export async function GET(request: Request) {
  try { const user = await requireUser(["ADMIN", "STAFF"]); const staffId = new URL(request.url).searchParams.get("staffId"); if (!staffId) return NextResponse.json({ error: "staffId requis" }, { status: 400 }); if (user.role === "STAFF" && user.staff?.id !== staffId) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 }); return NextResponse.redirect(googleAuthorizationUrl(await createGoogleState(staffId, user.id))); }
  catch (error) { return apiError(error); }
}
