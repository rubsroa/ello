"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Day = { weekday: number; active: boolean; startsAtMinutes: number; endsAtMinutes: number };
type TimeOff = { id: string; startsAtLocal: string; endsAtLocal: string; reason: string | null };
type Schedule = { id: string; name: string; days: Day[]; timeOff: TimeOff[] };

const weekdayLabels = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

function asTime(minutes: number) {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

function asMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function StaffScheduleManager({ initialSchedules }: { initialSchedules: Schedule[] }) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [message, setMessage] = useState("");
  const [absence, setAbsence] = useState({ staffId: initialSchedules[0]?.id ?? "", startsAtLocal: "", endsAtLocal: "", reason: "" });

  function updateDay(staffId: string, weekday: number, patch: Partial<Day>) {
    setSchedules((current) => current.map((schedule) => schedule.id === staffId
      ? { ...schedule, days: schedule.days.map((day) => day.weekday === weekday ? { ...day, ...patch } : day) }
      : schedule));
  }

  async function save(schedule: Schedule) {
    setMessage("");
    const response = await fetch(`/api/admin/staff/${schedule.id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: schedule.days }),
    });
    const body = await response.json() as { error?: string };
    setMessage(response.ok ? `Disponibilités de ${schedule.name} enregistrées` : body.error ?? "Enregistrement impossible");
  }

  async function addTimeOff(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/admin/staff/${absence.staffId}/time-off`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(absence),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) { setMessage(body.error ?? "Création impossible"); return; }
    setMessage("Absence ajoutée");
    setAbsence({ ...absence, startsAtLocal: "", endsAtLocal: "", reason: "" });
    router.refresh();
  }

  async function removeTimeOff(staffId: string, timeOffId: string) {
    const response = await fetch(`/api/admin/staff/${staffId}/time-off`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeOffId }),
    });
    if (response.ok) {
      setSchedules((current) => current.map((schedule) => schedule.id === staffId ? { ...schedule, timeOff: schedule.timeOff.filter((item) => item.id !== timeOffId) } : schedule));
      setMessage("Absence supprimée");
    } else setMessage("Suppression impossible");
  }

  return <section className="mt-10"><p className="eyebrow text-brass">Disponibilités</p><h2 className="mt-3 font-display text-3xl font-light">Horaires et absences</h2>{message && <p role="status" className="mt-4 border border-night/10 bg-white p-3 text-sm">{message}</p>}<div className="mt-5 space-y-5">{schedules.map((schedule) => <article key={schedule.id} className="bg-white p-5"><h3 className="text-lg font-normal">{schedule.name}</h3><div className="mt-4 overflow-x-auto"><div className="grid min-w-[680px] gap-2">{weekdayOrder.map((weekday) => { const day = schedule.days.find((item) => item.weekday === weekday)!; return <div key={weekday} className="grid grid-cols-[8rem_6rem_1fr_1fr] items-center gap-3 border-t border-night/8 pt-2"><span className="text-sm">{weekdayLabels[weekday]}</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={day.active} onChange={(event) => updateDay(schedule.id, weekday, { active: event.target.checked })} />Ouvert</label><label className="text-xs">Début<input type="time" disabled={!day.active} value={asTime(day.startsAtMinutes)} onChange={(event) => updateDay(schedule.id, weekday, { startsAtMinutes: asMinutes(event.target.value) })} className="ml-2 border border-night/15 p-2" /></label><label className="text-xs">Fin<input type="time" disabled={!day.active} value={asTime(day.endsAtMinutes)} onChange={(event) => updateDay(schedule.id, weekday, { endsAtMinutes: asMinutes(event.target.value) })} className="ml-2 border border-night/15 p-2" /></label></div>; })}</div></div><button type="button" onClick={() => void save(schedule)} className="mt-5 bg-night px-4 py-2 text-xs text-ivory">Enregistrer les horaires</button>{schedule.timeOff.length > 0 && <div className="mt-5"><p className="text-xs uppercase tracking-wider text-night/45">Absences à venir</p><ul className="mt-2 space-y-2">{schedule.timeOff.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-night/10 p-3 text-sm"><span>{item.startsAtLocal.replace("T", " ")} → {item.endsAtLocal.replace("T", " ")} {item.reason ? `· ${item.reason}` : ""}</span><button type="button" onClick={() => void removeTimeOff(schedule.id, item.id)} className="text-xs text-red-800">Supprimer</button></li>)}</ul></div>}</article>)}</div><form onSubmit={(event) => void addTimeOff(event)} className="mt-5 grid gap-4 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4"><h3 className="font-normal sm:col-span-2 xl:col-span-4">Ajouter une absence</h3><label className="text-sm">Membre<select required value={absence.staffId} onChange={(event) => setAbsence({ ...absence, staffId: event.target.value })} className="mt-2 w-full border border-night/15 p-2">{schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name}</option>)}</select></label><label className="text-sm">Début<input required type="datetime-local" value={absence.startsAtLocal} onChange={(event) => setAbsence({ ...absence, startsAtLocal: event.target.value })} className="mt-2 w-full border border-night/15 p-2" /></label><label className="text-sm">Fin<input required type="datetime-local" value={absence.endsAtLocal} onChange={(event) => setAbsence({ ...absence, endsAtLocal: event.target.value })} className="mt-2 w-full border border-night/15 p-2" /></label><label className="text-sm">Motif<input value={absence.reason} maxLength={255} onChange={(event) => setAbsence({ ...absence, reason: event.target.value })} className="mt-2 w-full border border-night/15 p-2" /></label><button className="bg-night px-4 py-3 text-sm text-ivory sm:col-span-2 xl:col-span-4">Ajouter l’absence</button></form></section>;
}
