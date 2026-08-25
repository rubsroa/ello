"use client";

import { useState } from "react";
import { format } from "date-fns";
import { frCH } from "date-fns/locale";

type RequestItem = { id: string; name: string; email: string; phone: string | null; message: string; status: "NEW" | "IN_PROGRESS" | "CLOSED"; createdAt: string };

export function ContactRequestManager({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState("");
  async function update(id: string, status: RequestItem["status"]) {
    const response = await fetch(`/api/admin/contact-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) { setRequests((current) => current.map((item) => item.id === id ? { ...item, status } : item)); setMessage("Statut enregistré"); }
    else setMessage("Modification impossible");
  }
  return <div className="mt-8 space-y-4">{message && <p role="status" className="bg-white p-3 text-sm">{message}</p>}{requests.length === 0 ? <p className="text-night/60">Aucun message.</p> : requests.map((request) => <article key={request.id} className="bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-normal">{request.name}</h2><p className="mt-1 text-xs text-night/50">{format(new Date(request.createdAt), "dd MMMM yyyy à HH:mm", { locale: frCH })}</p></div><select aria-label={`Statut du message de ${request.name}`} value={request.status} onChange={(event) => void update(request.id, event.target.value as RequestItem["status"])} className="border border-night/15 px-3 py-2 text-sm"><option value="NEW">Nouveau</option><option value="IN_PROGRESS">En cours</option><option value="CLOSED">Traité</option></select></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.message}</p><div className="mt-4 flex flex-wrap gap-4 text-xs"><a className="underline" href={`mailto:${request.email}`}>{request.email}</a>{request.phone && <a className="underline" href={`tel:${request.phone.replace(/[^+\d]/g, "")}`}>{request.phone}</a>}</div></article>)}</div>;
}
