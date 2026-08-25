"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

type ServiceItem = { id: string; name: string; durationMinutes: number; bufferAfterMinutes: number; priceCents: number; active: boolean; onlineBookable: boolean };
type Category = { id: string; name: string; services: ServiceItem[] };

export function ServiceManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [message, setMessage] = useState("");
  async function save(categoryId: string, service: ServiceItem) {
    const response = await fetch(`/api/admin/services/${service.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, name: service.name, durationMinutes: Number(service.durationMinutes), bufferAfterMinutes: Number(service.bufferAfterMinutes), priceCents: Number(service.priceCents), active: service.active, onlineBookable: service.onlineBookable }) });
    setMessage(response.ok ? "Prestation enregistrée" : "Enregistrement impossible");
  }
  async function archive(id: string) {
    if (!window.confirm("Archiver cette prestation ?")) return;
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (response.ok) setCategories(categories.map((category) => ({ ...category, services: category.services.filter((service) => service.id !== id) })));
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: form.get("categoryId"), name: form.get("name"), durationMinutes: Number(form.get("durationMinutes")), bufferAfterMinutes: 10, priceCents: Math.round(Number(form.get("price")) * 100), depositMode: "NONE", depositValue: 0, active: true, onlineBookable: true }) });
    if (response.ok) window.location.reload(); else setMessage("Création impossible");
  }
  function update(categoryId: string, id: string, field: keyof ServiceItem, value: string | boolean) { setCategories(categories.map((category) => category.id !== categoryId ? category : { ...category, services: category.services.map((service) => service.id !== id ? service : { ...service, [field]: value }) })); }
  return <div className="mt-8 space-y-10">{message && <p role="status" className="border border-brass/30 bg-white px-4 py-3 text-sm">{message}</p>}<form onSubmit={create} className="grid gap-3 bg-white p-5 sm:grid-cols-4"><select name="categoryId" required className="border border-night/15 px-3 py-2">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input name="name" required placeholder="Nouvelle prestation" className="border border-night/15 px-3 py-2" /><input name="durationMinutes" required type="number" min="15" step="15" placeholder="Durée (min)" className="border border-night/15 px-3 py-2" /><div className="flex gap-2"><input name="price" required type="number" min="0" step=".05" placeholder="Prix CHF" className="min-w-0 flex-1 border border-night/15 px-3 py-2" /><button className="grid size-11 place-items-center bg-night text-ivory" aria-label="Ajouter"><Plus size={17} /></button></div></form>{categories.map((category) => <section key={category.id}><h2 className="eyebrow mb-3 text-brass">{category.name}</h2><div className="space-y-2">{category.services.map((service) => <div key={service.id} className="grid gap-3 bg-white p-4 md:grid-cols-[1fr_7rem_7rem_auto_auto] md:items-center"><input aria-label="Nom" value={service.name} onChange={(event) => update(category.id, service.id, "name", event.target.value)} className="border border-night/12 px-3 py-2" /><label className="text-xs text-night/50">Minutes<input aria-label="Durée" type="number" value={service.durationMinutes} onChange={(event) => update(category.id, service.id, "durationMinutes", event.target.value)} className="mt-1 w-full border border-night/12 px-3 py-2 text-night" /></label><label className="text-xs text-night/50">Prix centimes<input aria-label="Prix en centimes" type="number" value={service.priceCents} onChange={(event) => update(category.id, service.id, "priceCents", event.target.value)} className="mt-1 w-full border border-night/12 px-3 py-2 text-night" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={service.onlineBookable} onChange={(event) => update(category.id, service.id, "onlineBookable", event.target.checked)} />En ligne</label><div className="flex gap-2"><button onClick={() => void save(category.id, service)} type="button" className="grid size-10 place-items-center border border-night/15" aria-label={`Enregistrer ${service.name}`}><Save size={16} /></button><button onClick={() => void archive(service.id)} type="button" className="grid size-10 place-items-center border border-red-200 text-red-800" aria-label={`Archiver ${service.name}`}><Trash2 size={16} /></button></div></div>)}</div></section>)}</div>;
}
