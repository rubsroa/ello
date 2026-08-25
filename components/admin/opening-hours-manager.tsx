"use client";

import { useState } from "react";

type Day = { weekday: number; closed: boolean; opensAtMinutes: number; closesAtMinutes: number };
const labels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const order = [1, 2, 3, 4, 5, 6, 0];
const asTime = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
const asMinutes = (value: string) => { const [hours = 0, minutes = 0] = value.split(":").map(Number); return hours * 60 + minutes; };

export function OpeningHoursManager({ initialDays }: { initialDays: Day[] }) {
  const [days, setDays] = useState(initialDays);
  const [message, setMessage] = useState("");
  const update = (weekday: number, patch: Partial<Day>) => setDays((current) => current.map((day) => day.weekday === weekday ? { ...day, ...patch } : day));
  async function save() {
    const response = await fetch("/api/admin/opening-hours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days }) });
    const body = await response.json() as { error?: string };
    setMessage(response.ok ? "Horaires du salon enregistrés" : body.error ?? "Enregistrement impossible");
  }
  return <section className="mt-8 max-w-3xl"><p className="eyebrow text-brass">Accueil du public</p><h2 className="mt-3 font-display text-3xl font-light">Horaires du salon</h2><div className="mt-4 space-y-2 bg-white p-5">{order.map((weekday) => { const day = days.find((item) => item.weekday === weekday)!; return <div key={weekday} className="grid grid-cols-[7rem_6rem_1fr_1fr] items-center gap-3 border-b border-night/8 py-2"><span className="text-sm">{labels[weekday]}</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!day.closed} onChange={(event) => update(weekday, { closed: !event.target.checked })} />Ouvert</label><input aria-label={`Ouverture ${labels[weekday]}`} type="time" disabled={day.closed} value={asTime(day.opensAtMinutes)} onChange={(event) => update(weekday, { opensAtMinutes: asMinutes(event.target.value) })} className="min-w-0 border border-night/15 p-2" /><input aria-label={`Fermeture ${labels[weekday]}`} type="time" disabled={day.closed} value={asTime(day.closesAtMinutes)} onChange={(event) => update(weekday, { closesAtMinutes: asMinutes(event.target.value) })} className="min-w-0 border border-night/15 p-2" /></div>; })}<button type="button" onClick={() => void save()} className="mt-3 bg-night px-4 py-2 text-sm text-ivory">Enregistrer les horaires</button>{message && <p role="status" className="text-sm">{message}</p>}</div></section>;
}
