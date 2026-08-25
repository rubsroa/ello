"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); }} className="text-xs font-normal uppercase tracking-[.14em]">Déconnexion</button>;
}
