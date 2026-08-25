import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { GalleryManager } from "@/components/admin/gallery-manager";
export const dynamic = "force-dynamic";
export default async function GalleryAdminPage() { await requireUser(["ADMIN"]); const items = await db.galleryItem.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true, imageUrl: true } }); return <><p className="eyebrow text-brass">Contenu</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Galerie</h1><GalleryManager items={items} /></>; }
