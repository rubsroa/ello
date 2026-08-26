import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { db } from "@/lib/db/client";
import { formatChf } from "@/lib/utils";
import { InnerHero } from "@/components/marketing/inner-hero";

export async function ServicesList({ audience }: { audience: "FEMALE" | "MALE" }) {
  const category = await db.serviceCategory.findFirst({
    where: { audience, active: true },
    include: { services: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  const isFemale = audience === "FEMALE";
  const imageSrc = isFemale ? "/media/elle-curls.webp" : "/media/lui-bw.webp";
  const videoSrc = isFemale ? "/media/elle-portrait.mp4" : "/media/lui-editorial.mp4";
  return (
    <>
      <InnerHero eyebrow={isFemale ? "Elle" : "Lui"} title={isFemale ? "Coupe, couleur & soin" : "Coupe, barbe & soin"} intro={isFemale ? "Des techniques précises, choisies après un vrai diagnostic de votre cheveu, de vos envies et de votre rythme." : "Des coupes nettes et vivantes, une barbe structurée sans rigidité, et des conseils simples à tenir chez soi."} imageSrc={imageSrc} imageAlt={isFemale ? "Chevelure brune bouclée" : "Coupe homme courte en noir et blanc"} />
      <section className="bg-ivory pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="page-shell">
          <div className="grid gap-8 border-b border-night/15 pb-10 lg:grid-cols-[.6fr_1.4fr] lg:items-end">
            <p className="eyebrow text-brass">Carte des prestations</p>
            <h2 className="font-display text-4xl font-extralight leading-[.95] tracking-[-.045em] sm:text-6xl">Le juste geste,<br /><span className="italic">au juste rythme.</span></h2>
          </div>
          <div className="divide-y divide-night/15 border-b border-night/15">
            {category?.services.map((service, index) => (
              <article key={service.id} className="group grid gap-5 py-7 transition-colors hover:bg-white/65 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-8 sm:px-4">
                <span className="hidden text-[.62rem] font-normal tracking-[.16em] text-brass sm:block">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-2xl font-light tracking-[-.02em] sm:text-3xl">{service.name}</h3>
                  {service.description && <p className="mt-2 max-w-2xl text-sm font-light leading-6 text-night/65">{service.description}</p>}
                  <p className="mt-3 flex items-center gap-2 text-xs font-normal uppercase tracking-[.13em] text-night/50"><Clock3 size={14} aria-hidden="true" /> {service.durationMinutes} min</p>
                </div>
                <div className="flex items-center justify-between gap-8 sm:justify-end">
                  <p className="font-display text-xl font-light">{formatChf(service.priceCents)}</p>
                  <Link href={`/reservation?service=${service.id}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-normal uppercase tracking-[.14em] underline-offset-4 hover:underline">Choisir <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
          {!category?.services.length && <p>Aucune prestation n’est actuellement disponible.</p>}
        </div>
      </section>
      <section className="grid min-h-[44rem] bg-night text-ivory md:grid-cols-2">
        <div className="relative min-h-[34rem] overflow-hidden"><video autoPlay loop muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-80"><source src={videoSrc} type="video/mp4" /></video></div>
        <div className="flex items-end p-8 sm:p-14 lg:p-20"><div><p className="eyebrow text-brass">Sur mesure</p><h2 className="mt-5 font-display text-5xl font-extralight leading-[.9] tracking-[-.05em] sm:text-6xl">Une coupe qui vit après le salon.</h2><p className="mt-7 max-w-lg font-light leading-8 text-ivory/65">Le conseil fait partie du rendez-vous : entretien, coiffage et rythme de retour sont pensés pour rester simples.</p><Link href="/reservation" className="button button-light mt-9">Prendre rendez-vous <ArrowRight size={15} /></Link></div></div>
      </section>
    </>
  );
}
