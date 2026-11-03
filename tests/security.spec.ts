import { expect, test } from "@playwright/test";

import { ACCOUNTS, PASSWORD, loginAs } from "./helpers";

const PROTECTED = ["/menu", "/my-feedback", "/report", "/admin", "/admin/reports"];

test.describe("access control", () => {
  test("anonymous visitors are bounced from every private route", async ({
    page,
  }) => {
    for (const path of PROTECTED) {
      await page.goto(path);
      await expect(page, `${path} should require a login`).toHaveURL(/\/login/);
    }
  });

  test("a student cannot open the admin console or its sub-pages", async ({
    page,
  }) => {
    await loginAs(page, ACCOUNTS.sunrise, /\/menu$/);

    for (const path of ["/admin", "/admin/menu", "/admin/feedback", "/admin/reports"]) {
      await page.goto(path);
      await expect(page, `${path} must not render for a student`).toHaveURL(
        /\/menu$/,
      );
      await expect(page.getByText("Admin console")).toHaveCount(0);
    }
  });

  test("no page leaks a password or a server key", async ({ page }) => {
    await page.goto("/login");
    const loginHtml = await page.content();

    expect(loginHtml).not.toContain(PASSWORD);
    expect(loginHtml).not.toContain("service_role");
    expect(loginHtml).not.toContain("encrypted_password");

    await loginAs(page, ACCOUNTS.admin, /\/admin$/);

    for (const path of ["/admin", "/admin/feedback", "/admin/reports"]) {
      await page.goto(path);
      const html = await page.content();
      expect(html, `${path} must not expose the seed password`).not.toContain(
        PASSWORD,
      );
      expect(html, `${path} must not expose auth internals`).not.toContain(
        "encrypted_password",
      );
    }
  });
});
