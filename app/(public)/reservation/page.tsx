import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { InnerHero } from "@/components/marketing/inner-hero";

export const metadata: Metadata = { title: "Prendre rendez-vous", description: "Réservez votre rendez-vous coiffure femme ou homme chez ell’o à Genève.", alternates: { canonical: "/reservation" } };

export default async function ReservationPage({ searchParams }: PageProps<"/reservation">) {
  const { service } = await searchParams;
  return <><InnerHero eyebrow="Réservation en ligne" title="Un moment pour vous" intro="Une prestation, une date, une heure. La disponibilité est vérifiée en temps réel." imageSrc="/media/elle-blonde.webp" imageAlt="Chevelure blonde en mouvement" /><section className="bg-ivory pb-20 pt-28 sm:pb-28 sm:pt-36"><div className="page-shell"><BookingWizard initialServiceId={typeof service === "string" ? service : undefined} /></div></section></>;
}
