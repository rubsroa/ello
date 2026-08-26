import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Connexion équipe", robots: { index: false, follow: false } };
export default function AdminLoginPage() {
  return <main id="main-content" className="grid min-h-screen bg-night lg:grid-cols-[1.15fr_.85fr]"><div className="relative hidden overflow-hidden lg:block"><div className="absolute inset-0 bg-[url('/media/lui-long.webp')] bg-cover bg-center grayscale" /><div className="absolute inset-0 bg-night/35" /><p className="absolute bottom-10 left-10 text-[.6rem] uppercase tracking-[.2em] text-ivory/70">ell’o · Coiffure · Genève</p></div><div className="grid place-items-center px-5 py-16"><div className="w-full max-w-md bg-ivory p-8 sm:p-12"><Link href="/" className="font-display text-6xl font-extralight tracking-[-.065em]">ell’o</Link><p className="eyebrow mt-3 text-brass">Espace équipe</p><h1 className="mt-10 font-display text-5xl font-extralight tracking-[-.05em]">Bienvenue.</h1><p className="mt-4 text-sm font-light leading-6 text-night/60">Connectez-vous pour accéder au planning et à l’administration.</p><LoginForm /></div></div></main>;
}
