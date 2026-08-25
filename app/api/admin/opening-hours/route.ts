import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const daySchema = z.object({ weekday: z.number().int().min(0).max(6), closed: z.boolean(), opensAtMinutes: z.number().int().min(0).max(1439), closesAtMinutes: z.number().int().min(0).max(1440) })
  .refine((day) => day.closed || day.closesAtMinutes > day.opensAtMinutes, { message: "La fermeture doit suivre l’ouverture" });
const schema = z.object({ days: z.array(daySchema).length(7).refine((days) => new Set(days.map((day) => day.weekday)).size === 7, "Les sept jours doivent être uniques") });

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const { days } = schema.parse(await request.json());
    await db.$transaction([
      ...days.map((day) => db.openingHours.upsert({ where: { weekday: day.weekday }, create: day, update: day })),
      db.auditLog.create({ data: { userId: user.id, action: "OPENING_HOURS_UPDATED", entityType: "OpeningHours", entityId: "salon" } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
