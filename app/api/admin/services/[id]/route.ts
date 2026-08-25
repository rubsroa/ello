import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { serviceAdminSchema } from "@/lib/admin/validation";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/services/[id]">) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const { id } = await params; const input = serviceAdminSchema.partial().parse(await request.json()); const service = await db.service.update({ where: { id }, data: input }); await db.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "Service", entityId: id } }); return NextResponse.json({ service }); }
  catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/services/[id]">) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const { id } = await params; await db.service.update({ where: { id }, data: { active: false, onlineBookable: false } }); await db.auditLog.create({ data: { userId: user.id, action: "ARCHIVE", entityType: "Service", entityId: id } }); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
