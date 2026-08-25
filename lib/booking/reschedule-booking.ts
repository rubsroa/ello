import "server-only";

import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { createOccupancySlots } from "@/lib/booking/engine";
import { getAvailableSlots } from "@/lib/booking/availability-service";
import { BookingConflictError, BookingUnavailableError } from "@/lib/booking/create-booking";

const TIME_ZONE = "Europe/Zurich";

/**
 * Moves an existing booking while preserving its quoted price and payment.
 * The old occupancy slots and the new ones are exchanged atomically, so a
 * concurrent writer either wins completely or leaves the original booking
 * untouched.
 */
export async function rescheduleBooking(input: {
  bookingId: string;
  startsAt: Date;
  staffId?: string;
  changedById: string;
}) {
  const booking = await db.booking.findUnique({
    where: { id: input.bookingId },
    include: { service: true },
  });
  if (!booking) throw new BookingUnavailableError("Rendez-vous introuvable");
  if (["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"].includes(booking.status)) {
    throw new BookingUnavailableError("Ce rendez-vous ne peut plus être déplacé");
  }

  const staffId = input.staffId ?? booking.staffId;
  const date = formatInTimeZone(input.startsAt, TIME_ZONE, "yyyy-MM-dd");
  const available = await getAvailableSlots({
    date,
    serviceId: booking.serviceId,
    staffId,
    administrative: true,
    excludeBookingId: booking.id,
  });
  const chosen = available.find(
    (slot) => slot.staffId === staffId && slot.startsAt === input.startsAt.toISOString(),
  );
  if (!chosen) throw new BookingUnavailableError("Le nouveau créneau n’est pas disponible");

  const assignment = await db.staffService.findUnique({
    where: { staffId_serviceId: { staffId, serviceId: booking.serviceId } },
  });
  if (!assignment) throw new BookingUnavailableError("Cette prestation n’est pas proposée par ce coiffeur");

  const duration = assignment.customDuration ?? booking.service.durationMinutes;
  const endsAt = addMinutes(input.startsAt, duration);
  const occupiedUntil = addMinutes(endsAt, booking.service.bufferAfterMinutes);

  try {
    return await db.$transaction(async (tx) => {
      await tx.bookingSlot.deleteMany({ where: { bookingId: booking.id } });
      await tx.bookingSlot.createMany({
        data: createOccupancySlots(input.startsAt, occupiedUntil).map((startsAt) => ({
          bookingId: booking.id,
          staffId,
          startsAt,
        })),
      });
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          staffId,
          startsAt: input.startsAt,
          endsAt,
          statusHistory: {
            create: {
              fromStatus: booking.status,
              toStatus: booking.status,
              changedById: input.changedById,
              reason: `Déplacé du ${booking.startsAt.toISOString()} au ${input.startsAt.toISOString()}`,
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: input.changedById,
          action: "BOOKING_RESCHEDULED",
          entityType: "Booking",
          entityId: booking.id,
          metadata: { previousStartsAt: booking.startsAt.toISOString(), startsAt: input.startsAt.toISOString(), staffId },
        },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
      throw new BookingConflictError("Le nouveau créneau vient d’être réservé");
    }
    throw error;
  }
}
