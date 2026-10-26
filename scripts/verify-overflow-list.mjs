import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width <= 480 });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/overflow-list#preview`);
      const root = page.locator('.overflow-list-examples__toolbar').first();
      await root.waitFor();
      const itemCount = await root.locator('[data-overflow-list-item]').count();
      assert(itemCount >= 1, 'visible items render in the real row');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');

      const before = await root.locator('[data-overflow-list-item]').count();
      await chooseDocsOption(page, /Retention strategy|收纳策略/, /Keep priority|按优先级/, { exact: false, optionExact: false });
      assert.equal(await root.locator('[data-overflow-list-item]').count(), before, 'strategy changes preserve stable row rendering');

      const more = root.getByRole('button', { name: /More actions|更多操作/ });
      if (await more.count()) {
        await more.focus();
        await page.keyboard.press('Enter');
        assert((await page.getByRole('menu').count()) > 0, 'overflow uses DropdownMenu');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), await more.getAttribute('aria-label'));
      }
      await page.screenshot({ path: `/tmp/inkra-overflow-list-${width}.png`, animations: 'disabled' });
      console.log(`PASS OverflowList responsive semantics ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
