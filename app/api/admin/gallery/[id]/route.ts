import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/gallery/[id]">) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const { id } = await params; const item = await db.galleryItem.delete({ where: { id } }); if (item.imageUrl.startsWith("/uploads/")) { const fileName = path.basename(item.imageUrl); await unlink(path.join(process.cwd(), "public", "uploads", fileName)).catch(() => undefined); } await db.auditLog.create({ data: { userId: user.id, action: "DELETE", entityType: "GalleryItem", entityId: id } }); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
