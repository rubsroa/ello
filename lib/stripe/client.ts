import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db/client";

let stripeClient: Stripe | undefined;

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (process.env.STRIPE_ENABLED !== "true" || !key) throw new Error("Stripe n’est pas activé");
  stripeClient ??= new Stripe(key);
  return stripeClient;
}

export async function createCheckoutSession(bookingId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { service: true, customer: true, payment: true } });
  if (!booking?.payment || booking.depositCents <= 0) return null;
  if (booking.payment.stripeSessionId) return stripe().checkout.sessions.retrieve(booking.payment.stripeSessionId);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: booking.customer.email,
    client_reference_id: booking.id,
    expires_at: booking.expiresAt ? Math.floor(booking.expiresAt.getTime() / 1000) : undefined,
    success_url: `${appUrl}/reservation/confirmation?reference=${encodeURIComponent(booking.reference)}`,
    cancel_url: `${appUrl}/reservation?cancelled=1`,
    line_items: [{ quantity: 1, price_data: { currency: "chf", unit_amount: booking.depositCents, product_data: { name: `Acompte — ${booking.service.name}`, description: `Rendez-vous ${booking.reference}` } } }],
    metadata: { bookingId: booking.id, bookingReference: booking.reference },
    payment_intent_data: { metadata: { bookingId: booking.id, bookingReference: booking.reference } },
  }, { idempotencyKey: `checkout-${booking.id}` });
  await db.payment.update({ where: { bookingId }, data: { stripeSessionId: session.id } });
  return session;
}
