import type { TimeInterval } from "@/lib/booking/engine";

export interface CalendarBusyReader {
  getBusyIntervals(staffId: string, start: Date, end: Date): Promise<TimeInterval[]>;
}

export interface CalendarWriter {
  createBookingEvent(bookingId: string): Promise<void>;
  updateBookingEvent(bookingId: string): Promise<void>;
  deleteBookingEvent(bookingId: string): Promise<void>;
}

export const emptyCalendarReader: CalendarBusyReader = {
  async getBusyIntervals() { return []; },
};
