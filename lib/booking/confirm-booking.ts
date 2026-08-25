import "server-only";
import { googleCalendarProvider } from "@/lib/calendar/google";

export async function runConfirmationIntegrations(bookingId: string) {
  const results = await Promise.allSettled([
    googleCalendarProvider.createBookingEvent(bookingId),
    import("@/lib/email/send").then(({ sendBookingConfirmation }) => sendBookingConfirmation(bookingId)),
  ]);
  for (const result of results) if (result.status === "rejected") console.error("Booking integration failed", { bookingId, message: result.reason instanceof Error ? result.reason.message : "unknown" });
}
