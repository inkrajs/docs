import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];

async function controls(page, open) {
  const toggle = page.locator('.component-playground .playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
}

try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 860 } });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), width === 1280 ? 'zh-CN' : 'en');
      await page.goto(`${baseUrl}/docs/components/virtual-list#preview`);
      const stage = page.locator('.component-playground .preview-stage');
      const list = stage.getByTestId('virtual-list-playground');
      await list.locator('.inkra-virtual-list__item').first().waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid="virtual-list-playground"]')?.getAttribute('data-virtualized') === 'true');

      const initialRows = await list.locator('.inkra-virtual-list__item').count();
      assert(initialRows > 0 && initialRows < 500, `expected a bounded virtual range, received ${initialRows}`);
      assert.equal(await list.getAttribute('role'), 'region');
      assert.equal(await list.locator('[role="list"]').count(), 1);
      assert.equal(await list.locator('[role="listitem"]').first().getAttribute('aria-setsize'), '500');
      assert.equal(await list.locator(':scope > .inkra-pencil-surface__ink').count(), 0, 'scroll element must not own the frame canvas');
      const frame = list.locator('..');
      const frameCanvas = frame.locator(':scope > .inkra-pencil-surface__ink');
      const initialFrame = await frameCanvas.boundingBox();
      assert(initialFrame, 'stationary pencil frame is present');
      const rowHeights = await list.locator('.inkra-virtual-list__item').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().height));
      assert(rowHeights.every(height => Math.abs(height - 80) < 1), 'fixed row estimate matches the visible row height');
      assert(await list.locator('.virtual-list-examples__item-copy .inkra-pencil-text').count() >= initialRows * 2, 'titles and metadata use pencil text');

      await controls(page, true);
      await page.getByRole('tab', { name: /Interaction|交互/ }).click();
      await page.getByRole('button', { name: /Item 250|第 250 项/ }).click();
      await controls(page, false);
      const middle = list.locator('[data-item-key="note-250"]');
      await middle.waitFor();
      await middle.getByRole('button').click();
      assert.equal(await middle.getByRole('button').getAttribute('aria-pressed'), 'true', 'clicked row becomes selected');
      const scrolledFrame = await frameCanvas.boundingBox();
      const viewport = await list.boundingBox();
      assert(scrolledFrame && viewport && Math.abs(scrolledFrame.y - viewport.y) < 2, 'frame does not scroll away with rows');

      await controls(page, true);
      await page.getByRole('tab', { name: /Content|内容/ }).click();
      await page.getByTestId('virtual-list-add').click();
      await list.locator('[data-item-key="new-1"]').waitFor();
      await page.getByTestId('virtual-list-remove').click();
      assert.equal(await list.locator('[data-item-key="new-1"]').count(), 0);
      await page.getByTestId('virtual-list-clear').click();
      await list.locator('[role="status"]').waitFor();
      await page.getByTestId('virtual-list-restore').click();
      await list.locator('[data-item-key="note-1"]').waitFor();

      await page.getByRole('tab', { name: /Layout|布局/ }).click();
      await page.getByRole('switch', { name: /Measure dynamic rows|测量动态高度/ }).click();
      await controls(page, false);
      assert.equal(await list.locator('.inkra-virtual-list__item').first().getAttribute('data-index') !== null, true);
      await page.waitForTimeout(150);
      const overlaps = await list.locator('.inkra-virtual-list__item').evaluateAll(rows => {
        const bounds = rows.map(row => row.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        return bounds.some((bound, index) => index > 0 && bound.top < bounds[index - 1].bottom - 1);
      });
      assert.equal(overlaps, false, 'measured rows never overlap');

      const external = page.locator('.virtual-list-examples__external-viewport');
      const externalList = external.locator('.inkra-virtual-list');
      await externalList.waitFor();
      await external.evaluate(element => {
        element.scrollTop = 1400;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await page.waitForTimeout(80);
      const externalIndexes = await externalList.locator('.inkra-virtual-list__item').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-index'))));
      assert(externalIndexes.some(index => index > 10), 'external scroll element updates the virtual range');
      const text = await page.locator('#virtual-list-panel-preview').innerText();
      assert(!/[\u3400-\u9fff][^\n]*\s\/\s[A-Za-z]/.test(text), 'no bilingual concatenations');
      if (width === 390) assert(!/[\u3400-\u9fff]/.test(text), 'English demo has no untranslated Chinese');

      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
      await stage.screenshot({ path: `/tmp/inkra-virtual-list-${width}.png`, animations: 'disabled' });
      console.log(`PASS VirtualList range/scroll/selection/data/external/mobile ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
