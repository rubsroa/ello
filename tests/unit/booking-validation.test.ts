import { describe, expect, it } from "vitest";
import { createBookingSchema } from "@/lib/booking/validation";

describe("validation d’une réservation", () => {
  const valid = { serviceId: "clx1234567890123456789012", staffId: null, startsAt: "2026-09-02T08:00:00.000Z", customer: { firstName: "Alice", lastName: "Martin", email: "ALICE@example.com", phone: "+41 76 000 00 00", marketingConsent: false }, idempotencyKey: "6c87fa73-8e64-4f7d-9b53-3e8a8b57e8ad" };
  it("normalise l’e-mail et accepte un téléphone suisse", () => { expect(createBookingSchema.parse(valid).customer.email).toBe("alice@example.com"); });
  it("refuse un identifiant de prestation arbitraire", () => { expect(() => createBookingSchema.parse({ ...valid, serviceId: "1 OR 1=1" })).toThrow(); });
  it("ne pré-coche jamais le marketing", () => { expect(createBookingSchema.parse({ ...valid, customer: { ...valid.customer, marketingConsent: undefined } }).customer.marketingConsent).toBe(false); });
});
