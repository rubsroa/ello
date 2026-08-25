import { describe, expect, it } from "vitest";
import { canTransitionBookingStatus } from "@/lib/booking/status";

describe("transitions de rendez-vous", () => {
  it("autorise uniquement les sorties métier attendues", () => {
    expect(canTransitionBookingStatus("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransitionBookingStatus("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canTransitionBookingStatus("PENDING_PAYMENT", "CANCELLED")).toBe(true);
  });

  it.each(["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"] as const)("interdit de ressusciter %s", (status) => {
    expect(canTransitionBookingStatus(status, "CONFIRMED")).toBe(false);
  });
});
