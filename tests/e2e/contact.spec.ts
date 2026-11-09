import { expect, test } from "@playwright/test";

test.describe("trang liên hệ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lien-he", { waitUntil: "domcontentloaded" });
  });

  test("hiển thị form đầy đủ và cho phép nhập dữ liệu", async ({ page }) => {
    const form = page.getByRole("form", { name: "Biểu mẫu liên hệ Mộc Farm" });

    await expect(form).toBeVisible();
    await form.getByLabel("Họ và tên của bạn").fill("Nguyễn Văn An");
    await form.getByLabel("Số điện thoại liên hệ").fill("0912 345 678");
    await form.getByLabel("Địa chỉ email").fill("an@example.com");
    await form.getByLabel("Chủ đề bạn quan tâm").selectOption("tham-quan-nong-trai");
    await form.getByLabel("Nội dung tin nhắn").fill("Tôi muốn đặt lịch tham quan nông trại.");

    await expect(form.getByLabel("Họ và tên của bạn")).toHaveValue("Nguyễn Văn An");
    await expect(form.getByLabel("Chủ đề bạn quan tâm")).toHaveValue("tham-quan-nong-trai");
    await expect(form.getByRole("button", { name: "Gửi thông tin liên hệ" })).toBeEnabled();
  });

  test("hiển thị trạng thái an toàn khi Turnstile bị tắt trong môi trường E2E", async ({
    page,
  }) => {
    await expect(page.getByRole("group", { name: "Xác minh bảo mật" })).toContainText(
      "Chưa cấu hình khóa xác minh bảo mật Turnstile."
    );
  });

  test("không tràn ngang trên viewport hiện tại", async ({ page }) => {
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll("body *"))
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: element.getAttribute("class") ?? "",
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width),
        }))
        .filter(({ right }) => right > document.documentElement.clientWidth + 1)
        .slice(0, 5),
    }));

    expect(
      dimensions.scrollWidth,
      `Các phần tử tràn ngang: ${JSON.stringify(dimensions.offenders)}`
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
});
