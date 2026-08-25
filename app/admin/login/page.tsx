import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Connexion équipe", robots: { index: false, follow: false } };
export default function AdminLoginPage() {
  return <main id="main-content" className="grid min-h-screen place-items-center bg-night px-4 py-12"><div className="w-full max-w-md bg-ivory p-8 sm:p-10"><Link href="/" className="font-display text-4xl font-extralight tracking-[-.05em]">ell’o</Link><p className="eyebrow mt-3 text-brass">Espace équipe</p><h1 className="mt-8 font-display text-4xl font-light tracking-[-.04em]">Bienvenue.</h1><p className="mt-3 text-sm font-light text-night/60">Connectez-vous pour accéder au planning et à l’administration.</p><LoginForm /></div></main>;
}
