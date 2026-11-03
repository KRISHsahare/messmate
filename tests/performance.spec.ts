import { expect, test } from "@playwright/test";

import { ACCOUNTS, loadMs, loginAs } from "./helpers";

/**
 * Load-time budget, measured against a production `next start` build on the
 * same machine as the database. Wall clock, not a synthetic metric, because the
 * report promises "under two seconds" to a student on the hostel Wi-Fi.
 */
test.describe("page load budget", () => {
  test("the public directory renders in under 2 seconds", async ({ page }) => {
    const ms = await loadMs(page, "/messes");
    test.info().annotations.push({ type: "load", description: `/messes ${ms} ms` });

    await expect(
      page.getByRole("heading", { name: "Messes around you" }),
    ).toBeVisible();
    expect(ms, `/messes took ${ms} ms`).toBeLessThan(2000);
  });

  test("a mess page renders in under 2 seconds", async ({ page }) => {
    await page.goto("/messes");
    const firstMess = page.getByRole("article").first().getByRole("link", {
      name: "View mess",
    });
    await firstMess.click();
    await expect(page.getByRole("heading", { name: /Today's menu/i })).toBeVisible();

    const ms = await loadMs(page, new URL(page.url()).pathname);
    test
      .info()
      .annotations.push({ type: "load", description: `mess detail ${ms} ms` });
    expect(ms, `mess detail took ${ms} ms`).toBeLessThan(2000);
  });

  test("the student menu renders in under 2 seconds after login", async ({
    page,
  }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);

    const ms = await loadMs(page, "/menu");
    test
      .info()
      .annotations.push({ type: "load", description: `/menu ${ms} ms` });

    await expect(page.getByRole("heading", { name: "Mess menu" })).toBeVisible();
    expect(ms, `/menu took ${ms} ms`).toBeLessThan(2000);
  });
});
