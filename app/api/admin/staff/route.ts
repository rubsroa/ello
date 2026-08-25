import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";
import { slugify } from "@/lib/text/slug";

const schema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(3000).nullable().optional(),
  serviceIds: z.array(z.string().cuid()).min(1).max(100),
  email: z.string().trim().email().max(191).optional(),
  password: z.string().min(14).max(128).optional(),
}).refine((input) => Boolean(input.email) === Boolean(input.password), { message: "Email et mot de passe doivent être renseignés ensemble", path: ["email"] });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireUser(["ADMIN"]);
    const input = schema.parse(await request.json());
    const serviceIds = [...new Set(input.serviceIds)];
    const validServices = await db.service.count({ where: { id: { in: serviceIds }, active: true } });
    if (validServices !== serviceIds.length) return NextResponse.json({ error: "Une prestation est invalide" }, { status: 400 });
    const [sortOrder, openingHours, passwordHash] = await Promise.all([
      db.staff.aggregate({ _max: { sortOrder: true } }),
      db.openingHours.findMany({ where: { closed: false } }),
      input.password ? hash(input.password, 12) : Promise.resolve(undefined),
    ]);
    const staff = await db.$transaction(async (tx) => {
      const user = input.email && passwordHash ? await tx.user.create({ data: { email: input.email.toLowerCase(), passwordHash, firstName: input.firstName, lastName: input.lastName, role: "STAFF" } }) : null;
      const created = await tx.staff.create({ data: { userId: user?.id, slug: `${slugify(`${input.firstName}-${input.lastName}`)}-${Date.now().toString(36)}`, firstName: input.firstName, lastName: input.lastName, title: input.title, bio: input.bio, sortOrder: (sortOrder._max.sortOrder ?? 0) + 1, services: { create: serviceIds.map((serviceId) => ({ serviceId })) }, availabilities: { create: openingHours.map((day) => ({ weekday: day.weekday, active: true, startsAtMinutes: day.opensAtMinutes, endsAtMinutes: day.closesAtMinutes, breaks: day.breaks ?? undefined })) } } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "CREATE", entityType: "Staff", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
