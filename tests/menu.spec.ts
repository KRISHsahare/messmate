import { expect, test, type Page } from "@playwright/test";

import { ACCOUNTS, loginAs } from "./helpers";

function mealCard(page: Page, meal: "Breakfast" | "Lunch" | "Dinner") {
  return page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: meal, exact: true }) });
}

test.describe("menu", () => {
  test("today's menu loads all three meals with dishes", async ({ page }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);

    await expect(page.locator("article")).toHaveCount(3);
    for (const meal of ["Breakfast", "Lunch", "Dinner"] as const) {
      await expect(mealCard(page, meal)).toBeVisible();
      const dishes = mealCard(page, meal).locator("ul > li");
      expect(await dishes.count()).toBeGreaterThan(1);
    }

    // The date switcher offers yesterday and tomorrow too.
    await expect(page.getByRole("link", { name: "Yesterday" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tomorrow" })).toBeVisible();
  });

  test("a rating is saved against the meal it belongs to and survives reload", async ({
    page,
  }) => {
    await loginAs(page, ACCOUNTS.hilltop, /\/menu$/);

    const lunch = mealCard(page, "Lunch");

    // Press "Rate 2 out of 5" — the component sets aria-pressed optimistically
    // and the server action persists the rating to Postgres.
    await lunch.getByRole("button", { name: "Rate 2 out of 5" }).click();

    // Wait for the server action to commit; the button's
    // aria-pressed becomes "true" once the write resolves.
    await expect(
      lunch.getByRole("button", { name: "Rate 2 out of 5" }),
    ).toHaveAttribute("aria-pressed", "true", { timeout: 8000 });

    // The rating survives a round trip to Postgres.
    await page.reload();
    const lunchAfterReload = mealCard(page, "Lunch");
    await expect(
      lunchAfterReload.getByRole("button", { name: "Rate 2 out of 5" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Other meals remain untouched.
    await expect(
      mealCard(page, "Breakfast").getByRole("button", {
        name: "Rate 2 out of 5",
      }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      mealCard(page, "Dinner").getByRole("button", { name: "Rate 2 out of 5" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});