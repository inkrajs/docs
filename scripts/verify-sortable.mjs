import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

async function ids(scope) {
  return scope.locator('[data-sortable-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-sortable-id')));
}

async function center(locator) {
  const box = await locator.boundingBox();
  assert(box, 'expected visible sortable target');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function touchDrag(page, source, target) {
  const client = await page.context().newCDPSession(page);
  const start = await center(source);
  const end = await center(target);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, radiusX: 8, radiusY: 8, force: 1, id: 1 }],
  });
  await page.waitForTimeout(220);
  for (let step = 1; step <= 8; step += 1) {
    const progress = step / 8;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        radiusX: 8,
        radiusY: 8,
        force: 1,
        id: 1,
      }],
    });
    await page.waitForTimeout(24);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/docs/components/sortable#preview`);
      const stage = page.locator('.component-playground .preview-stage');
      const root = stage.locator('[data-testid="sortable-playground"]');
      await root.locator('[data-sortable-id="outline"]').waitFor();

      const handles = root.getByRole('button', { name: /Drag item|拖动项目/ });
      assert.equal(await handles.count(), 4);
      assert.equal(await root.locator('[data-sortable-id="review"] [data-sortable-handle]').isDisabled(), true);

      const initialOrder = await ids(root);
      const firstHandle = root.locator('[data-sortable-id="outline"] [data-sortable-handle]');
      await firstHandle.focus();
      await page.keyboard.press('Space');
      await page.locator('.inkra-sortable__overlay').waitFor();
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] [data-sortable-id]')?.getAttribute('data-sortable-id') === 'sketch');
      await page.keyboard.press('Escape');
      await page.waitForFunction(expected => Array.from(document.querySelectorAll('[data-testid="sortable-playground"] [data-sortable-id]'), node => node.getAttribute('data-sortable-id')).join(',') === expected, initialOrder.join(','));
      await page.locator('.inkra-sortable__overlay').waitFor({ state: 'detached' });
      assert.deepEqual(await ids(root), initialOrder, 'Escape restores controlled order');

      await firstHandle.focus();
      await page.keyboard.press('Space');
      await page.locator('.inkra-sortable__overlay').waitFor();
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] [data-sortable-id]')?.getAttribute('data-sortable-id') === 'sketch');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] [data-sortable-id]')?.getAttribute('data-sortable-id') === 'sketch');
      await page.locator('.inkra-sortable__overlay').waitFor({ state: 'detached' });
      const reordered = await ids(root);
      assert.deepEqual(reordered, ['sketch', 'outline', 'review', 'polish']);

      if (width === 390) {
        const touchSource = root.locator('[data-sortable-id="sketch"] [data-sortable-handle]');
        const touchTarget = root.locator('[data-sortable-id="polish"]');
        await touchDrag(page, touchSource, touchTarget);
        await page.waitForFunction(expected => Array.from(document.querySelectorAll('[data-testid="sortable-playground"] [data-sortable-id]'), node => node.getAttribute('data-sortable-id')).join(',') !== expected, reordered.join(','));
        assert.notDeepEqual(await ids(root), reordered, 'touch sensor reorders within the mobile list');
      }

      await page.getByRole('tab', { name: /Layout|布局/ }).click();
      await page.getByRole('combobox', { name: /Arrangement|排列/ }).click();
      await page.getByRole('option', { name: /Grid|网格/ }).click();
      assert.equal(await root.locator('.inkra-sortable__container').getAttribute('data-layout'), 'grid');
      await page.getByRole('combobox', { name: /Arrangement|排列/ }).click();
      await page.getByRole('option', { name: /List|列表/ }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] .inkra-sortable__container')?.getAttribute('data-layout') === 'list');

      const board = page.locator('[data-testid="sortable-board"]');
      const paused = board.locator('section[aria-label="Paused"]');
      assert.equal(await paused.getAttribute('aria-disabled'), 'true');
      if (width === 1305) {
        await board.scrollIntoViewIfNeeded();
        const moving = board.locator('[data-sortable-id="outline"] [data-sortable-handle]');
        const target = board.locator('section[aria-label="Ready"] [data-sortable-id="review"]');
        const start = await center(moving);
        const end = await center(target);
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(start.x + 20, start.y, { steps: 5 });
        await page.locator('.inkra-sortable__overlay').waitFor();
        await page.mouse.move(end.x, end.y, { steps: 12 });
        await board.locator('.inkra-sortable__placeholder').waitFor();
        await page.mouse.up();
        assert((await ids(board.locator('section[aria-label="Ready"]'))).includes('outline'));

        const readyBeforeDisabledDrop = await ids(board.locator('section[aria-label="Ready"]'));
        const disabledStart = await center(board.locator('[data-sortable-id="outline"] [data-sortable-handle]'));
        const disabledEnd = await center(paused);
        await page.mouse.move(disabledStart.x, disabledStart.y);
        await page.mouse.down();
        await page.mouse.move(disabledStart.x + 20, disabledStart.y, { steps: 5 });
        await page.locator('.inkra-sortable__overlay').waitFor();
        await page.mouse.move(disabledEnd.x, disabledEnd.y, { steps: 12 });
        await page.mouse.up();
        assert.deepEqual(await ids(board.locator('section[aria-label="Ready"]')), readyBeforeDisabledDrop, 'disabled container rejects drops');
        assert.deepEqual(await ids(paused), ['signed']);
      }

      const openButton = board.getByRole('button', { name: /Open|打开/ }).first();
      await openButton.click();
      assert.equal(await page.locator('.inkra-sortable__overlay').count(), 0, 'nested action does not start dragging');

      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await stage.screenshot({ path: `/tmp/inkra-sortable-${width}.png`, animations: 'disabled' });
      console.log(`PASS Sortable keyboard/cancel/mouse/touch/cross-container/disabled/mobile ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
