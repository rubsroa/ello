import "server-only";

import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db/client";

export class StripePaymentMismatchError extends Error {}

export type PaidCheckoutInput = {
  id: string;
  bookingId: string;
  paymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
};

type StoredCheckoutState = {
  bookingStatus: BookingStatus;
  expiresAt: Date | null;
  slotCount: number;
  paymentStatus: PaymentStatus;
  stripeSessionId: string | null;
  amountCents: number;
  currency: string;
};

export type CheckoutDecision = "confirm" | "refund" | "already_confirmed" | "already_refunded";

export function decidePaidCheckout(input: PaidCheckoutInput, stored: StoredCheckoutState, now = new Date()): CheckoutDecision {
  if (
    stored.stripeSessionId !== input.id
    || input.amountTotal !== stored.amountCents
    || input.currency?.toUpperCase() !== stored.currency.toUpperCase()
  ) throw new StripePaymentMismatchError("Le paiement Stripe ne correspond pas à la réservation");

  if (stored.bookingStatus === "CONFIRMED" && stored.paymentStatus === "PAID") return "already_confirmed";
  if (stored.paymentStatus === "REFUNDED") return "already_refunded";
  if (stored.paymentStatus !== "PENDING") throw new StripePaymentMismatchError("État de paiement Stripe incohérent");
  if (
    stored.bookingStatus !== "PENDING_PAYMENT"
    || !stored.expiresAt
    || stored.expiresAt <= now
    || stored.slotCount === 0
  ) return "refund";
  return "confirm";
}

export async function applyPaidCheckout(input: PaidCheckoutInput) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: { payment: true, _count: { select: { slots: true } } },
    });
    if (!booking?.payment) throw new StripePaymentMismatchError("Paiement sans réservation");
    const checkedAt = new Date();
    const decision = decidePaidCheckout(input, {
      bookingStatus: booking.status,
      expiresAt: booking.expiresAt,
      slotCount: booking._count.slots,
      paymentStatus: booking.payment.status,
      stripeSessionId: booking.payment.stripeSessionId,
      amountCents: booking.payment.amountCents,
      currency: booking.payment.currency,
    }, checkedAt);

    if (decision === "already_confirmed" || decision === "already_refunded") return { decision, bookingId: booking.id };
    if (decision === "refund") {
      if (!input.paymentIntentId) throw new StripePaymentMismatchError("PaymentIntent absent pour le remboursement");
      if (booking.status === "PENDING_PAYMENT") {
        await tx.bookingSlot.deleteMany({ where: { bookingId: booking.id } });
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "EXPIRED", statusHistory: { create: { fromStatus: booking.status, toStatus: "EXPIRED", reason: "Paiement reçu après expiration du créneau" } } },
        });
      }
      return { decision, bookingId: booking.id, paymentIntentId: input.paymentIntentId };
    }

    const changed = await tx.booking.updateMany({
      where: { id: booking.id, status: "PENDING_PAYMENT", expiresAt: { gt: checkedAt } },
      data: { status: "CONFIRMED", expiresAt: null },
    });
    if (changed.count !== 1) throw new StripePaymentMismatchError("Le créneau a expiré pendant la confirmation");
    await tx.payment.update({
      where: { bookingId: booking.id },
      data: { status: "PAID", paidAt: new Date(), stripePaymentIntentId: input.paymentIntentId },
    });
    await tx.bookingStatusHistory.create({
      data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "CONFIRMED", reason: "Paiement Stripe confirmé par webhook" },
    });
    return { decision, bookingId: booking.id };
  });
}

export async function recordAutomaticRefund(bookingId: string, paymentIntentId: string) {
  await db.payment.update({
    where: { bookingId },
    data: { status: "REFUNDED", refundedAt: new Date(), stripePaymentIntentId: paymentIntentId, rawMetadata: { reason: "late_or_ineligible_checkout" } },
  });
}
