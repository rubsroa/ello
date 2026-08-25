import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { runConfirmationIntegrations } from "@/lib/booking/confirm-booking";
import { apiError } from "@/lib/http/response";
import { applyPaidCheckout, recordAutomaticRefund, StripePaymentMismatchError } from "@/lib/stripe/webhook";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) return NextResponse.json({ error: "Signature Stripe absente" }, { status: 400 });
    const event = stripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);

    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return NextResponse.json({ error: "Booking metadata absente" }, { status: 400 });
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
      const result = await applyPaidCheckout({
        id: session.id,
        bookingId,
        paymentIntentId,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
      if (result.decision === "confirm") await runConfirmationIntegrations(bookingId);
      if (result.decision === "refund" && result.paymentIntentId) {
        await stripe().refunds.create({ payment_intent: result.paymentIntentId, reason: "requested_by_customer", metadata: { bookingId, reason: "late_or_ineligible_checkout" } }, { idempotencyKey: `late-refund-${session.id}` });
        await recordAutomaticRefund(bookingId, result.paymentIntentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof StripePaymentMismatchError) return NextResponse.json({ error: error.message }, { status: 400 });
    return apiError(error);
  }
}
