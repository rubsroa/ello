import { PrismaClient, type Audience, type DepositMode } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const db = new PrismaClient();

const categories = [
  { slug: "elle", name: "Elle", audience: "FEMALE" as Audience, sortOrder: 1 },
  { slug: "lui", name: "Lui", audience: "MALE" as Audience, sortOrder: 2 },
];

const services = [
  ["elle", "coupe-femme", "Coupe", "Une coupe adaptée à la matière et au mouvement naturel.", 45, 7_000],
  ["elle", "coupe-brushing", "Coupe + brushing", "Diagnostic, coupe et mise en forme.", 75, 9_500],
  ["elle", "brushing", "Brushing", "Mise en forme et finition brillante.", 45, 5_500],
  ["elle", "coloration", "Coloration", "Coloration racines et soin protecteur.", 90, 10_500],
  ["elle", "coloration-coupe", "Coloration + coupe", "Couleur, coupe et coiffage complet.", 135, 15_500],
  ["elle", "balayage", "Balayage", "Éclaircissement sur mesure et patine.", 150, 18_000],
  ["elle", "meches", "Mèches", "Travail de lumière précis et personnalisé.", 150, 17_000],
  ["elle", "patine", "Patine", "Nuance, neutralise et ravive les reflets.", 45, 6_000],
  ["elle", "soin-femme", "Soin", "Protocole profond choisi selon le cheveu.", 30, 4_000],
  ["elle", "coiffure-evenementielle", "Coiffure événementielle", "Attache ou coiffure construite sur consultation.", 90, 12_000],
  ["lui", "coupe-homme", "Coupe homme", "Coupe aux ciseaux ou mixte et coiffage.", 45, 5_500],
  ["lui", "coupe-tondeuse", "Coupe tondeuse", "Coupe uniforme et finitions précises.", 30, 3_800],
  ["lui", "coupe-barbe", "Coupe + barbe", "Coupe, taille de barbe et contours.", 60, 7_500],
  ["lui", "barbe", "Barbe", "Taille, contours et soin.", 30, 3_500],
  ["lui", "contour", "Contour", "Rafraîchissement des contours et de la nuque.", 15, 2_000],
  ["lui", "soin-homme", "Soin", "Soin du cuir chevelu et massage.", 30, 3_500],
  ["lui", "coloration-homme", "Coloration homme", "Couverture naturelle et discrète.", 60, 6_500],
] as const;

const staffMembers = [
  { slug: "elena", firstName: "Elena", lastName: "Rossi", title: "Fondatrice · Coloriste", bio: "Coupe intuitive, balayage et couleurs lumineuses.", sortOrder: 1 },
  { slug: "nora", firstName: "Nora", lastName: "Berset", title: "Styliste", bio: "Coupes, textures et coiffures événementielles.", sortOrder: 2 },
  { slug: "marc", firstName: "Marc", lastName: "Silva", title: "Coiffeur · Barbier", bio: "Coupes homme, barbe et finitions contemporaines.", sortOrder: 3 },
];

async function seed() {
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 14) throw new Error("DEV_ADMIN_PASSWORD doit contenir au moins 14 caractères pour exécuter le seed");
  const adminEmail = (process.env.DEV_ADMIN_EMAIL ?? "admin@ello-coiffure.local").toLowerCase();
  await db.user.upsert({
    where: { email: adminEmail },
    update: { active: true, role: "ADMIN" },
    create: { email: adminEmail, passwordHash: await hash(adminPassword, 12), firstName: "Admin", lastName: "ell’o", role: "ADMIN" },
  });

  const categoryBySlug = new Map<string, string>();
  for (const category of categories) {
    const record = await db.serviceCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
    categoryBySlug.set(category.slug, record.id);
  }

  const serviceIds: { audience: string; id: string; durationMinutes: number; priceCents: number }[] = [];
  for (const [categorySlug, slug, name, description, durationMinutes, priceCents] of services) {
    const record = await db.service.upsert({
      where: { slug },
      update: { categoryId: categoryBySlug.get(categorySlug)!, name, description, durationMinutes, priceCents, active: true, onlineBookable: true },
      create: { categoryId: categoryBySlug.get(categorySlug)!, slug, name, description, durationMinutes, bufferAfterMinutes: 10, priceCents, depositMode: "NONE" as DepositMode },
    });
    serviceIds.push({ audience: categorySlug, id: record.id, durationMinutes: record.durationMinutes, priceCents: record.priceCents });
  }

  const staff = [];
  for (const member of staffMembers) {
    staff.push(await db.staff.upsert({ where: { slug: member.slug }, update: { ...member, active: true }, create: member }));
  }

  for (const member of staff) {
    const audiences = member.slug === "marc" ? ["lui"] : member.slug === "nora" ? ["elle", "lui"] : ["elle"];
    for (const service of serviceIds.filter((item) => audiences.includes(item.audience))) {
      await db.staffService.upsert({ where: { staffId_serviceId: { staffId: member.id, serviceId: service.id } }, update: {}, create: { staffId: member.id, serviceId: service.id } });
    }
  }

  const hours = [
    { weekday: 0, closed: true, opensAtMinutes: 0, closesAtMinutes: 0 },
    { weekday: 1, closed: true, opensAtMinutes: 0, closesAtMinutes: 0 },
    { weekday: 2, closed: false, opensAtMinutes: 9 * 60, closesAtMinutes: 18 * 60 + 30 },
    { weekday: 3, closed: false, opensAtMinutes: 9 * 60, closesAtMinutes: 18 * 60 + 30 },
    { weekday: 4, closed: false, opensAtMinutes: 10 * 60, closesAtMinutes: 20 * 60 },
    { weekday: 5, closed: false, opensAtMinutes: 9 * 60, closesAtMinutes: 18 * 60 + 30 },
    { weekday: 6, closed: false, opensAtMinutes: 9 * 60, closesAtMinutes: 17 * 60 },
  ];
  for (const day of hours) await db.openingHours.upsert({ where: { weekday: day.weekday }, update: day, create: day });

  for (const member of staff) {
    for (const day of hours.filter((item) => !item.closed)) {
      const availability = { staffId: member.id, weekday: day.weekday, startsAtMinutes: day.opensAtMinutes, endsAtMinutes: day.closesAtMinutes, breaks: [{ startMinutes: 12 * 60 + 30, endMinutes: 13 * 60 + 30 }] };
      await db.staffAvailability.upsert({ where: { staffId_weekday: { staffId: member.id, weekday: day.weekday } }, update: availability, create: availability });
    }
  }

  const demoCustomers = [
    { firstName: "Sophie", lastName: "Martin", email: "sophie.demo@example.test", phone: "+41 76 555 01 01" },
    { firstName: "Camille", lastName: "Favre", email: "camille.demo@example.test", phone: "+41 76 555 01 02" },
    { firstName: "Julien", lastName: "Meyer", email: "julien.demo@example.test", phone: "+41 76 555 01 03" },
  ];
  const openWeekdays = new Set(hours.filter((day) => !day.closed).map((day) => day.weekday));
  for (const [index, member] of staff.entries()) {
    const idempotencyKey = `seed-booking-${index + 1}`;
    if (await db.booking.findUnique({ where: { idempotencyKey } })) continue;
    const customerInput = demoCustomers[index]!;
    const customer = await db.customer.findFirst({ where: { email: customerInput.email } }) ?? await db.customer.create({ data: customerInput });
    const service = serviceIds.find((item) => item.audience === (member.slug === "marc" ? "lui" : "elle"))!;
    let candidate = addDays(new Date(), index + 1);
    while (!openWeekdays.has(new Date(`${formatInTimeZone(candidate, "Europe/Zurich", "yyyy-MM-dd")}T12:00:00Z`).getUTCDay())) candidate = addDays(candidate, 1);
    const localDate = formatInTimeZone(candidate, "Europe/Zurich", "yyyy-MM-dd");
    const startsAt = fromZonedTime(`${localDate}T${10 + index}:00:00`, "Europe/Zurich");
    const endsAt = addMinutes(startsAt, service.durationMinutes);
    const occupiedUntil = addMinutes(endsAt, 10);
    const slotStarts: Date[] = [];
    for (let slot = startsAt; slot < occupiedUntil; slot = addMinutes(slot, 5)) slotStarts.push(slot);
    await db.booking.create({ data: { reference: `ELLO-DEMO-${index + 1}`, idempotencyKey, customerId: customer.id, staffId: member.id, serviceId: service.id, startsAt, endsAt, status: "CONFIRMED", source: "ADMIN", priceCents: service.priceCents, balanceCents: service.priceCents, slots: { create: slotStarts.map((startsAt) => ({ staffId: member.id, startsAt })) }, statusHistory: { create: { toStatus: "CONFIRMED", reason: "Donnée de démonstration" } } } });
  }

  const gallery = [
    { title: "Gestuelle couleur", alt: "Coiffure de cheveux longs ondulés", imageUrl: "/images/hero-femme.jpg", audience: "FEMALE" as Audience, sortOrder: 1 },
    { title: "Coupe homme", alt: "Coiffeur réalisant une coupe homme", imageUrl: "/images/hero-homme.jpg", audience: "MALE" as Audience, sortOrder: 2 },
    { title: "Le salon", alt: "Postes et miroirs d’un salon de coiffure", imageUrl: "/images/salon.jpg", audience: "UNISEX" as Audience, sortOrder: 3 },
  ];
  for (const item of gallery) {
    const existing = await db.galleryItem.findFirst({ where: { imageUrl: item.imageUrl } });
    if (existing) await db.galleryItem.update({ where: { id: existing.id }, data: item });
    else await db.galleryItem.create({ data: item });
  }

  await db.siteSettings.upsert({ where: { key: "booking" }, update: { value: { paymentsEnabled: false, minimumNoticeMinutes: 120, maximumAdvanceDays: 90, timeZone: "Europe/Zurich" } }, create: { key: "booking", value: { paymentsEnabled: false, minimumNoticeMinutes: 120, maximumAdvanceDays: 90, timeZone: "Europe/Zurich" } } });
}

seed().then(() => console.log("Seed ell’o terminé")).finally(() => db.$disconnect());
