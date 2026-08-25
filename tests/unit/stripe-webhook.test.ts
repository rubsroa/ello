import { describe, expect, it } from "vitest";
import { decidePaidCheckout, StripePaymentMismatchError } from "@/lib/stripe/webhook";

const input = { id: "cs_test_123", bookingId: "booking", paymentIntentId: "pi_123", amountTotal: 3_000, currency: "chf" };
const stored = { bookingStatus: "PENDING_PAYMENT" as const, expiresAt: new Date("2026-09-01T12:00:00Z"), slotCount: 6, paymentStatus: "PENDING" as const, stripeSessionId: input.id, amountCents: 3_000, currency: "CHF" };
const now = new Date("2026-09-01T11:00:00Z");

describe("webhook Stripe", () => {
  it("confirme une session exactement liée et encore éligible", () => {
    expect(decidePaidCheckout(input, stored, now)).toBe("confirm");
  });

  it("rembourse un paiement expiré ou privé de ses slots", () => {
    expect(decidePaidCheckout(input, { ...stored, expiresAt: now }, now)).toBe("refund");
    expect(decidePaidCheckout(input, { ...stored, slotCount: 0 }, now)).toBe("refund");
  });

  it.each([
    { ...input, id: "cs_wrong" },
    { ...input, amountTotal: 2_999 },
    { ...input, currency: "eur" },
  ])("refuse une autre session, somme ou devise", (candidate) => {
    expect(() => decidePaidCheckout(candidate, stored, now)).toThrow(StripePaymentMismatchError);
  });

  it("reste idempotent après confirmation", () => {
    expect(decidePaidCheckout(input, { ...stored, bookingStatus: "CONFIRMED", paymentStatus: "PAID", expiresAt: null }, now)).toBe("already_confirmed");
  });
});
