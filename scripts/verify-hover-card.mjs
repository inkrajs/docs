import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];

try {
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 820 }, hasTouch: width < 500 });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/hover-card#preview`);
      const playground = page.locator('.component-playground').first();
      const trigger = playground.getByRole('button', { name: '查看创作人', exact: true });
      const card = page.getByRole('dialog').filter({ hasText: '林墨' });
      await trigger.waitFor();

      if (width >= 500) {
        await trigger.hover();
        await page.waitForTimeout(250);
        assert.equal(await card.count(), 0, 'open delay keeps the card closed initially');
        await card.waitFor({ state: 'visible', timeout: 1200 });
        await card.hover();
        await page.waitForTimeout(400);
        assert.equal(await card.isVisible(), true, 'content remains open while hovered');
      } else {
        await trigger.click();
        await card.waitFor({ state: 'visible' });
      }

      const box = await card.boundingBox();
      assert(box && box.x >= 0 && box.y >= 0, 'card starts within the viewport');
      assert(box && box.x + box.width <= width + 1, 'card avoids the inline viewport edge');
      assert(box && box.y + box.height <= 821, 'card avoids the block viewport edge');

      await page.keyboard.press('Escape');
      await card.waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'Escape returns focus to trigger');

      await trigger.focus();
      await card.waitFor({ state: 'visible', timeout: 1200 });
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'hover/focus opening does not steal focus');
      await page.keyboard.press('Escape');

      const interactive = page.locator('.hover-card-demo--interactive');
      await interactive.getByRole('button', { name: '查看项目说明', exact: true }).click();
      const addButton = page.getByRole('button', { name: '加入灵感板', exact: true });
      await addButton.click();
      await interactive.getByText('已加入灵感板', { exact: true }).waitFor();

      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await playground.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-hover-card-${width}.png`, animations: 'disabled' });
      console.log(`PASS HoverCard delay/hover/focus/Escape/touch/collision, ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
