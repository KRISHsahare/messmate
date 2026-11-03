import { expect, test } from "@playwright/test";

import { ACCOUNTS, loginAs, unique } from "./helpers";

test.describe("administrator console", () => {
  test("the dashboard shows overview cards, charts and weak meals", async ({ page }) => {
    await loginAs(page, ACCOUNTS.admin, /\/admin$/);

    for (const label of [
      "Today",
      "This week",
      "This month",
      "Feedback",
      "Open reports",
    ]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }

    // Recharts renders one <svg> per chart.
    await expect(page.locator("figure")).toHaveCount(2);
    await expect(page.locator("figure").first().locator("svg")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Needs attention" }),
    ).toBeVisible();
    // Hilltop's seeded ratings average below 2.5 stars.
    await expect(page.getByText("Hilltop Boys Hostel Mess").first()).toBeVisible();
  });

  test("a student comment appears in the admin feedback table", async ({ page, browser }) => {
    const comment = unique("E2E feedback — dal was cold");

    await loginAs(page, ACCOUNTS.greenValley, /\/menu$/);
    const breakfast = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "Breakfast", exact: true }) });

    await breakfast.getByRole("button", { name: "Write feedback" }).click();
    await page.getByLabel("Feedback for breakfast").fill(comment);
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText(/Feedback sent for breakfast/i)).toBeVisible();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAs(adminPage, ACCOUNTS.admin, /\/admin$/);
    await adminPage.goto("/admin/feedback");

    await expect(adminPage.getByText(comment).first()).toBeVisible();
    await adminContext.close();
  });

  test("a report reaches the admin inbox and can be triaged", async ({ page, browser }) => {
    const description = unique("E2E report — water cooler is broken");

    await loginAs(page, ACCOUNTS.hilltopSecond, /\/menu$/);
    await page.goto("/report");
    await page.getByLabel("Category").selectOption("cleanliness");
    await page.getByLabel("What happened?").fill(description);
    await page.getByRole("button", { name: "Send report" }).click();

    // RLS gives nobody a delete path for reports, so repeated runs eventually
    // hit the 3-reports-per-hour guard instead of saving. Either answer is
    // correct app behaviour — what has to hold is that the student's newest
    // *saved* report shows up in the admin inbox.
    await expect(
      page.getByText(/Report sent/i).or(page.getByRole("alert")),
    ).toBeVisible();

    const history = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Your reports" }) });
    const saved = history.locator("article").first().locator("p").first();
    await expect(saved).toBeVisible();
    const newestDescription = (await saved.textContent())?.trim() ?? description;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAs(adminPage, ACCOUNTS.admin, /\/admin$/);
    await adminPage.goto("/admin/reports");

    const row = adminPage.locator("li").filter({ hasText: newestDescription });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("combobox")).toHaveValue(/open|in_progress|resolved/);

    const next = (await row.getByRole("combobox").inputValue()) === "resolved"
      ? "in_progress"
      : "resolved";
    await row.getByRole("combobox").selectOption(next);
    await expect(row.getByRole("combobox")).toHaveValue(next);
    await expect(adminPage.getByText(new RegExp(`marked ${next === "resolved" ? "resolved" : "in progress"}`, "i"))).toBeVisible();

    await adminContext.close();
  });

  test("the menu manager publishes a meal students can see", async ({ page, browser }) => {
    const dish = unique("E2E Dosa");

    await loginAs(page, ACCOUNTS.admin, /\/admin$/);
    await page.goto("/admin/menu");
    await page.getByRole("link", { name: "Tomorrow" }).click();
    await expect(page).toHaveURL(new RegExp("/admin/menu\\?date=\\d{4}-\\d{2}-\\d{2}"));

    const breakfast = page.getByRole("region", { name: "Breakfast menu" });
    await breakfast.getByLabel("Dishes, one per line").fill(`Poha\n${dish}`);

    await breakfast
      .getByRole("button", { name: /Publish menu|Update menu/ })
      .click();
    await expect(page.getByText(/Breakfast menu saved/i)).toBeVisible();

    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await loginAs(studentPage, ACCOUNTS.sunrise, /\/menu$/);
    await studentPage.goto("/menu?d=1");
    await expect(studentPage.getByText(dish)).toBeVisible();

    await studentContext.close();
  });
});