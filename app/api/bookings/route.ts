import { NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/booking/validation";
import { createBooking } from "@/lib/booking/create-booking";
import { createCheckoutSession } from "@/lib/stripe/client";
import { runConfirmationIntegrations } from "@/lib/booking/confirm-booking";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin, clientAddress, enforceRateLimit, hashIdentifier } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`booking:${hashIdentifier(clientAddress(request))}`, 10, 15 * 60_000);
    const input = createBookingSchema.parse(await request.json());
    const booking = await createBooking(input);
    if (booking.depositCents > 0 && process.env.STRIPE_ENABLED === "true") {
      const checkout = await createCheckoutSession(booking.id);
      return NextResponse.json({ reference: booking.reference, status: booking.status, checkoutUrl: checkout?.url }, { status: 201 });
    }
    if (booking.status === "CONFIRMED") await runConfirmationIntegrations(booking.id);
    return NextResponse.json({ reference: booking.reference, status: booking.status }, { status: 201 });
  } catch (error) { return apiError(error); }
}
