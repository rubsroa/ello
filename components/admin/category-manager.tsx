"use client";

import { useState } from "react";

type Category = { id: string; name: string; audience: "FEMALE" | "MALE" | "UNISEX"; active: boolean; serviceCount: number };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), audience: form.get("audience"), active: true }) });
    if (response.ok) { const body = await response.json() as { category: Omit<Category, "serviceCount"> }; formElement.reset(); setCategories((current) => [...current, { ...body.category, serviceCount: 0 }]); setMessage("Catégorie créée"); }
    else setMessage("Création impossible");
  }

  async function save(category: Category) {
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: category.name, audience: category.audience, active: category.active }) });
    setMessage(response.ok ? "Catégorie enregistrée" : "Enregistrement impossible");
  }

  async function archive(category: Category) {
    if (!window.confirm(`Archiver ${category.name} et ses ${category.serviceCount} prestation(s) ?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (response.ok) { setCategories((current) => current.filter((item) => item.id !== category.id)); setMessage("Catégorie archivée"); }
    else setMessage("Archivage impossible");
  }

  return <section className="mt-8"><p className="eyebrow text-brass">Organisation</p><h2 className="mt-3 font-display text-3xl font-light">Catégories</h2>{message && <p role="status" className="mt-4 border border-night/10 bg-white p-3 text-sm">{message}</p>}<form onSubmit={create} className="mt-4 grid gap-3 bg-white p-4 sm:grid-cols-[1fr_12rem_auto]"><input name="name" required minLength={2} maxLength={120} placeholder="Nouvelle catégorie" className="border border-night/15 px-3 py-2" /><select name="audience" className="border border-night/15 px-3 py-2"><option value="FEMALE">Elle</option><option value="MALE">Lui</option><option value="UNISEX">Unisexe</option></select><button className="bg-night px-4 py-2 text-sm text-ivory">Ajouter la catégorie</button></form><div className="mt-3 space-y-2">{categories.map((category) => <div key={category.id} className="grid gap-3 bg-white p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-center"><input aria-label={`Nom de ${category.name}`} value={category.name} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} className="border border-night/15 px-3 py-2" /><select aria-label={`Audience de ${category.name}`} value={category.audience} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, audience: event.target.value as Category["audience"] } : item))} className="border border-night/15 px-3 py-2"><option value="FEMALE">Elle</option><option value="MALE">Lui</option><option value="UNISEX">Unisexe</option></select><div className="flex gap-2"><button type="button" onClick={() => void save(category)} className="border border-night/15 px-3 py-2 text-xs">Enregistrer</button><button type="button" onClick={() => void archive(category)} className="border border-red-200 px-3 py-2 text-xs text-red-800">Archiver</button></div></div>)}</div></section>;
}
