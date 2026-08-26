import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const db = new PrismaClient();
const names: string[] = [];
const emails: string[] = [];
const categoryNames: string[] = [];
const staffFirstNames: string[] = [];

test.afterAll(async () => {
  const customers = await db.customer.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const bookings = await db.booking.findMany({ where: { customerId: { in: customers.map((customer) => customer.id) } }, select: { id: true } });
  const bookingIds = bookings.map((booking) => booking.id);
  await db.auditLog.deleteMany({ where: { entityType: "Booking", entityId: { in: bookingIds } } });
  await db.bookingSlot.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.emailLog.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await db.customer.deleteMany({ where: { id: { in: customers.map((customer) => customer.id) } } });
  await db.service.deleteMany({ where: { name: { in: names } } });
  const categories = await db.serviceCategory.findMany({ where: { name: { in: categoryNames } }, select: { id: true } });
  const categoryIds = categories.map((category) => category.id);
  await db.auditLog.deleteMany({ where: { entityType: "ServiceCategory", entityId: { in: categoryIds } } });
  await db.serviceCategory.deleteMany({ where: { id: { in: categoryIds } } });
  const staff = await db.staff.findMany({ where: { firstName: { in: staffFirstNames } }, select: { id: true } });
  const staffIds = staff.map((person) => person.id);
  await db.staffService.deleteMany({ where: { staffId: { in: staffIds } } });
  await db.staffAvailability.deleteMany({ where: { staffId: { in: staffIds } } });
  await db.auditLog.deleteMany({ where: { entityType: "Staff", entityId: { in: staffIds } } });
  await db.staff.deleteMany({ where: { id: { in: staffIds } } });
  await db.$disconnect();
});

test("admin : connexion, création de prestation et planning", async ({ page }) => {
  const name = `Test E2E ${Date.now()}`;
  names.push(name);
  await page.goto("/admin/login");
  await page.getByLabel("Adresse e-mail").fill(process.env.DEV_ADMIN_EMAIL ?? "admin@ello-coiffure.local");
  await page.getByLabel("Mot de passe").fill(process.env.DEV_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Vue d’ensemble" })).toBeVisible();

  await page.getByRole("link", { name: "Prestations" }).click();
  const categoryName = `Catégorie E2E ${Date.now()}`;
  categoryNames.push(categoryName);
  await page.getByPlaceholder("Nouvelle catégorie").fill(categoryName);
  await page.getByRole("button", { name: "Ajouter la catégorie" }).click();
  await expect(page.locator(`input[value="${categoryName}"]`)).toBeVisible();

  await page.getByPlaceholder("Nouvelle prestation").fill(name);
  await page.getByPlaceholder("Durée (min)").fill("45");
  await page.getByPlaceholder("Prix CHF").fill("80");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.locator(`input[value="${name}"]`)).toBeVisible();

  await page.getByRole("link", { name: "Équipe" }).click();
  const staffFirstName = `E2E${Date.now()}`;
  staffFirstNames.push(staffFirstName);
  await page.getByPlaceholder("Prénom").fill(staffFirstName);
  await page.getByPlaceholder("Nom", { exact: true }).fill("Testeur");
  await page.getByPlaceholder("Fonction").fill("Styliste test");
  await page.locator('form input[name="serviceIds"]').first().check();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.locator(`input[value="${staffFirstName}"]`)).toBeVisible();

  await page.getByRole("link", { name: "Réglages" }).click();
  await page.waitForURL("**/admin/reglages");
  await page.getByRole("button", { name: "Enregistrer les horaires" }).click();
  await expect(page.getByText("Horaires du salon enregistrés")).toBeVisible();

  await page.getByRole("link", { name: "Rendez-vous" }).click();
  await expect(page.getByRole("heading", { name: "Rendez-vous" })).toBeVisible();

  const email = `admin-booking-${randomUUID()}@example.test`;
  emails.push(email);
  await page.getByRole("link", { name: "Nouveau rendez-vous" }).click();
  await page.getByRole("button", { name: "Lui", exact: true }).click();
  await page.getByRole("button", { name: /Coupe homme/ }).click();
  await page.getByLabel("Choisir une date").fill(nextWeekday(3));
  const slot = page.locator("button").filter({ hasText: /^\d{2}:\d{2}/ }).first();
  await expect(slot).toBeVisible();
  await slot.click();
  await page.getByLabel("Prénom").fill("Alex");
  await page.getByLabel("Nom", { exact: true }).fill("Admin");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Téléphone").fill("+41 76 000 45 67");
  await page.getByRole("button", { name: "Vérifier mon rendez-vous" }).click();
  await page.getByRole("button", { name: /Confirmer le rendez-vous/ }).click();
  await expect(page.getByRole("heading", { name: "Votre rendez-vous est confirmé." })).toBeVisible();
});

function nextWeekday(target: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  let delta = (target - date.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}
