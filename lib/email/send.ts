import "server-only";
import { db } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { emailProvider } from "@/lib/email/provider";
import { cancellationTemplate, confirmationTemplate, reminderTemplate, rescheduledTemplate, salonTemplate } from "@/lib/email/templates";

type ClientFactory = typeof confirmationTemplate;
type SalonEvent = "new" | "cancelled" | "rescheduled" | "paid";

async function bookingData(bookingId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { customer: true, service: true, staff: true, payment: true } });
  if (!booking) throw new Error("Rendez-vous introuvable pour l’email");
  return {
    booking,
    data: {
      firstName: booking.customer.firstName,
      reference: booking.reference,
      service: booking.service.name,
      staff: `${booking.staff.firstName} ${booking.staff.lastName}`,
      startsAt: booking.startsAt,
      priceCents: booking.priceCents,
      depositCents: booking.depositCents,
    },
  };
}

export async function sendBookingConfirmation(bookingId: string) {
  const { booking, data } = await bookingData(bookingId);
  const jobs: Promise<void>[] = [deliver(bookingId, booking.customer.email, "booking-confirmation", confirmationTemplate(data))];
  const salonEmail = process.env.SALON_NOTIFICATION_EMAIL;
  if (salonEmail) {
    jobs.push(deliver(bookingId, salonEmail, "salon-new-booking", salonTemplate(data, "new")));
    if (booking.payment?.status === "PAID") jobs.push(deliver(bookingId, salonEmail, "salon-payment-received", salonTemplate(data, "paid")));
  }
  await Promise.all(jobs);
}

export async function sendBookingCancellation(bookingId: string) {
  return sendClientAndSalon(bookingId, "booking-cancellation", cancellationTemplate, "cancelled");
}

export async function sendBookingRescheduled(bookingId: string) {
  return sendClientAndSalon(bookingId, "booking-rescheduled", rescheduledTemplate, "rescheduled");
}

export async function sendBookingReminder(bookingId: string) {
  const { booking, data } = await bookingData(bookingId);
  await deliver(bookingId, booking.customer.email, "booking-reminder", reminderTemplate(data));
}

async function sendClientAndSalon(bookingId: string, template: string, factory: ClientFactory, event: SalonEvent) {
  const { booking, data } = await bookingData(bookingId);
  const jobs: Promise<void>[] = [deliver(bookingId, booking.customer.email, template, factory(data))];
  const salonEmail = process.env.SALON_NOTIFICATION_EMAIL;
  if (salonEmail) jobs.push(deliver(bookingId, salonEmail, `salon-${event}`, salonTemplate(data, event)));
  await Promise.all(jobs);
}

async function deliver(bookingId: string, recipient: string, template: string, message: ReturnType<ClientFactory>) {
  const provider = emailProvider();
  const existing = await db.emailLog.findUnique({ where: { bookingId_recipient_template: { bookingId, recipient, template } } });
  if (existing?.status === "SENT") return;
  if (existing?.status === "PENDING" && existing.createdAt.getTime() > Date.now() - 15 * 60_000) return;
  let log;
  try {
    log = existing
      ? await db.emailLog.update({ where: { id: existing.id }, data: { provider: provider.name, status: "PENDING", error: null } })
      : await db.emailLog.create({ data: { bookingId, recipient, template, provider: provider.name, status: "PENDING" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
  try {
    const result = await provider.send({ to: recipient, ...message });
    await db.emailLog.update({ where: { id: log.id }, data: { status: "SENT", sentAt: new Date(), providerId: result.id } });
  } catch (error) {
    await db.emailLog.update({ where: { id: log.id }, data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 1000) : "Erreur email" } });
    throw error;
  }
}
