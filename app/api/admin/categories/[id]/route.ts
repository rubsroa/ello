import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  audience: z.enum(["FEMALE", "MALE", "UNISEX"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { id } = await params;
    const category = await db.serviceCategory.update({ where: { id }, data: schema.parse(await request.json()) });
    await db.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "ServiceCategory", entityId: id } });
    return NextResponse.json({ category });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { id } = await params;
    await db.$transaction([
      db.serviceCategory.update({ where: { id }, data: { active: false } }),
      db.service.updateMany({ where: { categoryId: id }, data: { active: false, onlineBookable: false } }),
      db.auditLog.create({ data: { userId: user.id, action: "ARCHIVE", entityType: "ServiceCategory", entityId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
