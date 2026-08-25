import { BookingWizard } from "@/components/booking/booking-wizard";
import { requireUser } from "@/lib/auth/authorization";

export default async function NewAdminBookingPage() {
  await requireUser(["ADMIN", "STAFF"]);
  return (
    <>
      <p className="eyebrow text-brass">Planning</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Nouveau rendez-vous</h1>
      <div className="mt-8 bg-ivory p-5 sm:p-8">
        <BookingWizard endpoint="/api/admin/bookings" />
      </div>
    </>
  );
}
