import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await currentSession();
  return session ? NextResponse.json({ user: session.user }) : NextResponse.json({ user: null }, { status: 401 });
}
