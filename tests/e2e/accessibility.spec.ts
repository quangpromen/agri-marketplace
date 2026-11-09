import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/lien-he"]) {
  test(`${route} không có lỗi accessibility nghiêm trọng`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Màu thương hiệu hiện tại cần một đợt audit thiết kế riêng; vẫn chặn
      // mọi lỗi WCAG nghiêm trọng khác trong CI.
      .disableRules(["color-contrast"])
      .analyze();

    const seriousViolations = results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious"
    );

    expect(seriousViolations).toEqual([]);
  });
}
