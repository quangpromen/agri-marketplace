import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("nhật ký hoạt động quản trị (/admin/audit-logs)", () => {
  test("người dùng chưa đăng nhập truy cập /admin/audit-logs bị chuyển hướng về /admin/login", async ({
    page,
  }) => {
    for (const protectedUrl of [
      "/admin/audit-logs",
      "/admin/audit-logs?action=auth.login_failed&result=failure&period=7d",
    ]) {
      await page.goto(protectedUrl, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(
        page.getByRole("heading", { name: "Đăng nhập quản trị" })
      ).toBeVisible();
    }
  });

  test("giao diện /admin/audit-logs, điều hướng, bộ lọc, mobile 375px không tràn ngang và accessibility (nếu cấu hình E2E env)", async ({
    page,
  }) => {
    const e2eEmail = process.env.E2E_ADMIN_EMAIL;
    const e2ePassword = process.env.E2E_ADMIN_PASSWORD;

    test.skip(
      !e2eEmail || !e2ePassword,
      "Bỏ qua test giao diện /admin/audit-logs khi chưa cấu hình E2E_ADMIN_EMAIL và E2E_ADMIN_PASSWORD."
    );

    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    const loginForm = page.getByRole("form", {
      name: "Biểu mẫu đăng nhập quản trị Mộc Farm",
    });
    await loginForm.getByLabel("Địa chỉ email").fill(e2eEmail!);
    await loginForm.getByLabel("Mật khẩu").fill(e2ePassword!);
    await loginForm.getByRole("button", { name: "Đăng nhập quản trị" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    const auditNavLink = page.getByRole("link", {
      name: "Nhật ký hoạt động",
    });
    await expect(auditNavLink).toBeVisible();
    await auditNavLink.click();

    await expect(page).toHaveURL(/\/admin\/audit-logs$/);
    await expect(auditNavLink).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { name: "Nhật ký hoạt động" })
    ).toBeVisible();

    // Không có nút sửa hoặc xóa bản ghi audit
    await expect(
      page.getByRole("button", { name: /sửa|xóa|xoá|delete|edit/i })
    ).toHaveCount(0);

    // Kiểm tra bộ lọc bằng bàn phím / focus
    const actionSelect = page.getByLabel("Loại thao tác");
    await actionSelect.focus();
    await expect(actionSelect).toBeFocused();
    await actionSelect.selectOption("auth.login_succeeded");
    await expect(page).toHaveURL(
      /\/admin\/audit-logs\?action=auth\.login_succeeded/
    );

    // Kiểm tra responsive 375px không tràn ngang
    await page.setViewportSize({ width: 375, height: 812 });
    const overflow375 = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(overflow375).toBe(false);

    // Kiểm tra accessibility WCAG 2.1 AA (trừ color-contrast giống accessibility.spec.ts)
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const seriousViolations = results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious"
    );
    expect(seriousViolations).toEqual([]);

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
