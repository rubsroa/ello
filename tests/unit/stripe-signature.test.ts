import Stripe from "stripe";
import { describe, expect, it } from "vitest";

describe("signature du webhook Stripe", () => {
  const secret = "whsec_test_only";
  const payload = JSON.stringify({ id: "evt_test", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test" } } });
  const client = new Stripe("sk_test_placeholder");

  it("accepte un événement mock signé sur son corps brut", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: 1_788_220_800 });
    const event = client.webhooks.constructEvent(payload, header, secret, 300, undefined, 1_788_220_800 * 1000);
    expect(event.type).toBe("checkout.session.completed");
  });

  it("refuse la même charge avec un autre secret", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => client.webhooks.constructEvent(payload, header, "whsec_wrong")).toThrow();
  });
});
