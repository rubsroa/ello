import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { InnerHero } from "@/components/marketing/inner-hero";

export const metadata: Metadata = { title: "Prendre rendez-vous", description: "Réservez votre rendez-vous coiffure femme ou homme chez ell’o à Genève.", alternates: { canonical: "/reservation" } };

export default async function ReservationPage({ searchParams }: PageProps<"/reservation">) {
  const { service } = await searchParams;
  return <><InnerHero eyebrow="Réservation en ligne" title="Un moment pour vous" intro="Choisissez votre prestation et trouvez simplement le créneau qui vous convient. La disponibilité est vérifiée en temps réel." /><section className="bg-ivory py-14 sm:py-20"><div className="page-shell"><BookingWizard initialServiceId={typeof service === "string" ? service : undefined} /></div></section></>;
}
