import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// Keep the origin identical to APP_URL: the application deliberately rejects
// state-changing requests whose Origin does not match the configured URL.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://localhost:3002";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // The desktop and mobile booking journeys deliberately target the next
  // available real slot in the same database. Serial execution keeps those
  // journeys deterministic; double-booking concurrency is covered separately.
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["line"]] : "line",
  webServer: externalBaseURL ? undefined : {
    command: "npm run dev -- -p 3002",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { APP_URL: baseURL },
  },
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: /admin\.spec\.ts/ },
    { name: "mobile-android", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec\.ts/ },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] }, testIgnore: /admin\.spec\.ts/ },
    { name: "mobile-small-webkit", use: { ...devices["iPhone SE"] }, testMatch: /responsive\.spec\.ts/ },
    { name: "mobile-android-landscape", use: { ...devices["Pixel 7 landscape"] }, testMatch: /responsive\.spec\.ts/ },
    { name: "mobile-webkit-landscape", use: { ...devices["iPhone 13 landscape"] }, testMatch: /responsive\.spec\.ts/ },
    { name: "tablet-webkit", use: { ...devices["iPad Pro 11"] }, testIgnore: /admin\.spec\.ts/ },
  ],
});
