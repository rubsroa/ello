import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AuthenticationError, requireUser } from "@/lib/auth/authorization";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserOrRedirect();
  return <AdminShell user={user}>{children}</AdminShell>;
}

async function getUserOrRedirect() {
  try { return await requireUser(["ADMIN", "STAFF"]); }
  catch (error) { if (error instanceof AuthenticationError) redirect("/admin/login"); throw error; }
}
