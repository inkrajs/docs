import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'en'));
    await page.goto(`${baseUrl}/docs/components/inventory-grid#preview`);
    const root = page.locator('.inventory-grid-examples .inkra-inventory-grid');
    const item = root.locator('[data-inventory-item="supply"]');
    await item.waitFor();
    await setPlaygroundControls(page.locator('.component-playground'), false);
    await item.focus();
    await page.keyboard.press('Space');
    await page.locator('.inkra-inventory-grid__overlay').waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.keyboard.press('ArrowRight');
    // The starting position is already valid; wait for the requested cell, not
    // that unchanged flag, before the next keyboard event commits the drag.
    await page.waitForFunction(() => {
      const preview = document.querySelector('.inkra-inventory-grid__preview');
      return preview?.getAttribute('data-valid') === 'true' && preview.style.left === '96px' && preview.style.top === '0px';
    });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-inventory-item="supply"]')?.style.left === '96px');
    await page.locator('.inkra-inventory-grid__overlay').waitFor({ state: 'detached' });
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    assert(await root.locator('.inkra-inventory-grid__cell').evaluateAll(cells => cells.every(cell => cell.getBoundingClientRect().width >= 44)), '44px item cells');
    assert.equal(await root.locator('[data-inventory-item="tool"] .inkra-inventory-grid__cell').count(), 3, 'L shape uses only its actual occupied cells');
    const tool = root.locator('[data-inventory-item="tool"]');
    assert.equal(await tool.locator('.inkra-inventory-grid__shape-fill').count(), 1, 'one continuous paper surface per item');
    assert.equal(await tool.locator('.inkra-inventory-grid__shape-edge').count(), 6, 'L shape has six exterior edges with no interior dividers');
    assert.equal(await tool.locator('.inkra-inventory-grid__cell .inkra-pencil-surface').count(), 0, 'occupied cells do not have separate frames');
    const outlinePath = await tool.locator('.inkra-inventory-grid__shape-fallback path').getAttribute('d');
    assert.equal((outlinePath.match(/M/g) ?? []).length, 1, 'connected shape has one outline');
    assert(await tool.locator('.inkra-inventory-grid__shape-fill').evaluate(node => getComputedStyle(node).clipPath.startsWith('path(')), 'paper is clipped to occupied geometry');
    await tool.focus();
    await page.keyboard.press('r');
    assert.equal(await tool.getAttribute('data-rotation'), '90', 'rotation updates the connected outline');
    assert.equal(await tool.locator('.inkra-inventory-grid__shape-edge').count(), 6);
    assert(!/[\u3400-\u9fff]/.test(await root.innerText()), 'English playground has no untranslated copy');
    await page.locator('.component-playground .preview-stage').screenshot({ path: `/tmp/inkra-docs-inventory-grid-${width}.png`, animations: 'disabled' });
    const playground = page.locator('.component-playground');
    await setPlaygroundControls(playground, true);
    await playground.getByRole('slider', { name: 'Cell size', exact: true }).focus();
    await page.keyboard.press('End');
    await setPlaygroundControls(playground, false);
    assert.equal(await root.locator('.inkra-inventory-grid__cell').first().evaluate(node => node.getBoundingClientRect().width), 128);
    assert(await root.locator('.inkra-inventory-grid__scroll').first().evaluate(node =>
      node.clientWidth >= node.querySelector('.inkra-inventory-grid__board').clientWidth || node.scrollWidth > node.clientWidth),
      'large cells either fit or scroll inside their container');
    if (width < 768) assert(await root.locator('.inkra-inventory-grid__scroll').first().evaluate(node => node.scrollWidth > node.clientWidth));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'large cells do not widen the page');
    await page.close();
    console.log(`PASS InventoryGrid installed-package playground ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
