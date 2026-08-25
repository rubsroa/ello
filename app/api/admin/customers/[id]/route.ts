import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/customers/[id]">) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const { id } = await params; await db.customer.update({ where: { id }, data: { firstName: "Client", lastName: "supprimé", email: `deleted-${id}@invalid.local`, phone: "SUPPRIMÉ", notes: null, marketingConsent: false, consentedAt: null, anonymizedAt: new Date() } }); await db.auditLog.create({ data: { userId: user.id, action: "ANONYMIZE", entityType: "Customer", entityId: id } }); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
