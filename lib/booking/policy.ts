import "server-only";
import { db } from "@/lib/db/client";

export type BookingPolicy = {
  paymentsEnabled: boolean;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  timeZone: "Europe/Zurich";
};

export async function getBookingPolicy(): Promise<BookingPolicy> {
  const record = await db.siteSettings.findUnique({ where: { key: "booking" } });
  const value = record?.value && typeof record.value === "object" && !Array.isArray(record.value) ? record.value as Record<string, unknown> : {};
  return {
    paymentsEnabled: value.paymentsEnabled === true && process.env.STRIPE_ENABLED === "true",
    minimumNoticeMinutes: typeof value.minimumNoticeMinutes === "number" ? value.minimumNoticeMinutes : Number(process.env.BOOKING_MIN_NOTICE_MINUTES ?? 120),
    maximumAdvanceDays: typeof value.maximumAdvanceDays === "number" ? value.maximumAdvanceDays : Number(process.env.BOOKING_MAX_ADVANCE_DAYS ?? 90),
    timeZone: "Europe/Zurich",
  };
}
