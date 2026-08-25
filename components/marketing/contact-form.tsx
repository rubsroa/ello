"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("pending"); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Envoi impossible");
      form.reset(); setStatus("sent");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Envoi impossible"); setStatus("idle"); }
  }
  if (status === "sent") return <div className="border border-brass/40 bg-white p-8"><Check className="text-brass" /><h2 className="mt-4 font-display text-3xl font-light">Message reçu.</h2><p className="mt-3 text-night/60">Nous vous répondrons dans les meilleurs délais.</p></div>;
  return <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-normal">Nom<input required name="name" autoComplete="name" maxLength={150} className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label><label className="text-sm font-normal">E-mail<input required name="email" type="email" autoComplete="email" maxLength={191} className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label><label className="text-sm font-normal sm:col-span-2">Téléphone facultatif<input name="phone" type="tel" autoComplete="tel" maxLength={32} className="mt-2 min-h-13 w-full border border-night/20 bg-white px-4 font-light" /></label><label className="text-sm font-normal sm:col-span-2">Votre message<textarea required name="message" minLength={10} maxLength={3000} rows={6} className="mt-2 w-full border border-night/20 bg-white p-4 font-light" /></label>{error && <p role="alert" className="text-sm text-red-800 sm:col-span-2">{error}</p>}<button className="button bg-night text-ivory sm:col-span-2" disabled={status === "pending"}>{status === "pending" && <LoaderCircle className="animate-spin" size={16} />} Envoyer</button></form>;
}
