import type { Metadata } from "next";
import { InnerHero } from "@/components/marketing/inner-hero";

export const metadata: Metadata = { title: "Politique de confidentialité", robots: { index: true, follow: true }, alternates: { canonical: "/confidentialite" } };
const sections = [
  ["Responsable du traitement", "ell’o — Coiffure · Genève, Rue du Midi 12, 1207 Genève. Pour toute question, contactez le salon au +41 76 385 03 40."],
  ["Données collectées", "Nous collectons uniquement les coordonnées et informations nécessaires à la prise en charge de votre rendez-vous : identité, e-mail, téléphone, prestation, horaire et notes que vous choisissez de transmettre."],
  ["Finalités", "Ces données servent à organiser, confirmer, modifier ou annuler les rendez-vous, encaisser un éventuel acompte et assurer le suivi de la relation client. Elles ne sont utilisées à des fins marketing qu’avec un consentement séparé et révocable."],
  ["Prestataires", "Certaines données strictement nécessaires peuvent être traitées par nos fournisseurs d’hébergement, d’e-mail, de calendrier et de paiement. Les données de carte bancaire sont traitées par Stripe et ne sont jamais stockées par ell’o."],
  ["Conservation et sécurité", "Les données sont conservées pendant une durée proportionnée aux besoins opérationnels, comptables et légaux. Nous appliquons des contrôles d’accès, le chiffrement des secrets et des sauvegardes protégées."],
  ["Vos droits", "Conformément à la LPD suisse et, lorsque applicable, au RGPD, vous pouvez demander l’accès, la rectification, l’export ou la suppression de vos données, sous réserve des obligations légales de conservation."],
] as const;
export default function PrivacyPage() { return <><InnerHero eyebrow="Vie privée" title="Vos données, avec mesure" intro="Une politique simple : collecter peu, protéger sérieusement et ne jamais détourner vos informations de leur usage prévu." /><article className="bg-ivory py-16 sm:py-24"><div className="page-shell max-w-3xl space-y-10">{sections.map(([title, copy]) => <section key={title}><h2 className="font-display text-2xl font-light">{title}</h2><p className="mt-3 font-light leading-7 text-night/70">{copy}</p></section>)}<p className="border-t border-night/15 pt-6 text-sm text-night/50">Dernière mise à jour : 25 août 2026.</p></div></article></>;
}
