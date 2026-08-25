import { describe, expect, it } from "vitest";
import { calculateAvailableSlots, calculateDepositCents, createOccupancySlots, intervalsOverlap } from "@/lib/booking/engine";

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 7, 26, hour, minute));

describe("moteur de disponibilité", () => {
  it("génère les créneaux dans la fenêtre avec la durée et la marge", () => {
    const slots = calculateAvailableSlots({
      window: { start: at(9), end: at(12) },
      durationMinutes: 60,
      bufferAfterMinutes: 15,
      stepMinutes: 15,
    });
    expect(slots.map((slot) => slot.toISOString().slice(11, 16))).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45"]);
  });

  it("retire les pauses et rendez-vous qui chevauchent le service", () => {
    const slots = calculateAvailableSlots({
      window: { start: at(9), end: at(13) },
      breaks: [{ start: at(12), end: at(12, 30) }],
      busy: [{ start: at(10), end: at(11) }],
      durationMinutes: 45,
      stepMinutes: 15,
    });
    expect(slots.map((slot) => slot.toISOString().slice(11, 16))).toEqual(["09:00", "09:15", "11:00", "11:15"]);
  });

  it("considère deux rendez-vous contigus comme non conflictuels", () => {
    expect(intervalsOverlap({ start: at(9), end: at(10) }, { start: at(10), end: at(11) })).toBe(false);
  });

  it("crée des unités d’occupation exclusives pour la contrainte SQL", () => {
    expect(createOccupancySlots(at(9), at(9, 30)).map((slot) => slot.toISOString().slice(11, 16))).toEqual(["09:00", "09:05", "09:10", "09:15", "09:20", "09:25"]);
  });
});

describe("acompte", () => {
  it.each([
    ["NONE", 0, 0],
    ["FIXED", 3_000, 3_000],
    ["PERCENTAGE", 25, 3_000],
    ["FULL", 0, 12_000],
  ] as const)("calcule le mode %s", (mode, value, expected) => {
    expect(calculateDepositCents(12_000, { mode, value })).toBe(expected);
  });

  it("plafonne un acompte fixe au prix total", () => {
    expect(calculateDepositCents(2_000, { mode: "FIXED", value: 3_000 })).toBe(2_000);
  });
});
