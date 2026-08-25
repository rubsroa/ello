import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";
import { serviceAdminSchema } from "@/lib/admin/validation";
import { slugify } from "@/lib/text/slug";

export async function GET() {
  try { await requireUser(["ADMIN", "STAFF"]); return NextResponse.json({ categories: await db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { services: { orderBy: { sortOrder: "asc" } } } }) }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const input = serviceAdminSchema.parse(await request.json());
    const service = await db.service.create({ data: { ...input, slug: `${slugify(input.name)}-${Date.now().toString(36)}` } });
    await db.auditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "Service", entityId: service.id } });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) { return apiError(error); }
}
