import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

const db = new PrismaClient();
const createdEmails: string[] = [];

test.afterAll(async () => {
  const customers = await db.customer.findMany({ where: { email: { in: createdEmails } }, select: { id: true } });
  const customerIds = customers.map((customer) => customer.id);
  const bookings = await db.booking.findMany({ where: { customerId: { in: customerIds } }, select: { id: true } });
  const bookingIds = bookings.map((booking) => booking.id);
  await db.bookingSlot.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.emailLog.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await db.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  await db.$disconnect();
});

test("client : visite, prestation, réservation et confirmation", async ({ page }) => {
  const email = `playwright-${randomUUID()}@example.test`;
  createdEmails.push(email);
  await page.goto("/reservation");
  await page.getByRole("button", { name: "Lui", exact: true }).click();
  await page.getByRole("button", { name: /Coupe homme/ }).click();

  const nextWednesday = nextWeekday(3);
  await page.getByLabel("Choisir une date").fill(nextWednesday);
  const slot = page.locator("button").filter({ hasText: /^\d{2}:\d{2}/ }).first();
  await expect(slot).toBeVisible();
  await slot.click();

  await page.getByLabel("Prénom").fill("Camille");
  await page.getByLabel("Nom", { exact: true }).fill("Test");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Téléphone").fill("+41 76 000 12 34");
  await page.getByRole("button", { name: "Vérifier mon rendez-vous" }).click();
  await page.getByRole("button", { name: /Confirmer le rendez-vous/ }).click();
  await expect(page.getByRole("heading", { name: "Votre rendez-vous est confirmé." })).toBeVisible();
  await expect(page.getByText(/ELLO-\d{4}-[A-F0-9]+/)).toBeVisible();
});

function nextWeekday(target: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  let delta = (target - date.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}
