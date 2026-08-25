import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { BookingConflictError, BookingUnavailableError } from "@/lib/booking/create-booking";
import { RateLimitError, RequestOriginError } from "@/lib/security/request";
import { AuthenticationError, AuthorizationError } from "@/lib/auth/authorization";
import { BookingStateConflictError } from "@/lib/booking/status";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Données invalides", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });
  if (error instanceof BookingConflictError) return NextResponse.json({ error: "Ce créneau vient d’être réservé. Choisissez-en un autre." }, { status: 409 });
  if (error instanceof BookingStateConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof BookingUnavailableError) return NextResponse.json({ error: error.message }, { status: 422 });
  if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: 429, headers: { "Retry-After": Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000)).toString() } });
  if (error instanceof RequestOriginError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof AuthenticationError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Conflit de données" }, { status: 409 });
  console.error("API error", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error });
  return NextResponse.json({ error: "Une erreur interne est survenue" }, { status: 500 });
}
