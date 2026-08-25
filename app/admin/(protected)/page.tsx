import { startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { formatChf } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const user = await requireUser(["ADMIN", "STAFF"]);
  const now = new Date();
  const staffId = user.role === "STAFF" ? user.staff?.id ?? "unassigned" : undefined;
  const staffScope = staffId ? { staffId } : {};
  const [today, week, payments, newClients, noShows, cancellations] = await Promise.all([
    db.booking.count({ where: { ...staffScope, startsAt: { gte: startOfDay(now) }, status: "CONFIRMED" } }),
    db.booking.findMany({ where: { ...staffScope, startsAt: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }, status: "CONFIRMED" }, select: { priceCents: true } }),
    db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfWeek(now, { weekStartsOn: 1 }) }, ...(staffId ? { booking: { staffId } } : {}) }, _sum: { amountCents: true } }),
    db.customer.count({ where: { createdAt: { gte: startOfWeek(now, { weekStartsOn: 1 }) }, ...(staffId ? { bookings: { some: { staffId } } } : {}) } }),
    db.booking.count({ where: { ...staffScope, status: "NO_SHOW", startsAt: { gte: startOfWeek(now, { weekStartsOn: 1 }) } } }),
    db.booking.count({ where: { ...staffScope, status: "CANCELLED", startsAt: { gte: startOfWeek(now, { weekStartsOn: 1 }) } } }),
  ]);
  const stats = [["Rendez-vous aujourd’hui", today], ["Rendez-vous semaine", week.length], ["CA estimé", formatChf(week.reduce((sum, item) => sum + item.priceCents, 0))], ["Paiements reçus", formatChf(payments._sum.amountCents ?? 0)], ["Nouveaux clients", newClients], ["No-shows", noShows], ["Annulations", cancellations]];
  return <><p className="eyebrow text-brass">Pilotage</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em] sm:text-5xl">Vue d’ensemble</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <article key={label} className="border border-night/8 bg-white p-6"><p className="text-xs font-normal uppercase tracking-[.13em] text-night/45">{label}</p><p className="mt-4 font-display text-3xl font-light">{value}</p></article>)}</div></>;
}
