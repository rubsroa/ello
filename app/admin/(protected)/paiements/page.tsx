import { formatInTimeZone } from "date-fns-tz";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { formatChf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireUser(["ADMIN"]);
  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    include: { booking: { include: { customer: true, service: true } } },
  });
  return <><p className="eyebrow text-brass">Encaissements</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Paiements</h1><div className="mt-8 overflow-x-auto bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-night/10"><tr><th className="p-4">Date</th><th className="p-4">Référence</th><th className="p-4">Client</th><th className="p-4">Prestation</th><th className="p-4">Montant</th><th className="p-4">Statut</th></tr></thead><tbody className="divide-y divide-night/8">{payments.map((payment) => <tr key={payment.id}><td className="p-4">{formatInTimeZone(payment.createdAt, "Europe/Zurich", "dd.MM.yyyy HH:mm")}</td><td className="p-4 font-normal">{payment.booking.reference}</td><td className="p-4">{payment.booking.customer.firstName} {payment.booking.customer.lastName}</td><td className="p-4">{payment.booking.service.name}</td><td className="p-4">{formatChf(payment.amountCents)}</td><td className="p-4"><span className="rounded-full bg-night/6 px-3 py-1 text-xs">{payment.status}</span></td></tr>)}</tbody></table>{payments.length === 0 && <p className="p-6 text-sm text-night/55">Aucun paiement enregistré.</p>}</div></>;
}
