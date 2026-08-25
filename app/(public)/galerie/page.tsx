import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db/client";
import { InnerHero } from "@/components/marketing/inner-hero";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Galerie", description: "Découvrez les coupes, couleurs et l’univers du salon ell’o à Genève.", alternates: { canonical: "/galerie" } };
export default async function GalleryPage() {
  const items = await db.galleryItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return <><InnerHero eyebrow="Galerie" title="Matières & mouvements" intro="Quelques regards sur notre travail, les textures et l’atmosphère de la maison." /><section className="bg-ivory py-12 sm:py-20"><div className="page-shell columns-1 gap-5 sm:columns-2 lg:columns-3">{items.map((item) => <figure key={item.id} className="mb-5 break-inside-avoid"><div className="relative aspect-[4/5] overflow-hidden bg-night/10"><Image src={item.imageUrl} alt={item.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div><figcaption className="mt-3 text-xs font-normal uppercase tracking-[.14em] text-night/55">{item.title}</figcaption></figure>)}</div></section></>;
}
