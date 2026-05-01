import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";

test.describe("회귀: 히스토리 대시보드", () => {
  test("기간 변경 시 팀/멤버 히스토리 표 URL과 화면이 갱신된다", async ({ page }) => {
    const adminPassword = process.env.ADMIN_PAGE_PASSWORD;
    if (!adminPassword) {
      throw new Error("ADMIN_PAGE_PASSWORD 환경변수가 설정되지 않았습니다.");
    }

    const token = createHash("sha256")
      .update(`saturday-meetup:admin:${adminPassword}`)
      .digest("hex");
    await page.context().addCookies([
      {
        name: "meetup_role_access",
        value: `admin.${token}`,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/admin/history");

    await expect(page.getByRole("heading", { level: 1, name: "팀/멤버 히스토리" })).toBeVisible();
    await expect(page.getByLabel("기간")).toHaveValue("current-quarter");

    await page.getByLabel("기간").selectOption("custom");
    await page.getByLabel("시작일").fill("2026-03-01");
    await page.getByLabel("종료일").fill("2026-03-31");
    await page.getByRole("button", { name: "적용" }).click();

    await expect(page).toHaveURL(/preset=custom/);
    await expect(page).toHaveURL(/start=2026-03-01/);
    await expect(page).toHaveURL(/end=2026-03-31/);
    await expect(page.getByText("2026-03-01부터 2026-03-31까지")).toBeVisible();

    await page.getByRole("link", { name: "멤버별" }).click();

    await expect(page).toHaveURL(/tab=member/);
    await expect(page.getByRole("link", { name: "합계" })).toBeVisible();
  });
});
