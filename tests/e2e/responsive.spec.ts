import { expect, test } from "@playwright/test";

const publicPages = ["/", "/elle", "/lui", "/galerie", "/reservation", "/contact"];

test("accueil : une seule page plein écran", async ({ page }) => {
  await page.goto("/");
  const layout = await page.evaluate(() => ({
    footerDisplay: getComputedStyle(document.querySelector("footer")!).display,
    height: document.documentElement.scrollHeight,
    sections: document.querySelectorAll("main section").length,
    viewportHeight: window.innerHeight,
  }));
  expect(layout.sections).toBe(1);
  expect(layout.footerDisplay).toBe("none");
  expect(layout.height).toBeLessThanOrEqual(layout.viewportHeight + 1);
});

for (const path of publicPages) {
  test(`${path} : aucun débordement horizontal`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}

test("navigation mobile : cibles tactiles accessibles", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Contrôle réservé aux profils tactiles");
  await page.goto("/");
  const targets = page.locator("header a, header summary, footer a");
  const count = await targets.count();
  for (let index = 0; index < count; index += 1) {
    const box = await targets.nth(index).boundingBox();
    if (!box) continue;
    expect(box.height, `cible ${index} trop basse`).toBeGreaterThanOrEqual(44);
  }
});

test("réservation : parcours compatible avec chaque navigateur", async ({ page }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);
  const startsAt = `${date}T10:00:00.000Z`;

  await page.route("**/api/services", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        bookingPolicy: { maximumAdvanceDays: 90 },
        categories: [{
          id: "category-men",
          name: "Lui",
          audience: "MALE",
          services: [{
            id: "service-cut",
            name: "Coupe homme",
            description: null,
            durationMinutes: 45,
            priceCents: 6500,
            staff: [{ staff: { id: "staff-one", firstName: "ell’o", lastName: "Genève", title: "Coiffeur", portraitUrl: null }, customPrice: null, customDuration: null }],
          }],
        }],
      }),
    });
  });
  await page.route(/\/api\/availability(?:\?|$)/, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ slots: [{ staffId: "staff-one", staffName: "ell’o", startsAt }] }) });
  });
  await page.route("**/api/bookings", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ reference: "ELLO-TEST-CROSSBROWSER" }) });
  });

  await page.goto("/reservation");
  await page.getByRole("button", { name: "Lui", exact: true }).click();
  await page.getByRole("button", { name: /Coupe homme/ }).click();
  await page.getByLabel("Choisir une date").fill(date);
  await page.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first().click();
  await page.getByLabel("Prénom").fill("Camille");
  await page.getByLabel("Nom", { exact: true }).fill("Test");
  await page.getByLabel("E-mail").fill("cross-browser@example.test");
  await page.getByLabel("Téléphone").fill("+41 76 000 00 00");
  await page.getByRole("button", { name: "Vérifier mon rendez-vous" }).click();
  await page.getByRole("button", { name: /Confirmer le rendez-vous/ }).click();
  await expect(page.getByRole("heading", { name: "Votre rendez-vous est confirmé." })).toBeVisible();
  await expect(page.getByText("ELLO-TEST-CROSSBROWSER")).toBeVisible();
  await expect(page.getByText(/Premier disponible|Coiffeur/i)).toHaveCount(0);
});
