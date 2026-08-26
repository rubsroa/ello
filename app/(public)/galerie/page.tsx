import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db/client";
import { InnerHero } from "@/components/marketing/inner-hero";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Galerie", description: "Découvrez les coupes, couleurs et l’univers du salon ell’o à Genève.", alternates: { canonical: "/galerie" } };

const editorialItems = [
  { src: "/media/elle-blonde.webp", alt: "Chevelure blonde en mouvement", title: "Lumière", ratio: "aspect-[4/5]" },
  { src: "/media/lui-close.webp", alt: "Portrait homme, coupe courte et barbe", title: "Précision", ratio: "aspect-[3/2]" },
  { src: "/media/elle-curls.webp", alt: "Boucles brunes structurées", title: "Texture", ratio: "aspect-[4/5]" },
  { src: "/media/lui-long.webp", alt: "Cheveux longs homme en noir et blanc", title: "Mouvement", ratio: "aspect-[3/2]" },
  { src: "/media/elle-editorial.webp", alt: "Coiffure femme longue éditoriale", title: "Nuance", ratio: "aspect-[3/2]" },
  { src: "/media/lui-bw.webp", alt: "Coupe homme courte en noir et blanc", title: "Ligne", ratio: "aspect-[4/5]" },
  { src: "/media/elle-motion.webp", alt: "Coiffure blonde aérienne", title: "Souffle", ratio: "aspect-[3/2]" },
  { src: "/media/lui-curls.webp", alt: "Coupe homme bouclée et texturée", title: "Volume", ratio: "aspect-[3/2]" },
  { src: "/media/lui-desert.webp", alt: "Portrait homme aux cheveux plaqués", title: "Allure", ratio: "aspect-[4/5]" },
] as const;

export default async function GalleryPage() {
  const items = await db.galleryItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  const gallery = [...editorialItems, ...items.map((item) => ({ src: item.imageUrl, alt: item.alt, title: item.title, ratio: "aspect-[4/5]" as const }))];
  return (
    <>
      <InnerHero eyebrow="Galerie" title="Matières & mouvements" intro="Cheveux, lumière, lignes et textures : un carnet visuel du regard ell’o." imageSrc="/media/elle-motion.webp" imageAlt="Chevelure blonde en mouvement" />
      <section className="bg-ivory pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="page-shell grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) => (
            <figure key={`${item.src}-${index}`} className={index % 3 === 1 ? "lg:mt-20" : ""}>
              <div className={`relative overflow-hidden bg-night/10 ${item.ratio}`}><Image src={item.src} alt={item.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 hover:scale-[1.02]" /></div>
              <figcaption className="mt-4 flex items-center justify-between border-b border-night/15 pb-3 text-[.62rem] font-normal uppercase tracking-[.17em] text-night/55"><span>{item.title}</span><span>{String(index + 1).padStart(2, "0")}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="page-shell mt-20 sm:mt-28"><div className="relative aspect-video overflow-hidden bg-night"><video autoPlay loop muted playsInline preload="metadata" aria-hidden="true" className="h-full w-full object-cover opacity-80"><source src="/media/elle-motion.mp4" type="video/mp4" /></video><div className="absolute inset-0 bg-gradient-to-t from-night/65 to-transparent" /><p className="eyebrow absolute bottom-6 left-6 text-ivory sm:bottom-10 sm:left-10">Le mouvement comme signature</p></div></div>
      </section>
    </>
  );
}
