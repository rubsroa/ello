import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { ContactRequestManager } from "@/components/admin/contact-request-manager";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  await requireUser(["ADMIN"]);
  const requests = await db.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <><p className="eyebrow text-brass">Contact</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Messages</h1><ContactRequestManager initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))} /></>;
}
