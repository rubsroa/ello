import Image from "next/image";

export function InnerHero({ eyebrow, title, intro, imageSrc, imageAlt = "" }: { eyebrow: string; title: string; intro: string; imageSrc?: string; imageAlt?: string }) {
  return (
    <section className="overflow-hidden bg-night pt-32 text-ivory sm:pt-36">
      <div className={`page-shell grid min-h-[34rem] gap-10 pb-12 sm:pb-16 ${imageSrc ? "lg:grid-cols-[.9fr_1.1fr] lg:items-end" : "items-end"}`}>
        <div className="pb-4 lg:pb-8">
          <p className="eyebrow text-brass">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(3.7rem,8vw,8rem)] font-extralight leading-[.84] tracking-[-.06em]">{title}</h1>
          <p className="mt-7 max-w-2xl text-pretty font-light leading-8 text-ivory/65">{intro}</p>
        </div>
        {imageSrc && <div className="relative -mb-12 aspect-[4/5] overflow-hidden bg-ivory/5 sm:-mb-16 lg:ml-10 lg:aspect-[5/4]"><Image src={imageSrc} alt={imageAlt} fill sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" /></div>}
      </div>
    </section>
  );
}
