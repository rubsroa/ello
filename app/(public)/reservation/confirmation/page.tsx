import Link from "next/link";
import { Check } from "lucide-react";
import { InnerHero } from "@/components/marketing/inner-hero";

export default async function ConfirmationPage({ searchParams }: PageProps<"/reservation/confirmation">) {
  const { reference } = await searchParams;
  return <><InnerHero eyebrow="Réservation" title="Merci" intro="Votre paiement est en cours de validation sécurisée." /><section className="bg-ivory py-20"><div className="page-shell max-w-3xl"><div className="bg-white p-8 sm:p-12"><Check size={36} className="text-brass" /><h2 className="mt-6 font-display text-4xl font-light">Votre demande a bien été transmise.</h2><p className="mt-4 text-night/60">La confirmation définitive vous est envoyée par e-mail après validation du paiement par Stripe.</p>{typeof reference === "string" && <p className="mt-4 text-night/60">Référence : <strong className="font-normal text-night">{reference}</strong></p>}<Link href="/" className="button mt-8 bg-night text-ivory">Retour à l’accueil</Link></div></div></section></>;
}
