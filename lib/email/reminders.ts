import "server-only";
import { addHours } from "date-fns";
import { db } from "@/lib/db/client";
import { sendBookingReminder } from "@/lib/email/send";

export async function sendDueBookingReminders(now = new Date()) {
  const bookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { gte: addHours(now, 23), lt: addHours(now, 25) },
      emailLogs: { none: { template: "booking-reminder", status: "SENT" } },
    },
    select: { id: true },
    take: 100,
  });
  const results = await Promise.allSettled(bookings.map((booking) => sendBookingReminder(booking.id)));
  return {
    selected: bookings.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}
