"use client";
import { useRouter } from "next/navigation";
export function CustomerActions({ id }: { id: string }) { const router = useRouter(); return <button type="button" className="text-xs text-red-800 underline" onClick={async () => { if (!window.confirm("Anonymiser ce client ? Cette action est irréversible.")) return; const response = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" }); if (response.ok) router.refresh(); }}>Anonymiser</button>; }
