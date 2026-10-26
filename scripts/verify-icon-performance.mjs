import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();

async function assertViewportBoundPaint(page, grid) {
  await page.waitForFunction(() => {
    const grid = document.querySelector('.icon-examples__grid');
    const box = grid.getBoundingClientRect();
    const top = grid.scrollTop + Math.max(0, -box.top) - 128;
    const bottom = grid.scrollTop + Math.min(grid.clientHeight, innerHeight - box.top) + 128;
    const nearby = box.bottom > -128 && box.top < innerHeight + 128;
    return [...grid.querySelectorAll('[data-icon-key]')].every(tile => {
      const intersects = nearby && tile.offsetTop + tile.offsetHeight > top && tile.offsetTop < bottom;
      const shouldPaint = intersects || tile === document.activeElement;
      return tile.hasAttribute('data-enhanced') === shouldPaint;
    });
  });
  const counts = await grid.evaluate(grid => {
    const tiles = [...grid.querySelectorAll('[data-icon-key]')];
    return { total: tiles.length, enhanced: tiles.filter(tile => tile.hasAttribute('data-enhanced')).length,
      painted: grid.querySelectorAll('.icon-examples__choice-content > canvas').length,
      offscreenCanvases: tiles.filter(tile => !tile.hasAttribute('data-enhanced')).reduce((sum, tile) => sum + tile.querySelectorAll('canvas').length, 0) };
  });
  assert.equal(counts.painted, counts.enhanced, 'every tile in the buffered viewport or focused tile has exactly one icon layer');
  assert.equal(counts.offscreenCanvases, 0, 'tiles outside the buffered viewport release all pencil layers');
  assert(counts.enhanced < counts.total, 'only the viewport subset is painted, not the full catalog');
}

try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  const grid = page.locator('.icon-examples__grid');
  await grid.waitFor();
  await page.waitForTimeout(500);
  const catalogKeys = await page.evaluate(async () => (await import('/src/components/iconCatalog.ts')).docsIconCatalog.map(icon => icon.key));
  assert(catalogKeys.length > 0, 'the icon catalog is nonempty');
  assert.deepEqual(await grid.getByRole('button').evaluateAll(nodes => nodes.map(node => node.dataset.iconKey)), catalogKeys, 'every catalog icon remains accessible');
  await assertViewportBoundPaint(page, grid);
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
  await assertViewportBoundPaint(page, grid);
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
  const seed = page.locator('.preview-controls input[maxlength="40"]');
  await seed.focus();
  await grid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const node = await grid.getByRole('button').first().elementHandle();
  const canvases = await grid.locator('canvas').elementHandles();
  // Dispatch the edit without the browser scrolling the distant input into view;
  // leaving the viewport would correctly release paint, masking rerender stability.
  await seed.evaluate(input => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'new-preview-seed');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  assert.equal(await seed.inputValue(), 'new-preview-seed');
  assert(await node.evaluate(node => node.isConnected), 'preview edits preserve catalog nodes');
  for (const canvas of canvases) assert(await canvas.evaluate(node => node.isConnected), 'preview edits do not remount paint');
  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    assert(await grid.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'no catalog overflow');
    await assertViewportBoundPaint(page, grid);
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
  assert.equal(await fallbackButton.getAttribute('aria-pressed'), 'true', 'click is not lost without IntersectionObserver');
  console.log('PASS bounded icon paint, native identity/focus, search, scroll, resize, preview edits, forced colors and observer fallback');
} finally {
  await browser.close();
}
