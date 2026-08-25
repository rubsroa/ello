import "server-only";
import { randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma, type Booking, type BookingSource } from "@prisma/client";
import { db } from "@/lib/db/client";
import { calculateDepositCents, createOccupancySlots } from "@/lib/booking/engine";
import { getAvailableSlots } from "@/lib/booking/availability-service";
import type { CreateBookingInput } from "@/lib/booking/validation";
import { getBookingPolicy } from "@/lib/booking/policy";

const TIME_ZONE = "Europe/Zurich";

export class BookingConflictError extends Error {}
export class BookingUnavailableError extends Error {}

function reference() {
  return `ELLO-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createBooking(
  input: CreateBookingInput,
  options: { source?: BookingSource; administrative?: boolean } = {},
): Promise<Booking> {
  const existing = await db.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  const startsAt = new Date(input.startsAt);
  const policy = await getBookingPolicy();
  const date = formatInTimeZone(startsAt, TIME_ZONE, "yyyy-MM-dd");
  const available = await getAvailableSlots({
    date,
    serviceId: input.serviceId,
    staffId: input.staffId ?? undefined,
    administrative: options.administrative,
  });
  const chosen = available.find((slot) => slot.startsAt === startsAt.toISOString() && (!input.staffId || slot.staffId === input.staffId));
  if (!chosen) throw new BookingUnavailableError("Le créneau sélectionné n’est plus disponible");

  try {
    return await db.$transaction(async (tx) => {
      const idempotent = await tx.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (idempotent) return idempotent;

      const expired = await tx.booking.findMany({ where: { status: "PENDING_PAYMENT", expiresAt: { lte: new Date() } }, select: { id: true } });
      if (expired.length) {
        const ids = expired.map((booking) => booking.id);
        await tx.bookingSlot.deleteMany({ where: { bookingId: { in: ids } } });
        await tx.booking.updateMany({ where: { id: { in: ids } }, data: { status: "EXPIRED" } });
      }

      const service = await tx.service.findFirst({
        where: { id: input.serviceId, active: true, ...(options.administrative ? {} : { onlineBookable: true }) },
        include: { staff: { where: { staffId: chosen.staffId } } },
      });
      if (!service || !service.staff[0]) throw new BookingUnavailableError("Cette prestation n’est pas proposée par ce coiffeur");
      const staff = await tx.staff.findFirst({
        where: { id: chosen.staffId, active: true, ...(options.administrative ? {} : { acceptsOnlineBooking: true }) },
      });
      if (!staff) throw new BookingUnavailableError("Ce coiffeur n’est pas disponible en ligne");

      const duration = service.staff[0].customDuration ?? service.durationMinutes;
      const priceCents = service.staff[0].customPrice ?? service.priceCents;
      const endsAt = addMinutes(startsAt, duration);
      const occupiedUntil = addMinutes(endsAt, service.bufferAfterMinutes);
      const depositCents = policy.paymentsEnabled ? calculateDepositCents(priceCents, { mode: service.depositMode, value: service.depositValue }) : 0;
      const status = depositCents > 0 ? "PENDING_PAYMENT" : "CONFIRMED";
      // Stripe requires Checkout Sessions to live for at least 30 minutes.
      // One extra minute keeps the database hold authoritative despite the
      // short delay between the DB transaction and Checkout creation.
      const holdMinutes = Math.max(31, Number(process.env.BOOKING_HOLD_MINUTES ?? 31));

      // An email address alone is not proof that the caller owns an existing
      // customer record. Reuse only an exact contact pair and never mutate the
      // stored identity or consent from this unauthenticated flow.
      let customer = await tx.customer.findFirst({ where: { email: input.customer.email, phone: input.customer.phone, anonymizedAt: null } });
      customer ??= await tx.customer.create({ data: { ...input.customer, consentedAt: input.customer.marketingConsent ? new Date() : null } });

      return tx.booking.create({
        data: {
          reference: reference(),
          idempotencyKey: input.idempotencyKey,
          customerId: customer.id,
          staffId: staff.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          status,
          source: options.source ?? "ONLINE",
          priceCents,
          depositCents,
          balanceCents: priceCents - depositCents,
          clientNotes: input.notes,
          expiresAt: depositCents > 0 ? addMinutes(new Date(), holdMinutes) : null,
          slots: { createMany: { data: createOccupancySlots(startsAt, occupiedUntil).map((slot) => ({ staffId: staff.id, startsAt: slot })) } },
          statusHistory: { create: { toStatus: status } },
          payment: depositCents > 0 ? { create: { amountCents: depositCents, status: "PENDING" } } : undefined,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) throw new BookingConflictError("Créneau déjà occupé");
    throw error;
  }
}
