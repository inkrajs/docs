import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  const grid = page.locator('.icon-examples__grid');
  await grid.waitFor();
  await page.waitForTimeout(500);
  assert.equal(await grid.getByRole('button').count(), 286, 'all icons, including the dedicated Markdown icon, remain accessible');
  assert(await grid.locator('canvas').count() < 160, 'cold open does not paint the entire catalog');
  await grid.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('.icon-examples__grid [data-enhanced]').length > 0);
  const first = grid.getByRole('button').first();
  const firstNode = await first.elementHandle();
  await first.focus();
  await page.keyboard.press('Enter');
  assert.equal(await first.getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Tab');
  assert(await grid.getByRole('button').nth(1).evaluate(node => node === document.activeElement));
  await page.keyboard.press('Space');
  assert.equal(await grid.getByRole('button').nth(1).getAttribute('aria-pressed'), 'true');
  await grid.focus();
  await grid.evaluate(node => { node.scrollTop = node.scrollHeight; });
  const last = grid.getByRole('button').last();
  await page.waitForFunction(() => document.querySelector('.icon-examples__grid button:last-child')?.hasAttribute('data-enhanced'));
  await last.click();
  assert.equal(await last.getAttribute('aria-pressed'), 'true');
  assert(await grid.locator('canvas').count() < 160, 'scrolling releases offscreen paint');
  assert(await firstNode.evaluate(node => node.isConnected), 'scrolling preserves native button identity');
  await first.focus();
  await page.keyboard.press('Space');
  assert(await first.evaluate(node => node === document.activeElement), 'offscreen focus survives enhancement');
  assert.equal(await first.getAttribute('aria-pressed'), 'true');
  const search = page.locator('.icon-examples__catalog input[type="search"]');
  await search.fill('gem');
  assert.equal(await grid.getByRole('button').count(), 1);
  await grid.getByRole('button').click();
  assert.equal(await grid.getByRole('button').getAttribute('aria-pressed'), 'true');
  await search.fill('');
  await grid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const node = await grid.getByRole('button').first().elementHandle();
  const canvases = await grid.locator('canvas').elementHandles();
  const seed = page.locator('.preview-controls input[maxlength="40"]');
  await seed.fill('new-preview-seed');
  assert(await node.evaluate(node => node.isConnected), 'preview edits preserve catalog nodes');
  for (const canvas of canvases) assert(await canvas.evaluate(node => node.isConnected), 'preview edits do not remount paint');
  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    assert(await grid.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'no catalog overflow');
    assert(await grid.locator('canvas').count() < 160, 'bounded paint after resize');
    await page.screenshot({ path: `/tmp/inkra-icon-performance-${width}.png` });
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await grid.getByRole('button').first().focus();
  assert.notEqual(await grid.getByRole('button').first().evaluate(node => getComputedStyle(node).outlineStyle), 'none');
  assert.deepEqual(errors, []);
  await page.close();

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => { window.IntersectionObserver = undefined; });
  await fallback.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  const fallbackButton = fallback.locator('.icon-examples__grid button').nth(40);
  await fallbackButton.click();
  assert.equal(await fallbackButton.getAttribute('aria-pressed'), 'true', 'fallback click is not lost during focus enhancement');
  console.log('PASS bounded icon paint, native identity/focus, search, scroll, resize, preview edits, forced colors and observer fallback');
} finally {
  await browser.close();
}
