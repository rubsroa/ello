import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorization";
import { apiError } from "@/lib/http/response";
import { assertSameOrigin } from "@/lib/security/request";

const metadataSchema = z.object({ title: z.string().trim().min(2).max(150), alt: z.string().trim().min(5).max(255), audience: z.enum(["FEMALE", "MALE", "UNISEX"]).default("UNISEX") });
export async function POST(request: Request) {
  try { assertSameOrigin(request); const user = await requireUser(["ADMIN"]); const form = await request.formData(); const input = metadataSchema.parse({ title: form.get("title"), alt: form.get("alt"), audience: form.get("audience") }); const image = form.get("image"); if (!(image instanceof File)) return NextResponse.json({ error: "Image requise" }, { status: 400 }); const max = Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880); if (image.size > max) return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 }); const buffer = Buffer.from(await image.arrayBuffer()); const detected = await fileTypeFromBuffer(buffer); if (!detected || !["image/jpeg", "image/png", "image/webp"].includes(detected.mime)) return NextResponse.json({ error: "Format d’image refusé" }, { status: 415 }); const directory = path.join(process.cwd(), "public", "uploads"); await mkdir(directory, { recursive: true }); const fileName = `${randomUUID()}.${detected.ext}`; await writeFile(path.join(directory, fileName), buffer, { flag: "wx", mode: 0o640 }); const item = await db.galleryItem.create({ data: { ...input, imageUrl: `/uploads/${fileName}` } }); await db.auditLog.create({ data: { userId: user.id, action: "UPLOAD", entityType: "GalleryItem", entityId: item.id } }); return NextResponse.json({ item }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
