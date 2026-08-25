import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const createSchema = z.object({ startsAtLocal: localDateTime, endsAtLocal: localDateTime, reason: z.string().trim().max(255).optional() });
const deleteSchema = z.object({ timeOffId: z.string().cuid() });

async function authorize(staffId: string) {
  const user = await requireUser(["ADMIN", "STAFF"]);
  if (user.role === "STAFF" && user.staff?.id !== staffId) return null;
  return user;
}

export async function POST(request: Request, { params }: RouteContext<"/api/admin/staff/[id]/time-off">) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const user = await authorize(id);
    if (!user) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    const input = createSchema.parse(await request.json());
    const startsAt = fromZonedTime(input.startsAtLocal, "Europe/Zurich");
    const endsAt = fromZonedTime(input.endsAtLocal, "Europe/Zurich");
    if (endsAt <= startsAt) return NextResponse.json({ error: "La fin doit suivre le début" }, { status: 400 });
    const timeOff = await db.staffTimeOff.create({ data: { staffId: id, startsAt, endsAt, reason: input.reason || null } });
    await db.auditLog.create({ data: { userId: user.id, action: "TIME_OFF_CREATED", entityType: "StaffTimeOff", entityId: timeOff.id } });
    return NextResponse.json({ timeOff }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/staff/[id]/time-off">) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const user = await authorize(id);
    if (!user) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    const { timeOffId } = deleteSchema.parse(await request.json());
    const removed = await db.staffTimeOff.deleteMany({ where: { id: timeOffId, staffId: id } });
    if (!removed.count) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
    await db.auditLog.create({ data: { userId: user.id, action: "TIME_OFF_DELETED", entityType: "StaffTimeOff", entityId: timeOffId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
