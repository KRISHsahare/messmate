import { chromium } from "@playwright/test";

/**
 * Regenerates docs/screenshots/*.png for the README.
 *
 * Run `next build && next start -p 3400` (or `npm run test:e2e:only`, which
 * starts it) first — these are production-build screenshots. Protected pages
 * are captured behind a real login, so the images show data instead of the
 * sign-in form.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3400);
const BASE = `http://127.0.0.1:${PORT}`;

/** Seeded demo credentials — see scripts/seed.mjs. */
const PASSWORD = "Messmate@123";
const ACCOUNTS = {
  student: "aarav@messmate.test",
  admin: "admin@messmate.test",
};

const VIEWPORTS = [
  { suffix: "1280", width: 1280, height: 800 },
  { suffix: "360", width: 360, height: 640 },
];

async function signIn(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(menu|admin)$/, { timeout: 20_000 });
}

/** Two mess ids for the compare shot, picked from the live directory. */
async function directoryIds(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/messes`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("article[aria-label]");

  const ids = await page
    .locator('a[href^="/messes/"]')
    .evaluateAll((links) =>
      [
        ...new Set(
          links
            .map((link) => link.getAttribute("href")?.split("/").pop())
            .filter((id) => id && id.length > 10),
        ),
      ].slice(0, 2),
    );

  await page.close();
  return ids;
}

const browser = await chromium.launch({ headless: true });

const ids = await directoryIds(browser);
const context = await browser.newContext();
const signedIn = await context.newPage();
await signIn(signedIn, ACCOUNTS.student);
await signedIn.close();

const adminContext = await browser.newContext();
const adminPage = await adminContext.newPage();
await signIn(adminPage, ACCOUNTS.admin);
await adminPage.close();

const routes = [
  { name: "messes", path: "/messes", context: null },
  {
    name: "messes_detail",
    path: ids[0] ? `/messes/${ids[0]}` : "/messes",
    context: null,
  },
  {
    name: "compare",
    path: ids.length === 2 ? `/messes/compare?ids=${ids.join(",")}` : "/messes",
    context: null,
  },
  { name: "menu", path: "/menu", context: context },
  { name: "admin_dashboard", path: "/admin", context: adminContext },
  { name: "admin_feedback", path: "/admin/feedback", context: adminContext },
  { name: "admin_reports", path: "/admin/reports", context: adminContext },
];

for (const route of routes) {
  for (const viewport of VIEWPORTS) {
    const owner = route.context ?? null;
    const page = owner
      ? await owner.newPage()
      : await browser.newPage();

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const file = `docs/screenshots/${route.name}-${viewport.suffix}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved: ${file}`);
    await page.close();
  }
}

await adminContext.close();
await context.close();
await browser.close();
