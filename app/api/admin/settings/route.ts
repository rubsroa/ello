import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";
const schema = z.object({ paymentsEnabled: z.boolean(), minimumNoticeMinutes: z.number().int().min(0).max(10_080), maximumAdvanceDays: z.number().int().min(1).max(365), timeZone: z.literal("Europe/Zurich") });
export async function PUT(request: Request) { try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const value = schema.parse(await request.json()); await db.siteSettings.upsert({ where: { key: "booking" }, create: { key: "booking", value }, update: { value } }); await db.auditLog.create({ data: { userId: user.id, action: "UPDATE", entityType: "SiteSettings", entityId: "booking" } }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
