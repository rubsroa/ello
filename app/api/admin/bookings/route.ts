import { NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/booking/validation";
import { createBooking } from "@/lib/booking/create-booking";
import { runConfirmationIntegrations } from "@/lib/booking/confirm-booking";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "STAFF"]);
    const parsed = createBookingSchema.parse(await request.json());
    const input = user.role === "STAFF"
      ? { ...parsed, staffId: user.staff?.id ?? null }
      : parsed;
    if (user.role === "STAFF" && !user.staff) {
      return NextResponse.json({ error: "Aucun profil coiffeur associé" }, { status: 403 });
    }
    const booking = await createBooking(input, {
      source: user.role === "ADMIN" ? "ADMIN" : "STAFF",
      administrative: true,
    });
    await db.auditLog.create({
      data: { userId: user.id, action: "BOOKING_CREATED", entityType: "Booking", entityId: booking.id },
    });
    if (booking.status === "CONFIRMED") await runConfirmationIntegrations(booking.id);
    return NextResponse.json({ reference: booking.reference, status: booking.status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
