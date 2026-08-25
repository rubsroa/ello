import { requireUser } from "@/lib/auth/authorization";
import { db } from "@/lib/db/client";
import { ServiceManager } from "@/components/admin/service-manager";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";
export default async function ServicesAdminPage() {
  await requireUser(["ADMIN"]);
  const categories = await db.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, audience: true, active: true, services: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, durationMinutes: true, bufferAfterMinutes: true, priceCents: true, active: true, onlineBookable: true } } } });
  return <><p className="eyebrow text-brass">Catalogue</p><h1 className="mt-3 font-display text-4xl font-light tracking-[-.04em]">Prestations</h1><CategoryManager initialCategories={categories.map((category) => ({ id: category.id, name: category.name, audience: category.audience, active: category.active, serviceCount: category.services.length }))} /><ServiceManager initialCategories={categories} /></>;
}
