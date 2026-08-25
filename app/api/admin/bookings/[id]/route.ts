import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";
import { googleCalendarProvider } from "@/lib/calendar/google";
import { fromZonedTime } from "date-fns-tz";
import { rescheduleBooking } from "@/lib/booking/reschedule-booking";
import { sendBookingCancellation, sendBookingRescheduled } from "@/lib/email/send";
import { BookingStateConflictError, canTransitionBookingStatus } from "@/lib/booking/status";

const schema = z.union([
  z.object({ status: z.enum(["CANCELLED", "COMPLETED", "NO_SHOW"]) }),
  z.object({
    startsAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    staffId: z.string().cuid().optional(),
  }),
]);

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/bookings/[id]">) {
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN", "STAFF"]); const { id } = await params; const input = schema.parse(await request.json());
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    if (user.role === "STAFF" && user.staff?.id !== booking.staffId) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    if ("startsAtLocal" in input) {
      if (user.role === "STAFF" && input.staffId && input.staffId !== user.staff?.id) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
      await rescheduleBooking({
        bookingId: id,
        startsAt: fromZonedTime(input.startsAtLocal, "Europe/Zurich"),
        staffId: user.role === "ADMIN" ? input.staffId : user.staff?.id,
        changedById: user.id,
      });
      await Promise.allSettled([
        googleCalendarProvider.updateBookingEvent(id),
        sendBookingRescheduled(id),
      ]);
      return NextResponse.json({ ok: true });
    }
    const { status } = input;
    if (!canTransitionBookingStatus(booking.status, status)) {
      return NextResponse.json({ error: "Transition de statut refusée" }, { status: 409 });
    }
    await db.$transaction(async (tx) => {
      const changed = await tx.booking.updateMany({ where: { id, status: booking.status }, data: { status, cancelledAt: status === "CANCELLED" ? new Date() : undefined } });
      if (changed.count !== 1) throw new BookingStateConflictError();
      if (status === "CANCELLED") await tx.bookingSlot.deleteMany({ where: { bookingId: id } });
      await tx.bookingStatusHistory.create({ data: { bookingId: id, fromStatus: booking.status, toStatus: status, changedById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: `BOOKING_${status}`, entityType: "Booking", entityId: id } });
    });
    if (status === "CANCELLED") await Promise.allSettled([
      googleCalendarProvider.deleteBookingEvent(id),
      sendBookingCancellation(id),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
