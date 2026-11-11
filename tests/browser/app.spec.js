import { test, expect } from "@playwright/test";
const key = "wordle-tw-v1";
async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#message")).not.toContainText("正在載入");
}
async function stored(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
}
async function enter(page, word) {
  await page.locator("h2#game-title").click();
  await page.keyboard.type(word);
  await page.keyboard.press("Enter");
}
test("桌面開始、錯誤提示與每日進度恢復", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".tile")).toHaveCount(30);
  await page.locator('[data-key="A"]').click();
  await page.keyboard.type("B");
  await page.keyboard.press("Enter");
  await expect(page.locator("#message")).toContainText("五個");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await enter(page, "ZZZZZ");
  await expect(page.locator("#message")).toContainText("找不到");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Backspace");
  await enter(page, "CRANE");
  await expect(
    page.locator("#board .correct,#board .present,#board .absent"),
  ).toHaveCount(5);
  await page.reload();
  await expect(
    page.locator("#board .correct,#board .present,#board .absent"),
  ).toHaveCount(5);
});
test("每日勝利只能記錄一次、分享無答案", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await ready(page);
  const d = await stored(page),
    g = Object.values(d.daily)[0];
  await enter(page, g.answer);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.locator("#message")).toContainText("太棒了");
  await page.locator("#share").click();
  const share = await page.evaluate(() => navigator.clipboard.readText());
  expect(share).not.toContain(g.answer);
  expect(share).toContain("1/6");
  await page.reload();
  await expect(page.locator("#share")).toBeVisible();
  await page.keyboard.type("APPLE");
  await page.keyboard.press("Enter");
  expect((await stored(page)).records).toHaveLength(1);
  expect(
    (await stored(page)).daily[Object.keys(d.daily)[0]].guesses,
  ).toHaveLength(1);
});
test("動畫連續送出與快速模式切換", async ({ page }) => {
  await ready(page);
  await enter(page, "CRANE");
  for (let i = 0; i < 8; i++) await page.keyboard.press("Enter");
  await page.locator("#practice").click();
  await page.locator("#daily").click();
  await page.locator("#practice").click();
  await expect(page.locator("#game-title")).toContainText("下一個");
  await page.waitForTimeout(1000);
  expect(Object.values((await stored(page)).daily)[0].guesses).toHaveLength(1);
  expect((await stored(page)).practice.guesses).toHaveLength(0);
  await page.locator('[data-key="A"]').evaluate((b) => {
    for (let i = 0; i < 20; i++) b.click();
  });
  expect((await stored(page)).practice.input).toBe("AAAAA");
});
test("練習再玩、統計分開、設定保留", async ({ page }) => {
  await ready(page);
  await page.locator("#practice").click();
  const before = (await stored(page)).practice;
  await enter(page, before.answer);
  await expect(page.locator("#restart")).toBeVisible();
  await page.locator("#restart").click();
  expect((await stored(page)).practice.answer).not.toBe(before.answer);
  await page.locator("#settings").click();
  await page.locator("#theme").selectOption("dark");
  await page.locator("#contrast").check();
  await page.locator("#animation").uncheck();
  await page.locator("#physicalKeyboard").uncheck();
  await page.locator("#close-modal").click();
  await page.keyboard.type("APPLE");
  expect((await stored(page)).practice.input).toBe("");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveClass(/high-contrast/);
  await page.locator("#stats").click();
  await expect(page.locator("#modal-content")).toContainText("合計 1 場");
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).not.toBeVisible();
});
test("損壞與不可用儲存不崩潰", async ({ page }) => {
  await page.addInitScript((k) => localStorage.setItem(k, "{broken"), key);
  await ready(page);
  await expect(page.locator("#message")).toContainText("復原");
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error("denied");
    };
    Storage.prototype.setItem = () => {
      throw Error("denied");
    };
  });
  await page.reload();
  await expect(page.locator("#message")).toContainText("儲存");
  await enter(page, "CRANE");
  await expect(
    page.locator("#board .correct,#board .present,#board .absent"),
  ).toHaveCount(5);
});
test("台灣午夜自動換題", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-11T15:59:58Z") });
  await ready(page);
  await page.keyboard.type("AP");
  await expect(page.locator("#date")).toContainText("2026 / 11 / 11");
  await page.clock.fastForward(3000);
  await expect(page.locator("#date")).toContainText("2026 / 11 / 12");
  await expect(page.locator("#board")).toHaveText("");
  expect(Object.keys((await stored(page)).daily)).toHaveLength(2);
});
for (const width of [320, 375, 390, 768, 1280])
  test(`響應式 ${width}px、無水平溢出、鍵盤完整`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("#keyboard button")).toHaveCount(28);
    const box = await page.locator("#keyboard").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
test("子路徑靜態部署相容", async ({ page }) => {
  await page.route("**/wordle-game/**", async (route) => {
    const u = new URL(route.request().url());
    const response = await route.fetch({
      url: u.origin + u.pathname.replace("/wordle-game", ""),
    });
    await route.fulfill({ response });
  });
  await page.goto("/wordle-game/");
  await expect(page.locator(".tile")).toHaveCount(30);
  await expect(page.locator("#message")).toContainText("準備好了");
});
