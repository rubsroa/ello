import { describe, expect, it } from "vitest";
import { confirmationTemplate, reminderTemplate, salonTemplate } from "@/lib/email/templates";

const data = {
  firstName: "<Camille>",
  reference: "ELLO-2026-TEST",
  service: "Coupe & brushing",
  staff: "Nora Berset",
  startsAt: new Date("2026-09-02T08:00:00.000Z"),
  priceCents: 12_000,
  depositCents: 3_000,
};

describe("templates email", () => {
  it("échappe les données client dans le HTML", () => {
    const message = confirmationTemplate(data);
    expect(message.html).toContain("&lt;Camille&gt;");
    expect(message.html).toContain("Coupe &amp; brushing");
    expect(message.html).not.toContain("<Camille>");
  });

  it("produit les rappels et notifications paiement", () => {
    expect(reminderTemplate(data).subject).toContain("Rappel");
    const payment = salonTemplate(data, "paid");
    expect(payment.subject).toContain("Paiement reçu");
    expect(payment.text).toContain("ELLO-2026-TEST");
  });
});
