import { expect, type Page } from "@playwright/test";

/** Seeded accounts — see scripts/seed.mjs. */
export const PASSWORD = "Messmate@123";

export const ACCOUNTS = {
  admin: "admin@messmate.test",
  sunrise: "aarav@messmate.test",
  greenValley: "diya@messmate.test",
  hilltop: "kabir@messmate.test",
  hilltopSecond: "farhan@messmate.test",
} as const;

/** Fills the login form and waits until the app leaves /login. */
export async function login(page: Page, email: string, password: string = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** Log in and then assert we ended up on the expected protected route. */
export async function loginAs(page: Page, email: string, path: RegExp) {
  await login(page, email);
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(path);
}

/** A unique string so assertions never collide with seeded data. */
export function unique(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/** Horizontal overflow in CSS pixels; 0 means the layout fits the viewport. */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
}

/** Wall-clock load time for a navigation, including the server response. */
export async function loadMs(page: Page, path: string) {
  const started = Date.now();
  const response = await page.goto(path, { waitUntil: "load" });
  const elapsed = Date.now() - started;

  expect(response?.status(), `${path} should answer 200`).toBe(200);
  return elapsed;
}