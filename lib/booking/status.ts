import type { BookingStatus } from "@prisma/client";

const transitions: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  PENDING_PAYMENT: ["CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
  EXPIRED: [],
};

export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus) {
  return transitions[from].includes(to);
}

export class BookingStateConflictError extends Error {
  constructor(message = "Le rendez-vous a été modifié simultanément") {
    super(message);
    this.name = "BookingStateConflictError";
  }
}
