"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StaffOption = { id: string; name: string };

export function BookingActions({
  id,
  status,
  startsAtLocal,
  staffId,
  staffOptions,
}: {
  id: string;
  status: string;
  startsAtLocal: string;
  staffId: string;
  staffOptions: StaffOption[];
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [dateTime, setDateTime] = useState(startsAtLocal);
  const [selectedStaff, setSelectedStaff] = useState(staffId);
  const [error, setError] = useState("");
  async function update(next: string) {
    if (next === "CANCELLED" && !window.confirm("Annuler ce rendez-vous ?")) return;
    const response = await fetch(`/api/admin/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (response.ok) router.refresh();
    else setError((await response.json() as { error?: string }).error ?? "Modification impossible");
  }
  async function reschedule() {
    setError("");
    const response = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAtLocal: dateTime, staffId: selectedStaff }),
    });
    if (response.ok) { setMoving(false); router.refresh(); return; }
    setError((await response.json() as { error?: string }).error ?? "Déplacement impossible");
  }
  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(status)) return null;
  const confirmed = status === "CONFIRMED";
  return <div className="min-w-64"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setMoving((value) => !value)} className="border border-night/15 px-3 py-2 text-xs">Déplacer</button>{confirmed && <button type="button" onClick={() => void update("COMPLETED")} className="border border-night/15 px-3 py-2 text-xs">Terminée</button>}{confirmed && <button type="button" onClick={() => void update("NO_SHOW")} className="border border-night/15 px-3 py-2 text-xs">No-show</button>}<button type="button" onClick={() => void update("CANCELLED")} className="border border-red-200 px-3 py-2 text-xs text-red-800">Annuler</button></div>{moving && <div className="mt-3 grid gap-2 border border-night/10 bg-ivory p-3"><label className="text-xs">Nouveau créneau<input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} className="mt-1 w-full border border-night/15 bg-white p-2" /></label><label className="text-xs">Coiffeur<select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)} className="mt-1 w-full border border-night/15 bg-white p-2">{staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></label><button type="button" onClick={() => void reschedule()} className="bg-night px-3 py-2 text-xs text-ivory">Enregistrer le déplacement</button></div>}{error && <p role="alert" className="mt-2 text-xs text-red-800">{error}</p>}</div>;
}
