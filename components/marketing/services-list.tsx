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
  return (
    <>
      <InnerHero eyebrow={isFemale ? "Elle" : "Lui"} title={isFemale ? "Coupe, couleur & soin" : "Coupe, barbe & soin"} intro={isFemale ? "Des techniques précises, choisies après un vrai diagnostic de votre cheveu, de vos envies et de votre rythme." : "Des coupes nettes et vivantes, une barbe structurée sans rigidité, et des conseils simples à tenir chez soi."} />
      <section className="bg-ivory py-16 sm:py-24">
        <div className="page-shell">
          <div className="divide-y divide-night/15 border-y border-night/15">
            {category?.services.map((service) => (
              <article key={service.id} className="grid gap-3 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
                <div>
                  <h2 className="font-display text-2xl font-light tracking-[-.02em] sm:text-3xl">{service.name}</h2>
                  {service.description && <p className="mt-2 max-w-2xl text-sm font-light leading-6 text-night/65">{service.description}</p>}
                  <p className="mt-3 flex items-center gap-2 text-xs font-normal uppercase tracking-[.13em] text-night/50"><Clock3 size={14} aria-hidden="true" /> {service.durationMinutes} min</p>
                </div>
                <div className="flex items-center justify-between gap-8 sm:justify-end">
                  <p className="font-display text-xl font-light">{formatChf(service.priceCents)}</p>
                  <Link href={`/reservation?service=${service.id}`} className="inline-flex items-center gap-2 text-xs font-normal uppercase tracking-[.14em] underline-offset-4 hover:underline">Choisir <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
          {!category?.services.length && <p>Aucune prestation n’est actuellement disponible.</p>}
        </div>
      </section>
    </>
  );
}
