import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { getAvailableSlots } from "@/lib/booking/availability-service";
import { createBooking } from "@/lib/booking/create-booking";
import { rescheduleBooking } from "@/lib/booking/reschedule-booking";
import { createBookingSchema } from "@/lib/booking/validation";

const run = process.env.RUN_DB_TESTS === "true";
const emails = new Set<string>();

afterEach(async () => {
  if (!run || !emails.size) return;
  const customers = await db.customer.findMany({ where: { email: { in: [...emails] } }, select: { id: true } });
  const bookings = await db.booking.findMany({ where: { customerId: { in: customers.map((customer) => customer.id) } }, select: { id: true } });
  await db.auditLog.deleteMany({ where: { entityType: "Booking", entityId: { in: bookings.map((booking) => booking.id) } } });
  await db.bookingSlot.deleteMany({ where: { bookingId: { in: bookings.map((booking) => booking.id) } } });
  await db.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookings.map((booking) => booking.id) } } });
  await db.payment.deleteMany({ where: { bookingId: { in: bookings.map((booking) => booking.id) } } });
  await db.booking.deleteMany({ where: { id: { in: bookings.map((booking) => booking.id) } } });
  await db.customer.deleteMany({ where: { id: { in: customers.map((customer) => customer.id) } } });
  emails.clear();
});

describe.skipIf(!run)("réservation MySQL", () => {
  it("crée une réservation, ses unités d’occupation et respecte l’idempotence", async () => {
    const service = await db.service.findUniqueOrThrow({ where: { slug: "coupe-homme" } });
    const slot = (await getAvailableSlots({ date: "2026-09-02", serviceId: service.id, now: new Date("2026-08-25T08:00:00Z") }))[0];
    expect(slot).toBeDefined();
    const email = `booking-${randomUUID()}@example.test`; emails.add(email);
    const input = { serviceId: service.id, staffId: slot!.staffId, startsAt: slot!.startsAt, customer: { firstName: "Test", lastName: "Client", email, phone: "+41 76 000 00 01", marketingConsent: false }, idempotencyKey: randomUUID() };
    const first = await createBooking(input);
    const second = await createBooking(input);
    expect(second.id).toBe(first.id);
    expect(first.status).toBe("CONFIRMED");
    expect(await db.bookingSlot.count({ where: { bookingId: first.id } })).toBeGreaterThan(0);
  });

  it("n’autorise qu’une réservation lors de deux confirmations concurrentes", async () => {
    const service = await db.service.findUniqueOrThrow({ where: { slug: "coupe-tondeuse" } });
    const slot = (await getAvailableSlots({ date: "2026-09-03", serviceId: service.id, now: new Date("2026-08-25T08:00:00Z") }))[0];
    expect(slot).toBeDefined();
    const build = (suffix: string) => { const email = `race-${suffix}-${randomUUID()}@example.test`; emails.add(email); return { serviceId: service.id, staffId: slot!.staffId, startsAt: slot!.startsAt, customer: { firstName: "Course", lastName: suffix, email, phone: `+41 76 000 00 0${suffix}`, marketingConsent: false }, idempotencyKey: randomUUID() }; };
    const results = await Promise.allSettled([createBooking(build("1")), createBooking(build("2"))]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("déplace atomiquement un rendez-vous et libère son ancien créneau", async () => {
    const service = await db.service.findUniqueOrThrow({ where: { slug: "coupe-homme" } });
    const slots = await getAvailableSlots({ date: "2026-09-04", serviceId: service.id, now: new Date("2026-08-25T08:00:00Z") });
    expect(slots.length).toBeGreaterThan(2);
    const original = slots[0]!;
    const target = slots.find((slot) => slot.staffId === original.staffId && slot.startsAt !== original.startsAt);
    expect(target).toBeDefined();
    const email = `move-${randomUUID()}@example.test`; emails.add(email);
    const booking = await createBooking({ serviceId: service.id, staffId: original.staffId, startsAt: original.startsAt, customer: { firstName: "Move", lastName: "Client", email, phone: "+41 76 000 00 09", marketingConsent: false }, idempotencyKey: randomUUID() });
    const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN" } });

    const moved = await rescheduleBooking({ bookingId: booking.id, startsAt: new Date(target!.startsAt), staffId: target!.staffId, changedById: admin.id });

    expect(moved.startsAt.toISOString()).toBe(target!.startsAt);
    expect(await db.bookingSlot.count({ where: { bookingId: booking.id, startsAt: new Date(original.startsAt) } })).toBe(0);
    expect(await db.bookingSlot.count({ where: { bookingId: booking.id } })).toBeGreaterThan(0);
  });

  it("ne modifie pas une fiche client existante sur la seule connaissance de son email", async () => {
    const service = await db.service.findUniqueOrThrow({ where: { slug: "coupe-tondeuse" } });
    const slot = (await getAvailableSlots({ date: "2026-09-05", serviceId: service.id, now: new Date("2026-08-25T08:00:00Z") }))[0];
    expect(slot).toBeDefined();
    const email = `ownership-${randomUUID()}@example.test`; emails.add(email);
    const original = await db.customer.create({ data: { firstName: "Cliente", lastName: "Originale", email, phone: "+41760000007", marketingConsent: false } });
    const booking = await createBooking(createBookingSchema.parse({ serviceId: service.id, staffId: slot!.staffId, startsAt: slot!.startsAt, customer: { firstName: "Attaque", lastName: "Publique", email, phone: "+41 76 000 00 08", marketingConsent: true }, idempotencyKey: randomUUID() }));

    const unchanged = await db.customer.findUniqueOrThrow({ where: { id: original.id } });
    expect(booking.customerId).not.toBe(original.id);
    expect(unchanged).toMatchObject({ firstName: "Cliente", lastName: "Originale", phone: "+41760000007", marketingConsent: false });
  });

  it("retire les indisponibilités renvoyées par un mock Google Calendar", async () => {
    const service = await db.service.findUniqueOrThrow({ where: { slug: "coupe-homme" } });
    const date = "2026-09-08";
    const baseline = await getAvailableSlots({ date, serviceId: service.id, now: new Date("2026-08-25T08:00:00Z") });
    expect(baseline[0]).toBeDefined();
    const blockedStart = new Date(baseline[0]!.startsAt);
    const withGoogleBusy = await getAvailableSlots(
      { date, serviceId: service.id, staffId: baseline[0]!.staffId, now: new Date("2026-08-25T08:00:00Z") },
      { async getBusyIntervals() { return [{ start: blockedStart, end: new Date(blockedStart.getTime() + 60 * 60_000) }]; } },
    );
    expect(withGoogleBusy.some((slot) => slot.startsAt === baseline[0]!.startsAt)).toBe(false);
  });
});
