import Link from "next/link";
import { CalendarDays, ContactRound, CreditCard, Images, LayoutDashboard, Mail, Scissors, Settings, UsersRound } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";

const nav = [
  ["Vue d’ensemble", "/admin", LayoutDashboard, ["ADMIN", "STAFF"]],
  ["Rendez-vous", "/admin/rendez-vous", CalendarDays, ["ADMIN", "STAFF"]],
  ["Prestations", "/admin/prestations", Scissors, ["ADMIN"]],
  ["Équipe", "/admin/equipe", UsersRound, ["ADMIN", "STAFF"]],
  ["Clients", "/admin/clients", ContactRound, ["ADMIN", "STAFF"]],
  ["Messages", "/admin/messages", Mail, ["ADMIN"]],
  ["Paiements", "/admin/paiements", CreditCard, ["ADMIN"]],
  ["Galerie", "/admin/galerie", Images, ["ADMIN"]],
  ["Réglages", "/admin/reglages", Settings, ["ADMIN"]],
] as const;

export function AdminShell({ user, children }: { user: { firstName: string; lastName: string; role: string }; children: React.ReactNode }) {
  return (
    <div data-admin className="min-h-screen bg-[#f2efe8] text-night">
      <aside className="border-b border-white/10 bg-night px-5 py-5 text-ivory lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
        <div className="flex items-center justify-between lg:block">
          <Link href="/" className="font-display text-5xl font-extralight tracking-[-.065em]">ell’o</Link>
          <span className="text-[.55rem] uppercase tracking-[.25em] text-brass lg:mt-2 lg:block">Maison · Administration</span>
        </div>
        <nav className="mt-6 flex gap-2 overflow-x-auto border-ivory/12 pb-1 lg:mt-12 lg:block lg:space-y-1 lg:border-t lg:pt-8" aria-label="Administration">
          {nav.filter(([, , , roles]) => (roles as readonly string[]).includes(user.role)).map(([label, href, Icon], index) => (
            <Link key={href} href={href} className="group flex shrink-0 items-center gap-3 border border-transparent px-3 py-3 text-sm font-light text-ivory/62 transition hover:border-ivory/15 hover:bg-white/5 hover:text-ivory">
              <span className="w-4 text-[.5rem] font-normal tracking-[.12em] text-brass/80">{String(index + 1).padStart(2, "0")}</span><Icon size={16} aria-hidden="true" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-ivory/12 pt-6 text-xs font-light text-ivory/45 lg:absolute lg:bottom-8 lg:left-7 lg:right-7 lg:block">Ruelle du Midi 12<br />1207 Genève</div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-night/10 bg-[#f2efe8]/90 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div><p className="text-sm font-normal">{user.firstName} {user.lastName}</p><p className="mt-1 text-[.55rem] uppercase tracking-[.18em] text-night/42">{user.role === "ADMIN" ? "Administrateur" : "Équipe"}</p></div>
          <LogoutButton />
        </header>
        <main id="main-content" className="mx-auto max-w-[100rem] p-5 sm:p-8 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
