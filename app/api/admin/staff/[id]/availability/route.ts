import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const daySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  active: z.boolean(),
  startsAtMinutes: z.number().int().min(0).max(1439),
  endsAtMinutes: z.number().int().min(1).max(1440),
}).refine((day) => day.endsAtMinutes > day.startsAtMinutes, { message: "La fin doit suivre le début" });

const schema = z.object({ days: z.array(daySchema).length(7) });

export async function PUT(request: Request, { params }: RouteContext<"/api/admin/staff/[id]/availability">) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "STAFF"]);
    const { id } = await params;
    if (user.role === "STAFF" && user.staff?.id !== id) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    const { days } = schema.parse(await request.json());
    await db.$transaction([
      ...days.map((day) => db.staffAvailability.upsert({
        where: { staffId_weekday: { staffId: id, weekday: day.weekday } },
        create: { staffId: id, ...day },
        update: day,
      })),
      db.auditLog.create({ data: { userId: user.id, action: "AVAILABILITY_UPDATED", entityType: "Staff", entityId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
