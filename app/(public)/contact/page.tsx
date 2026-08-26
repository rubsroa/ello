import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { InnerHero } from "@/components/marketing/inner-hero";

export const metadata: Metadata = { title: "Contact", description: "Contactez le salon ell’o, Ruelle du Midi 12 à Genève.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return <><InnerHero eyebrow="Contact" title="Parlons de vos cheveux" intro="Une question avant de réserver ? Écrivez-nous ou appelez directement le salon." imageSrc="/media/lui-warm.webp" imageAlt="Portrait homme en lumière chaude" /><section className="bg-ivory pb-20 pt-28 sm:pb-28 sm:pt-36"><div className="page-shell grid gap-14 lg:grid-cols-[.65fr_1.35fr]"><div className="border-t border-night/15 pt-6"><p className="eyebrow text-brass">ell’o Genève</p><address className="mt-5 not-italic text-lg font-light leading-8">Ruelle du Midi 12<br />1207 Genève<br />Suisse</address><a className="mt-6 inline-block underline-offset-4 hover:underline" href="tel:+41763850340">+41 76 385 03 40</a><a className="mt-4 block text-sm font-normal uppercase tracking-[.12em] text-brass" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=Ruelle+du+Midi+12+1207+Gen%C3%A8ve">Itinéraire Google Maps</a></div><ContactForm /></div></section></>;
}
