import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ivory/12 bg-night py-12 text-ivory">
      <div className="page-shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="font-display text-4xl font-extralight tracking-[-.05em]">ell’o</p><p className="mt-2 text-[.6rem] font-normal uppercase tracking-[.24em] text-ivory/60">Coiffure · Genève</p></div>
        <div className="text-sm font-light leading-6 text-ivory/72"><p className="eyebrow mb-3 text-brass">Nous trouver</p><p>Ruelle du Midi 12<br />1207 Genève, Suisse</p></div>
        <div className="text-sm font-light leading-6 text-ivory/72"><p className="eyebrow mb-3 text-brass">Contact</p><a href="tel:+41763850340" className="hover:text-ivory">+41 76 385 03 40</a></div>
        <div className="flex flex-col items-start gap-2 text-sm font-light text-ivory/72 lg:items-end"><Link href="/contact" className="hover:text-ivory">Contact</Link><Link href="/confidentialite" className="hover:text-ivory">Confidentialité</Link><Link href="/admin" className="hover:text-ivory">Espace équipe</Link></div>
      </div>
      <div className="page-shell mt-12 border-t border-ivory/12 pt-6 text-[.62rem] font-normal uppercase tracking-[.14em] text-ivory/45">© {new Date().getFullYear()} ell’o · Tous droits réservés</div>
    </footer>
  );
}
