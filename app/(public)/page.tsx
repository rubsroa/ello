import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { SiteIntro } from "@/components/marketing/site-intro";

const universes = [
  {
    eyebrow: "Elle",
    title: "La coupe comme signature",
    copy: "Coupes, couleurs et soins pensés autour de votre matière, de votre allure et de votre quotidien.",
    href: "/elle",
    image: "/images/hero-femme.jpg",
  },
  {
    eyebrow: "Lui",
    title: "Précision sans artifice",
    copy: "Des lignes justes, un geste précis et des finitions soignées, de la coupe à la barbe.",
    href: "/lui",
    image: "/images/hero-homme.jpg",
  },
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
      <section className="relative isolate min-h-[82svh] overflow-hidden bg-night text-ivory">
        <div className="absolute inset-0">
          <HomeHeroVideo />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,37,54,.96)_0%,rgba(14,37,54,.78)_42%,rgba(14,37,54,.24)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,37,54,.56),transparent_45%)]" />
        </div>

        <div className="page-shell relative flex min-h-[82svh] items-end pb-16 pt-36 sm:pb-20 lg:items-center lg:pb-12 lg:pt-28">
          <div className="max-w-3xl">
            <p className="eyebrow text-brass">Maison de coiffure · Genève</p>
            <h1 className="sr-only">ell’o — Coiffure femme et homme à Genève</h1>
            <p className="mt-8 max-w-xl text-pretty text-base font-light leading-7 text-ivory/82 sm:text-lg sm:leading-8">
              Un salon femme et homme au cœur de Genève, où le geste, l’écoute et le temps accordé font toute la différence.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link className="button button-light" href="/reservation">Prendre rendez-vous <ArrowRight aria-hidden="true" size={17} /></Link>
              <Link className="button button-ghost-light" href="#maison">Découvrir le salon</Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-6 hidden items-center gap-2 text-xs font-normal uppercase tracking-[.18em] text-ivory/70 lg:flex">
          <MapPin aria-hidden="true" size={15} /> Ruelle du Midi 12, Genève
        </div>
      </section>

      <section className="bg-ivory py-20 sm:py-28" aria-labelledby="univers-title">
        <div className="page-shell">
          <div className="grid gap-8 border-b border-night/15 pb-10 md:grid-cols-[1fr_1.3fr] md:items-end">
            <div>
              <p className="eyebrow text-brass">Savoir-faire</p>
              <h2 id="univers-title" className="section-title mt-4 text-night">Deux univers,<span className="block italic">une même exigence.</span></h2>
            </div>
            <p className="max-w-xl text-pretty font-light leading-7 text-night/70 md:justify-self-end">
              Chaque rendez-vous commence par une conversation. Nous adaptons le diagnostic, la technique et l’entretien à la personne — jamais à une tendance imposée.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {universes.map((universe) => (
              <Link key={universe.eyebrow} href={universe.href} className="group relative min-h-[34rem] overflow-hidden bg-night text-ivory focus-visible:outline-offset-4">
                <Image src={universe.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.025] group-focus-visible:scale-[1.025]" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                  <p className="eyebrow text-brass">{universe.eyebrow}</p>
                  <h3 className="mt-3 max-w-md font-display text-4xl font-light tracking-[-.03em] sm:text-5xl">{universe.title}</h3>
                  <p className="mt-4 max-w-md text-sm font-light leading-6 text-ivory/80 sm:text-base">{universe.copy}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-xs font-normal uppercase tracking-[.16em]">Voir les prestations <ArrowRight aria-hidden="true" size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="maison" className="bg-night py-20 text-ivory sm:py-28">
        <div className="page-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden lg:max-w-xl">
            <Image src="/images/salon.jpg" alt="Postes de coiffure et miroirs du salon" fill sizes="(min-width: 1024px) 44vw, 100vw" className="object-cover" />
          </div>
          <div className="lg:pl-10">
            <p className="eyebrow text-brass">La maison ell’o</p>
            <h2 className="section-title mt-5 max-w-2xl">Du calme, du regard,<span className="block italic">et le goût du détail.</span></h2>
            <p className="mt-8 max-w-xl text-pretty font-light leading-8 text-ivory/75">
              À deux pas du lac, ell’o accueille femmes et hommes dans un espace intime. Nos rendez-vous laissent la place au diagnostic, au conseil et à une réalisation sans précipitation.
            </p>
            <div className="mt-10 grid gap-6 border-t border-ivory/15 pt-8 text-sm sm:grid-cols-2">
              <div><p className="eyebrow text-brass">Adresse</p><address className="mt-3 not-italic font-light leading-6 text-ivory/80">Ruelle du Midi 12<br />1207 Genève, Suisse</address></div>
              <div><p className="eyebrow text-brass">Contact</p><a className="mt-3 inline-block font-light text-ivory/80 underline-offset-4 hover:underline" href="tel:+41763850340">+41 76 385 03 40</a></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
