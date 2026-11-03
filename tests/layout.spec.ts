import { expect, test } from "@playwright/test";

import { ACCOUNTS, horizontalOverflow, loginAs } from "./helpers";

test.describe("phone layout (360 × 800)", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("the student screens fit without sideways scrolling", async ({ page }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);
    expect(await horizontalOverflow(page), "/menu overflows at 360px").toBeLessThanOrEqual(1);

    const bottomNav = page.getByRole("navigation", { name: "Primary" });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Messes" })).toBeVisible();

    await page.goto("/my-feedback");
    expect(
      await horizontalOverflow(page),
      "/my-feedback overflows at 360px",
    ).toBeLessThanOrEqual(1);

    await page.goto("/report");
    expect(await horizontalOverflow(page), "/report overflows at 360px").toBeLessThanOrEqual(1);
  });

  test("the admin tables switch to cards and stay inside the viewport", async ({
    page,
  }) => {
    await loginAs(page, ACCOUNTS.admin, /\/admin$/);
    expect(await horizontalOverflow(page), "/admin overflows at 360px").toBeLessThanOrEqual(1);

    // The desktop feedback table is hidden on phones; the card list takes over.
    await page.goto("/admin/feedback");
    await expect(page.locator("table").first()).toBeHidden();
    expect(
      await horizontalOverflow(page),
      "/admin/feedback overflows at 360px",
    ).toBeLessThanOrEqual(1);
  });

  test("the public directory works signed out on a phone", async ({ page }) => {
    await page.goto("/messes");
    await expect(
      page.getByRole("heading", { name: "Messes around you" }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(4);
    expect(await horizontalOverflow(page), "/messes overflows at 360px").toBeLessThanOrEqual(1);
  });
});

test.describe("laptop layout (1280 × 900)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("desktop navigation is visible and the bottom bar is not", async ({
    page,
  }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);

    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
