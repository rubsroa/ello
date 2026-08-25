import "server-only";
import { addDays, addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { calculateAvailableSlots, type TimeInterval } from "@/lib/booking/engine";
import { emptyCalendarReader, type CalendarBusyReader } from "@/lib/calendar/types";
import { googleCalendarProvider } from "@/lib/calendar/google";
import { getBookingPolicy } from "@/lib/booking/policy";

const TIME_ZONE = "Europe/Zurich";

function localDateAt(date: string, minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return fromZonedTime(`${date}T${hours}:${mins}:00`, TIME_ZONE);
}

function parseBreaks(value: Prisma.JsonValue | null, date: string): TimeInterval[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const startMinutes = "startMinutes" in item ? item.startMinutes : undefined;
    const endMinutes = "endMinutes" in item ? item.endMinutes : undefined;
    if (typeof startMinutes !== "number" || typeof endMinutes !== "number") return [];
    return [{ start: localDateAt(date, startMinutes), end: localDateAt(date, endMinutes) }];
  });
}

function weekdayFor(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export type StaffSlot = { staffId: string; staffName: string; startsAt: string };

export async function getAvailableSlots(
  input: {
    date: string;
    serviceId: string;
    staffId?: string;
    now?: Date;
    administrative?: boolean;
    excludeBookingId?: string;
  },
  calendarReader: CalendarBusyReader = process.env.NODE_ENV === "test" ? emptyCalendarReader : googleCalendarProvider,
): Promise<StaffSlot[]> {
  const now = input.now ?? new Date();
  const weekday = weekdayFor(input.date);
  const [service, salonHours, policy] = await Promise.all([
    db.service.findFirst({
      where: { id: input.serviceId, active: true, ...(input.administrative ? {} : { onlineBookable: true }) },
      include: { staff: { include: { staff: { include: { availabilities: { where: { weekday, active: true } } } } } } },
    }),
    db.openingHours.findUnique({ where: { weekday } }),
    getBookingPolicy(),
  ]);
  if (!service || !salonHours || salonHours.closed) return [];

  const candidateStaff = service.staff
    .map((link) => ({ ...link.staff, customDuration: link.customDuration }))
    .filter((staff) => staff.active && (input.administrative || staff.acceptsOnlineBooking) && (!input.staffId || staff.id === input.staffId));
  const salonStart = localDateAt(input.date, salonHours.opensAtMinutes);
  const salonEnd = localDateAt(input.date, salonHours.closesAtMinutes);
  const earliestStart = input.administrative ? salonStart : addMinutes(now, policy.minimumNoticeMinutes);
  const latestStart = input.administrative ? salonEnd : addDays(now, policy.maximumAdvanceDays);

  const results = await Promise.all(candidateStaff.map(async (staff): Promise<StaffSlot[]> => {
    const availability = staff.availabilities[0];
    if (!availability) return [];
    const window = {
      start: new Date(Math.max(salonStart.getTime(), localDateAt(input.date, availability.startsAtMinutes).getTime())),
      end: new Date(Math.min(salonEnd.getTime(), localDateAt(input.date, availability.endsAtMinutes).getTime())),
    };
    if (window.start >= window.end) return [];

    const [bookings, timeOff, calendarBusy] = await Promise.all([
      db.booking.findMany({
        where: {
          staffId: staff.id,
          ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
          startsAt: { lt: window.end },
          endsAt: { gt: window.start },
          OR: [{ status: "CONFIRMED" }, { status: "PENDING_PAYMENT", expiresAt: { gt: now } }],
        },
        include: { service: { select: { bufferAfterMinutes: true } } },
      }),
      db.staffTimeOff.findMany({ where: { staffId: staff.id, startsAt: { lt: window.end }, endsAt: { gt: window.start } } }),
      calendarReader.getBusyIntervals(staff.id, window.start, window.end),
    ]);

    const busy: TimeInterval[] = [
      ...bookings.map((booking) => ({ start: booking.startsAt, end: addMinutes(booking.endsAt, booking.service.bufferAfterMinutes) })),
      ...timeOff.map((absence) => ({ start: absence.startsAt, end: absence.endsAt })),
      ...calendarBusy,
    ];
    const breaks = [...parseBreaks(salonHours.breaks, input.date), ...parseBreaks(availability.breaks, input.date)];
    const slots = calculateAvailableSlots({
      window,
      breaks,
      busy,
      durationMinutes: staff.customDuration ?? service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      stepMinutes: Number(process.env.BOOKING_SLOT_MINUTES ?? 15),
      earliestStart,
      latestStart,
    });
    return slots.map((slot) => ({ staffId: staff.id, staffName: `${staff.firstName} ${staff.lastName}`, startsAt: slot.toISOString() }));
  }));

  return results.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffName.localeCompare(b.staffName));
}
