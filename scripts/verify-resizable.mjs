import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width <= 480 });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/resizable#preview`);
      const root = page.locator('[data-testid="resizable-playground"]');
      const separator = root.getByRole('separator');
      await separator.waitFor();

      assert.equal(await root.locator('[data-panel]').count(), 2);
      assert.equal(await separator.getAttribute('aria-orientation'), 'vertical');
      assert(await separator.getAttribute('aria-valuemin'));
      assert(await separator.getAttribute('aria-valuemax'));
      const before = Number(await separator.getAttribute('aria-valuenow'));
      await separator.focus();
      await page.keyboard.press('ArrowRight');
      const after = Number(await separator.getAttribute('aria-valuenow'));
      assert.notEqual(after, before, 'keyboard resizing updates separator value');

      const controls = page.getByRole('group', { name: '属性', exact: true });
      await controls.getByRole('tab', { name: /Interaction|交互/ }).click();
      await page.getByRole('button', { name: /Collapse navigation|折叠导航/ }).click();
      assert.equal(Number(await separator.getAttribute('aria-valuenow')), 0);
      await page.getByRole('button', { name: /Restore navigation|恢复导航/ }).click();
      assert(Number(await separator.getAttribute('aria-valuenow')) > 0);

      await controls.getByRole('tab', { name: /Layout|布局/ }).click();
      await page.getByRole('combobox', { name: /Direction|方向/ }).click();
      await page.getByRole('option', { name: /Vertical|纵向/ }).click();
      assert.equal(await separator.getAttribute('aria-orientation'), 'horizontal');

      const box = await separator.boundingBox();
      assert(box && (width <= 480 ? box.height : box.width) >= 12, 'stable separator geometry');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await page.locator('.resizable-examples .component-playground .preview-stage').screenshot({
        path: `/tmp/inkra-resizable-${width}.png`,
        animations: 'disabled',
      });
      console.log(`PASS Resizable controlled/keyboard/collapse/orientation ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
