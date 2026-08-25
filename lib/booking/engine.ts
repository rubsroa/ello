export type TimeInterval = Readonly<{
  start: Date;
  end: Date;
}>;

export type DepositPolicy = Readonly<{
  mode: "NONE" | "FIXED" | "PERCENTAGE" | "FULL";
  value: number;
}>;

export type AvailabilityInput = Readonly<{
  window: TimeInterval;
  breaks?: readonly TimeInterval[];
  busy?: readonly TimeInterval[];
  durationMinutes: number;
  bufferAfterMinutes?: number;
  stepMinutes?: number;
  earliestStart?: Date;
  latestStart?: Date;
}>;

const MINUTE_MS = 60_000;

function isValidInterval(interval: TimeInterval) {
  return Number.isFinite(interval.start.getTime()) && Number.isFinite(interval.end.getTime()) && interval.start < interval.end;
}

export function intervalsOverlap(left: TimeInterval, right: TimeInterval) {
  return left.start < right.end && right.start < left.end;
}

export function calculateAvailableSlots(input: AvailabilityInput): Date[] {
  if (!isValidInterval(input.window)) throw new Error("Fenêtre de disponibilité invalide");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) throw new Error("Durée de prestation invalide");

  const stepMinutes = input.stepMinutes ?? 15;
  const bufferAfterMinutes = input.bufferAfterMinutes ?? 0;
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) throw new Error("Pas de créneau invalide");
  if (!Number.isInteger(bufferAfterMinutes) || bufferAfterMinutes < 0) throw new Error("Marge invalide");

  const blocked = [...(input.breaks ?? []), ...(input.busy ?? [])].filter(isValidInterval);
  const totalMinutes = input.durationMinutes + bufferAfterMinutes;
  const latestEnd = input.window.end.getTime();
  const earliest = Math.max(input.window.start.getTime(), input.earliestStart?.getTime() ?? -Infinity);
  const latest = Math.min(latestEnd - totalMinutes * MINUTE_MS, input.latestStart?.getTime() ?? Infinity);
  const slots: Date[] = [];

  for (let cursor = input.window.start.getTime(); cursor <= latest; cursor += stepMinutes * MINUTE_MS) {
    if (cursor < earliest) continue;
    const candidate = { start: new Date(cursor), end: new Date(cursor + totalMinutes * MINUTE_MS) };
    if (!blocked.some((interval) => intervalsOverlap(candidate, interval))) slots.push(candidate.start);
  }

  return slots;
}

export function createOccupancySlots(start: Date, end: Date, stepMinutes = 5): Date[] {
  if (!isValidInterval({ start, end })) throw new Error("Intervalle de réservation invalide");
  if (!Number.isInteger(stepMinutes) || stepMinutes <= 0) throw new Error("Pas d’occupation invalide");
  const slots: Date[] = [];
  for (let cursor = start.getTime(); cursor < end.getTime(); cursor += stepMinutes * MINUTE_MS) slots.push(new Date(cursor));
  return slots;
}

export function calculateDepositCents(priceCents: number, policy: DepositPolicy): number {
  if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("Prix invalide");
  if (!Number.isInteger(policy.value) || policy.value < 0) throw new Error("Valeur d’acompte invalide");

  switch (policy.mode) {
    case "NONE": return 0;
    case "FIXED": return Math.min(priceCents, policy.value);
    case "PERCENTAGE": return Math.min(priceCents, Math.round((priceCents * policy.value) / 100));
    case "FULL": return priceCents;
  }
}
