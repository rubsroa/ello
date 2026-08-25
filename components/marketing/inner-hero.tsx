export function InnerHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="bg-night pb-16 pt-36 text-ivory sm:pb-20 sm:pt-44">
      <div className="page-shell">
        <p className="eyebrow text-brass">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(3.4rem,8vw,7.5rem)] font-extralight leading-[.9] tracking-[-.05em]">{title}</h1>
        <p className="mt-7 max-w-2xl text-pretty font-light leading-8 text-ivory/72">{intro}</p>
      </div>
    </section>
  );
}
