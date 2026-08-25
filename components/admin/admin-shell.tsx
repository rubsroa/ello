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
  return <div className="min-h-screen bg-[#edf0f1] text-night"><aside className="border-b border-white/10 bg-night px-5 py-5 text-ivory lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between lg:block"><Link href="/" className="font-display text-3xl font-extralight tracking-[-.05em]">ell’o</Link><span className="text-[.6rem] uppercase tracking-[.18em] text-ivory/50 lg:mt-2 lg:block">Administration</span></div><nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:block lg:space-y-1" aria-label="Administration">{nav.filter(([, , , roles]) => (roles as readonly string[]).includes(user.role)).map(([label, href, Icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm font-light text-ivory/70 hover:bg-white/8 hover:text-ivory"><Icon size={17} aria-hidden="true" />{label}</Link>)}</nav></aside><div className="lg:pl-64"><header className="flex min-h-20 items-center justify-between border-b border-night/10 bg-white px-5 sm:px-8"><p className="text-sm">{user.firstName} {user.lastName} <span className="ml-2 text-xs uppercase tracking-wider text-night/40">{user.role}</span></p><LogoutButton /></header><main id="main-content" className="p-5 sm:p-8 lg:p-10">{children}</main></div></div>;
}
