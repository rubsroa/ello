import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { SiteIntro } from "@/components/marketing/site-intro";

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

      <section className="home-single-page relative isolate h-svh overflow-hidden bg-night text-ivory">
        <div className="absolute inset-0">
          <HomeHeroVideo />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,37,54,.95)_0%,rgba(14,37,54,.72)_43%,rgba(14,37,54,.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,37,54,.72),transparent_58%)]" />
        </div>
        <div className="home-hero-frame page-shell relative flex h-svh items-end overflow-hidden pb-12 pt-36 sm:pb-16 lg:pb-14">
          <div className="w-full">
            <div className="home-hero-grid grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <p className="eyebrow text-brass">Maison de coiffure · Genève</p>
                <h1 className="home-hero-title mt-6 max-w-5xl font-display text-[clamp(4rem,10vw,9.5rem)] font-extralight leading-[.78] tracking-[-.065em]">Coiffure en<br /><span className="ml-[.32em] italic">mouvement.</span></h1>
              </div>
              <div className="home-hero-copy max-w-md lg:justify-self-end lg:pb-2">
                <p className="text-pretty text-base font-light leading-7 text-ivory/78 sm:text-lg sm:leading-8">Un salon intime, une seule main, et le temps nécessaire pour trouver la ligne juste.</p>
                <Link className="button button-light mt-7" href="/reservation">Prendre rendez-vous <ArrowRight aria-hidden="true" size={17} /></Link>
              </div>
            </div>
            <div className="home-hero-meta mt-12 flex items-end border-t border-ivory/20 pt-5 text-[.62rem] font-normal uppercase tracking-[.18em] text-ivory/60">
              <span className="inline-flex items-center gap-2"><MapPin size={14} aria-hidden="true" /> Ruelle du Midi 12</span>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
