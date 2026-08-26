import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { SiteIntro } from "@/components/marketing/site-intro";

const universes = [
  { number: "01", eyebrow: "Elle", title: "Coupe, couleur, lumière", copy: "Une lecture précise du cheveu, des lignes qui vivent et une couleur pensée pour durer.", href: "/elle", image: "/media/elle-editorial.webp", alt: "Cheveux longs et lumineux, coiffure femme éditoriale" },
  { number: "02", eyebrow: "Lui", title: "Coupe, texture, barbe", copy: "Des volumes nets sans rigidité, des finitions maîtrisées et un entretien simple au quotidien.", href: "/lui", image: "/media/lui-curls.webp", alt: "Coupe homme texturée aux mèches blondes" },
] as const;

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "ell’o — Coiffure · Genève",
    telephone: "+41763850340",
    url: process.env.APP_URL ?? "http://localhost:3000",
    address: { "@type": "PostalAddress", streetAddress: "Ruelle du Midi 12", postalCode: "1207", addressLocality: "Genève", addressCountry: "CH" },
    priceRange: "CHF",
  };

  return (
    <>
      <SiteIntro />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <section className="relative isolate min-h-svh overflow-hidden bg-night text-ivory">
        <div className="absolute inset-0">
          <HomeHeroVideo />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,37,54,.95)_0%,rgba(14,37,54,.72)_43%,rgba(14,37,54,.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,37,54,.72),transparent_58%)]" />
        </div>
        <div className="page-shell relative flex min-h-svh items-end pb-12 pt-36 sm:pb-16 lg:pb-14">
          <div className="w-full">
            <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <p className="eyebrow text-brass">Maison de coiffure · Genève</p>
                <h1 className="mt-6 max-w-5xl font-display text-[clamp(4rem,10vw,9.5rem)] font-extralight leading-[.78] tracking-[-.065em]">Coiffure en<br /><span className="ml-[.32em] italic">mouvement.</span></h1>
              </div>
              <div className="max-w-md lg:justify-self-end lg:pb-2">
                <p className="text-pretty text-base font-light leading-7 text-ivory/78 sm:text-lg sm:leading-8">Un salon intime, une seule main, et le temps nécessaire pour trouver la ligne juste.</p>
                <Link className="button button-light mt-7" href="/reservation">Prendre rendez-vous <ArrowRight aria-hidden="true" size={17} /></Link>
              </div>
            </div>
            <div className="mt-12 flex items-end justify-between border-t border-ivory/20 pt-5 text-[.62rem] font-normal uppercase tracking-[.18em] text-ivory/60">
              <span className="inline-flex items-center gap-2"><MapPin size={14} aria-hidden="true" /> Ruelle du Midi 12</span>
              <a href="#savoir-faire" className="hidden items-center gap-2 sm:inline-flex">Découvrir <ArrowDown size={14} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="savoir-faire" className="overflow-hidden bg-ivory py-20 text-night sm:py-28 lg:py-36">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[.55fr_1.45fr]">
            <div><p className="eyebrow text-brass">Le regard ell’o</p><p className="mt-4 text-xs font-normal uppercase tracking-[.16em] text-night/40">Genève · Depuis toujours</p></div>
            <div>
              <h2 className="section-title max-w-5xl">Observer la matière.<br /><span className="italic">Révéler la personne.</span></h2>
              <p className="mt-9 max-w-2xl text-pretty text-lg font-light leading-8 text-night/65">Ici, pas de coupe appliquée par réflexe. Chaque rendez-vous commence par une conversation, puis un geste précis qui respecte votre visage, votre texture et votre manière de vivre.</p>
            </div>
          </div>
          <div className="mt-16 grid gap-5 md:grid-cols-[1.25fr_.75fr] lg:mt-24">
            <div className="relative aspect-[16/10] overflow-hidden bg-night"><Image src="/media/elle-motion.webp" alt="Coiffure blonde en mouvement" fill sizes="(min-width: 768px) 64vw, 100vw" className="object-cover" /></div>
            <div className="relative aspect-[4/5] overflow-hidden bg-night md:mt-24"><Image src="/media/lui-long.webp" alt="Coupe homme longue, texture naturelle" fill sizes="(min-width: 768px) 36vw, 100vw" className="object-cover grayscale" /></div>
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28" aria-labelledby="univers-title">
        <div className="page-shell">
          <div className="flex items-end justify-between gap-8 border-b border-night/15 pb-8">
            <div><p className="eyebrow text-brass">Prestations</p><h2 id="univers-title" className="mt-4 font-display text-4xl font-extralight tracking-[-.045em] sm:text-6xl">Deux univers. Un seul regard.</h2></div>
            <Link href="/reservation" className="hidden text-xs font-normal uppercase tracking-[.16em] underline-offset-8 hover:underline sm:inline-flex">Réserver</Link>
          </div>
          <div className="grid md:grid-cols-2">
            {universes.map((universe) => (
              <Link key={universe.eyebrow} href={universe.href} className="group border-b border-night/15 py-8 md:odd:border-r md:odd:pr-5 md:even:pl-5">
                <div className="relative aspect-[4/5] overflow-hidden bg-night">
                  <Image src={universe.image} alt={universe.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.025]" />
                  <span className="absolute left-5 top-5 rounded-full bg-ivory px-3 py-2 text-[.6rem] font-normal tracking-[.16em] text-night">{universe.number}</span>
                </div>
                <div className="grid gap-5 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div><p className="eyebrow text-brass">{universe.eyebrow}</p><h3 className="mt-3 font-display text-3xl font-light tracking-[-.035em] sm:text-4xl">{universe.title}</h3><p className="mt-3 max-w-lg text-sm font-light leading-6 text-night/60">{universe.copy}</p></div>
                  <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="maison" className="relative isolate min-h-[80svh] overflow-hidden bg-night text-ivory">
        <video autoPlay loop muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-65"><source src="/media/ritual-hair.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,37,54,.9),rgba(14,37,54,.2))]" />
        <div className="page-shell relative flex min-h-[80svh] items-end py-16 sm:py-24">
          <div className="max-w-3xl"><p className="eyebrow text-brass">Le rituel</p><h2 className="section-title mt-5">Le temps du geste,<br /><span className="italic">sans précipitation.</span></h2><p className="mt-7 max-w-xl font-light leading-8 text-ivory/72">Diagnostic, coupe, couleur et finition se suivent dans le même mouvement, avec la continuité d’un interlocuteur unique.</p></div>
        </div>
      </section>

      <section className="bg-ivory py-20 sm:py-28">
        <div className="page-shell grid gap-12 border-y border-night/15 py-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div><p className="eyebrow text-brass">La maison</p><h2 className="section-title mt-5">Votre prochain<br /><span className="italic">rendez-vous.</span></h2></div>
          <div className="grid gap-8 sm:grid-cols-2 lg:justify-self-end">
            <address className="not-italic text-sm font-light leading-7 text-night/65"><span className="eyebrow mb-3 block text-night">Adresse</span>Ruelle du Midi 12<br />1207 Genève, Suisse</address>
            <div className="text-sm font-light leading-7 text-night/65"><span className="eyebrow mb-3 block text-night">Contact</span><a href="tel:+41763850340" className="hover:text-night">+41 76 385 03 40</a><br /><Link href="/contact" className="underline-offset-4 hover:underline">Écrire au salon</Link></div>
            <Link href="/reservation" className="button bg-night text-ivory sm:col-span-2">Choisir un créneau <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
