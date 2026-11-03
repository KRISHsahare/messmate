import { expect, test } from "@playwright/test";

import { ACCOUNTS, login, loginAs } from "./helpers";

test.describe("authentication", () => {
  test("valid credentials land the student on today's menu", async ({ page }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);

    await expect(
      page.getByRole("heading", { name: "Mess menu" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Breakfast" })).toBeVisible();
  });

  test("invalid credentials are rejected and keep the session out", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.sunrise, "definitely-not-the-password");

    await expect(page.getByRole("alert").first()).toContainText(
      "That email and password don't match our records.",
    );
    await expect(page).toHaveURL(/\/login/);

    // Still signed out: a protected route bounces straight back.
    await page.goto("/menu");
    await expect(page).toHaveURL(/\/login/);
  });

  test("the administrator lands on the admin console", async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, /\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Admin console" }),
    ).toBeVisible();
  });
});
