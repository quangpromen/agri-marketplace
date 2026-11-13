import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("xác thực trang quản trị", () => {
  test("người dùng chưa đăng nhập truy cập /admin bị chuyển hướng về /admin/login", async ({
    page,
  }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole("heading", { name: "Đăng nhập quản trị" })
    ).toBeVisible();
  });

  test("người dùng chưa đăng nhập truy cập /admin/lien-he và /admin/lien-he/[id] bị chuyển hướng về /admin/login", async ({
    page,
  }) => {
    for (const protectedPath of [
      "/admin/lien-he",
      "/admin/lien-he/550e8400-e29b-41d4-a716-446655440000",
    ]) {
      await page.goto(protectedPath, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(
        page.getByRole("heading", { name: "Đăng nhập quản trị" })
      ).toBeVisible();
    }
  });

  test("trang đăng nhập hiển thị đầy đủ email, mật khẩu, nút đăng nhập và không có link đăng ký công khai", async ({
    page,
  }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

    const form = page.getByRole("form", {
      name: "Biểu mẫu đăng nhập quản trị Mộc Farm",
    });

    await expect(form).toBeVisible();

    const emailInput = form.getByLabel("Địa chỉ email");
    const passwordInput = form.getByLabel("Mật khẩu");
    const submitButton = form.getByRole("button", { name: "Đăng nhập quản trị" });

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    await expect(page.getByRole("link", { name: /đăng ký|tạo tài khoản|sign up|register/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /quên mật khẩu|forgot password/i })).toHaveCount(0);
  });

  test("chống open redirect với callbackUrl trỏ ra domain bên ngoài", async ({
    page,
  }) => {
    for (const externalTarget of [
      "https://evil.example/phishing",
      "//evil.example/phishing",
    ]) {
      await page.goto(
        `/admin/login?callbackUrl=${encodeURIComponent(externalTarget)}`,
        { waitUntil: "domcontentloaded" }
      );

      await expect(page).toHaveURL(/\/admin\/login/);

      const callbackHiddenInput = page.locator('input[name="callbackURL"]');
      await expect(callbackHiddenInput).toHaveValue("/admin");
    }
  });

  test("trang /admin/login đạt chuẩn accessibility cơ bản", async ({
    page,
  }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const seriousViolations = results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious"
    );

    expect(seriousViolations).toEqual([]);
  });

  test("đăng nhập và đăng xuất thật với tài khoản E2E riêng (nếu cấu hình E2E env)", async ({
    page,
  }) => {
    const e2eEmail = process.env.E2E_ADMIN_EMAIL;
    const e2ePassword = process.env.E2E_ADMIN_PASSWORD;

    test.skip(
      !e2eEmail || !e2ePassword,
      "Bỏ qua test đăng nhập thật khi chưa cấu hình E2E_ADMIN_EMAIL và E2E_ADMIN_PASSWORD."
    );

    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

    const form = page.getByRole("form", {
      name: "Biểu mẫu đăng nhập quản trị Mộc Farm",
    });

    await form.getByLabel("Địa chỉ email").fill(e2eEmail!);
    await form.getByLabel("Mật khẩu").fill(e2ePassword!);
    await form.getByRole("button", { name: "Đăng nhập quản trị" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Trang quản trị Mộc Farm" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

