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
  return <><div className="grid gap-5 border-b border-night/15 pb-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow text-brass">Pilotage</p><h1 className="mt-4 font-display text-5xl font-extralight tracking-[-.055em] sm:text-7xl">Vue d’ensemble</h1></div><p className="max-w-sm text-sm font-light leading-6 text-night/55">Les indicateurs essentiels du salon, réunis dans une vue calme et lisible.</p></div><div className="mt-10 grid border-l border-t border-night/12 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value], index) => <article key={label} className="min-h-44 border-b border-r border-night/12 bg-white/55 p-6"><div className="flex items-center justify-between"><p className="text-[.62rem] font-normal uppercase tracking-[.16em] text-night/45">{label}</p><span className="text-[.55rem] tracking-[.15em] text-brass">{String(index + 1).padStart(2, "0")}</span></div><p className="mt-10 font-display text-4xl font-extralight tracking-[-.04em]">{value}</p></article>)}</div></>;
}
