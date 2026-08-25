import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";
import { slugify } from "@/lib/text/slug";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  audience: z.enum(["FEMALE", "MALE", "UNISEX"]),
  active: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const input = schema.parse(await request.json());
    const sortOrder = (await db.serviceCategory.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;
    const category = await db.serviceCategory.create({
      data: { ...input, slug: `${slugify(input.name)}-${Date.now().toString(36)}`, sortOrder: sortOrder + 1 },
    });
    await db.auditLog.create({ data: { userId: user.id, action: "CREATE", entityType: "ServiceCategory", entityId: category.id } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
