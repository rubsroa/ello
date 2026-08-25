import { addDays, startOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { formatChf } from "@/lib/utils";
import { BookingActions } from "@/components/admin/booking-actions";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function BookingsAdminPage() {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const staffScope = user.role === "STAFF" ? { staffId: user.staff?.id ?? "unassigned" } : {};
  const bookings = await db.booking.findMany({ where: { ...staffScope, startsAt: { gte: addDays(startOfDay(new Date()), -30) } }, orderBy: { startsAt: "asc" }, take: 200, include: { customer: true, service: { include: { staff: { include: { staff: { select: { id: true, firstName: true, lastName: true, active: true } } } } } }, staff: true, payment: true } });
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-brass">Planning</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Rendez-vous</h1></div><Link href="/admin/rendez-vous/nouveau" className="button bg-night text-ivory">Nouveau rendez-vous</Link></div><div className="mt-8 overflow-x-auto bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-night/10 text-xs uppercase tracking-[.12em] text-night/45"><tr><th className="p-4">Date</th><th className="p-4">Client</th><th className="p-4">Prestation</th><th className="p-4">Coiffeur</th><th className="p-4">Prix</th><th className="p-4">Statut</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y divide-night/8">{bookings.map((booking) => <tr key={booking.id}><td className="p-4 font-normal">{formatInTimeZone(booking.startsAt, "Europe/Zurich", "dd.MM.yyyy HH:mm")}</td><td className="p-4">{booking.customer.firstName} {booking.customer.lastName}<span className="block text-xs text-night/45">{booking.customer.phone}</span></td><td className="p-4">{booking.service.name}</td><td className="p-4">{booking.staff.firstName}</td><td className="p-4">{formatChf(booking.priceCents)}</td><td className="p-4"><span className="rounded-full bg-night/6 px-3 py-1 text-xs">{booking.status}</span></td><td className="p-4"><BookingActions id={booking.id} status={booking.status} startsAtLocal={formatInTimeZone(booking.startsAt, "Europe/Zurich", "yyyy-MM-dd'T'HH:mm")} staffId={booking.staffId} staffOptions={booking.service.staff.filter((link) => link.staff.active).map((link) => ({ id: link.staff.id, name: `${link.staff.firstName} ${link.staff.lastName}` }))} /></td></tr>)}</tbody></table></div></>;
}
