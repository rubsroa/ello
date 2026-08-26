import Link from "next/link";
import { Menu } from "lucide-react";

const links = [["Le salon", "/#maison"], ["Elle", "/elle"], ["Lui", "/lui"], ["Galerie", "/galerie"]] as const;

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 text-ivory">
      <div className="page-shell flex h-24 items-center justify-between border-b border-ivory/20">
        <Link href="/" aria-label="ell’o, accueil" className="leading-none">
          <span className="block font-display text-[2.15rem] font-extralight tracking-[-.065em]">ell’o</span>
          <span className="mt-1 block text-[.53rem] font-normal uppercase tracking-[.26em] text-ivory/72">Coiffure · Genève</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href], index) => <Link key={href} href={href} className="group inline-flex items-baseline gap-2 text-[.66rem] font-normal uppercase tracking-[.17em] text-ivory/76 transition hover:text-ivory"><span className="text-[.5rem] text-brass">0{index + 1}</span>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3"><details className="group relative lg:hidden"><summary className="grid size-11 cursor-pointer list-none place-items-center border border-ivory/45 [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu"><Menu size={18} aria-hidden="true" /></summary><nav aria-label="Navigation mobile" className="absolute right-0 top-[calc(100%+.75rem)] grid w-52 border border-night/10 bg-ivory p-2 text-night shadow-xl">{links.map(([label, href]) => <Link key={href} href={href} className="flex min-h-11 items-center px-4 text-xs font-normal uppercase tracking-[.14em] hover:bg-night/5">{label}</Link>)}<Link href="/contact" className="flex min-h-11 items-center px-4 text-xs font-normal uppercase tracking-[.14em] hover:bg-night/5">Contact</Link></nav></details><Link href="/reservation" className="inline-flex min-h-11 items-center border border-ivory/45 px-3 text-[.58rem] font-normal uppercase tracking-[.14em] transition hover:border-ivory hover:bg-ivory hover:text-night sm:px-5 sm:text-[.62rem] sm:tracking-[.16em]">Réserver</Link></div>
      </div>
    </header>
  );
}
