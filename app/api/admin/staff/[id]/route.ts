import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const schema = z.object({ firstName: z.string().trim().min(2).max(100).optional(), lastName: z.string().trim().min(2).max(100).optional(), title: z.string().trim().min(2).max(120).optional(), bio: z.string().trim().max(3000).nullable().optional(), active: z.boolean().optional(), acceptsOnlineBooking: z.boolean().optional(), serviceIds: z.array(z.string().cuid()).max(100).optional() });
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/staff/[id]">) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const { id } = await params; const { serviceIds, ...data } = schema.parse(await request.json()); const staff = await db.$transaction(async (tx) => { const updated = await tx.staff.update({ where: { id }, data }); if (serviceIds) { const uniqueServiceIds = [...new Set(serviceIds)]; const valid = await tx.service.count({ where: { id: { in: uniqueServiceIds }, active: true } }); if (valid !== uniqueServiceIds.length) throw new z.ZodError([{ code: "custom", path: ["serviceIds"], message: "Une prestation est invalide" }]); await tx.staffService.deleteMany({ where: { staffId: id, serviceId: { notIn: uniqueServiceIds } } }); await tx.staffService.createMany({ data: uniqueServiceIds.map((serviceId) => ({ staffId: id, serviceId })), skipDuplicates: true }); } await tx.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "Staff", entityId: id } }); return updated; }); return NextResponse.json({ staff }); }
  catch (error) { return apiError(error); }
}
