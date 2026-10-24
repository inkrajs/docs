import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

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

async function controls(page, open) {
  await setPlaygroundControls(page.locator('.component-playground'), open);
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
  await page.locator('.inkra-sortable__overlay').waitFor({ state: 'detached' });
  // dnd-kit's pointer sensor retains click suppression for 50ms after release.
  await page.waitForTimeout(60);
  await client.detach();
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), width === 1305 ? 'zh-CN' : 'en');
      await page.goto(`${baseUrl}/docs/components/sortable#preview`);
      const stage = page.locator('.component-playground .preview-stage');
      const root = stage.locator('[data-testid="sortable-playground"]');
      await root.locator('[data-sortable-id="outline"]').waitFor();

      assert.equal(await root.locator('[data-sortable-handle]').count(), 0, 'primary demo starts with whole-row dragging');
      const original = await ids(root);
      const source = root.locator('[data-sortable-id="outline"]');
      const target = root.locator('[data-sortable-id="polish"]');
      await source.scrollIntoViewIfNeeded();
      const start = await center(source);
      const end = await center(target);
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x + 16, start.y, { steps: 4 });
      await page.locator('.inkra-sortable__overlay').waitFor();
      await page.mouse.move(end.x, end.y + 8, { steps: 12 });
      await page.mouse.up();
      await page.waitForFunction(expected => Array.from(document.querySelectorAll('[data-testid="sortable-playground"] [data-sortable-id]'), node => node.getAttribute('data-sortable-id')).join(',') !== expected, original.join(','));
      assert.notDeepEqual(await ids(root), original, 'primary demo reorders by dragging the content');
      await page.reload();
      await controls(page, true);
      await page.getByRole('tab', { name: /Interaction|交互/ }).click();
      await page.getByRole('switch', { name: /Drag handle|拖动手柄/ }).click();
      await controls(page, false);

      const handles = root.getByRole('button', { name: /Drag item|拖动项目/ });
      assert.equal(await handles.count(), 4);
      assert.equal(await root.locator('[data-sortable-id="review"] [data-sortable-handle]').isDisabled(), true);

      const initialOrder = await ids(root);
      const firstHandle = root.locator('[data-sortable-id="outline"] [data-sortable-handle]');
      await firstHandle.focus();
      await page.keyboard.press('Space');
      await page.locator('.inkra-sortable__overlay').waitFor();
      // KeyboardSensor attaches its listener after activation; allow layout measurement too.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] [data-sortable-id]')?.getAttribute('data-sortable-id') === 'sketch');
      await page.keyboard.press('Escape');
      await page.waitForFunction(expected => Array.from(document.querySelectorAll('[data-testid="sortable-playground"] [data-sortable-id]'), node => node.getAttribute('data-sortable-id')).join(',') === expected, initialOrder.join(','));
      await page.locator('.inkra-sortable__overlay').waitFor({ state: 'detached' });
      assert.deepEqual(await ids(root), initialOrder, 'Escape restores controlled order');
      // Cancellation restores DOM order before the sorting transforms finish.
      await root.evaluate(async element => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
      });

      await firstHandle.focus();
      await page.keyboard.press('Space');
      await page.locator('.inkra-sortable__overlay').waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] [data-sortable-id]')?.getAttribute('data-sortable-id') === 'sketch');
      assert.deepEqual(await ids(root), ['sketch', 'outline', 'review', 'polish'], 'one arrow moves one position before drop');
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

      await controls(page, true);
      await page.getByRole('tab', { name: /Layout|布局/ }).click();
      await page.getByRole('combobox', { name: /Arrangement|排列/ }).click();
      await page.getByRole('option', { name: /Grid|网格/ }).click();
      assert.equal(await root.locator('.inkra-sortable__container').getAttribute('data-layout'), 'grid');
      await page.getByRole('combobox', { name: /Arrangement|排列/ }).click();
      await page.getByRole('option', { name: /List|列表/ }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="sortable-playground"] .inkra-sortable__container')?.getAttribute('data-layout') === 'list');
      await controls(page, false);

      const board = page.locator('[data-testid="sortable-board"]');
      const paused = board.locator('section[aria-label="Paused"], section[aria-label="暂停"]');
      const ready = board.locator('section[aria-label="Ready"], section[aria-label="就绪"]');
      assert.equal(await paused.getAttribute('aria-disabled'), 'true');
      if (width === 1305) {
        await board.scrollIntoViewIfNeeded();
        const moving = board.locator('[data-sortable-id="outline"] [data-sortable-handle]');
        const target = ready.locator('[data-sortable-id="review"]');
        const start = await center(moving);
        const end = await center(target);
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(start.x + 20, start.y, { steps: 5 });
        await page.locator('.inkra-sortable__overlay').waitFor();
        await page.mouse.move(end.x, end.y, { steps: 12 });
        await board.locator('.inkra-sortable__placeholder').waitFor();
        await page.mouse.up();
        assert((await ids(ready)).includes('outline'));

        const readyBeforeDisabledDrop = await ids(ready);
        const disabledStart = await center(board.locator('[data-sortable-id="outline"] [data-sortable-handle]'));
        const disabledEnd = await center(paused);
        await page.mouse.move(disabledStart.x, disabledStart.y);
        await page.mouse.down();
        await page.mouse.move(disabledStart.x + 20, disabledStart.y, { steps: 5 });
        await page.locator('.inkra-sortable__overlay').waitFor();
        await page.mouse.move(disabledEnd.x, disabledEnd.y, { steps: 12 });
        await page.mouse.up();
        assert.deepEqual(await ids(ready), readyBeforeDisabledDrop, 'disabled container rejects drops');
        assert.deepEqual(await ids(paused), ['signed']);
      }

      const openButton = board.getByRole('button', { name: /Open|打开/ }).first();
      await openButton.click();
      assert.equal(await page.locator('.inkra-sortable__overlay').count(), 0, 'nested action does not start dragging');
      const text = await page.locator('#sortable-panel-preview').innerText();
      assert(!/[\u3400-\u9fff][^\n]*\s\/\s[A-Za-z]/.test(text), 'no bilingual concatenations');
      if (width === 390) assert(!/[\u3400-\u9fff]/.test(text), 'English demo has no untranslated Chinese');

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
