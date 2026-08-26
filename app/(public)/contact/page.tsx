import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { InnerHero } from "@/components/marketing/inner-hero";

export const metadata: Metadata = { title: "Contact", description: "Contactez le salon ell’o, Ruelle du Midi 12 à Genève.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return <><InnerHero eyebrow="Contact" title="Parlons de vos cheveux" intro="Une question avant de réserver ? Écrivez-nous ou appelez directement le salon." /><section className="bg-ivory py-16 sm:py-24"><div className="page-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="eyebrow text-brass">ell’o Genève</p><address className="mt-5 not-italic text-lg font-light leading-8">Ruelle du Midi 12<br />1207 Genève<br />Suisse</address><a className="mt-6 inline-block underline-offset-4 hover:underline" href="tel:+41763850340">+41 76 385 03 40</a><a className="mt-4 block text-sm font-normal uppercase tracking-[.12em] text-brass" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=Ruelle+du+Midi+12+1207+Gen%C3%A8ve">Itinéraire Google Maps</a></div><ContactForm /></div></section></>;
}
