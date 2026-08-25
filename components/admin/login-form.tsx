"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Connexion impossible");
      router.push("/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible"); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="mt-8 grid gap-5"><label className="text-sm font-normal">Adresse e-mail<input name="email" type="email" autoComplete="username" required className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label><label className="text-sm font-normal">Mot de passe<input name="password" type="password" autoComplete="current-password" required className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}<button type="submit" disabled={pending} className="button bg-night text-ivory disabled:opacity-50">{pending && <LoaderCircle className="animate-spin" size={16} />} Se connecter</button></form>;
}
