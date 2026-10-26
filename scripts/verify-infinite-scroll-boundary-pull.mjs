import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180'}/docs/components/infinite-scroll#preview`);
    const board = page.getByTestId('infinite-scroll-board');
    await board.waitFor();
    await board.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    assert.equal(await board.locator('[data-visible]').count(), 0, 'default preview has no idle loading feedback');
    for (const direction of ['top', 'bottom', 'left', 'right']) {
      const horizontal = direction === 'left' || direction === 'right';
      const sign = direction === 'top' || direction === 'left' ? -1 : 1;
      const count = await board.locator('[data-infinite-scroll-anchor]').count();
      await board.evaluate((node, edge) => {
        node.scrollLeft = edge === 'left' ? 20 : edge === 'right' ? node.scrollWidth - node.clientWidth - 20 : 100;
        node.scrollTop = edge === 'top' ? 20 : edge === 'bottom' ? node.scrollHeight - node.clientHeight - 20 : 100;
      }, direction);
      await board.hover();
      await page.mouse.wheel(horizontal ? sign * 20 : 0, horizontal ? 0 : sign * 20);
      await page.waitForTimeout(250);
      assert.equal(await board.locator('[data-visible]').count(), 0, `${direction}: arriving at the boundary does not reveal anything`);
      assert.equal(await board.locator('[data-infinite-scroll-anchor]').count(), count, 'arriving does not request data');

      await page.mouse.wheel(horizontal ? sign * 24 : 0, horizontal ? 0 : sign * 24);
      await page.waitForFunction(edge => document.querySelector('[data-testid="infinite-scroll-board"]')?.getAttribute('data-pull-direction') === edge, direction);
      const geometry = await board.evaluate((node, edge) => {
        const rect = node.getBoundingClientRect();
        const indicator = node.querySelector(`[data-direction="${edge}"]`).getBoundingClientRect();
        const distance = parseFloat(node.style.getPropertyValue('--inkra-infinite-scroll-pull-distance'));
        const body = node.querySelector('.inkra-infinite-scroll__body');
        const matrix = new DOMMatrixReadOnly(getComputedStyle(body).transform);
        return {
          distance, extent: edge === 'top' || edge === 'bottom' ? indicator.height : indicator.width,
          offset: edge === 'top' ? indicator.top - rect.top : edge === 'bottom' ? rect.bottom - indicator.bottom
            : edge === 'left' ? indicator.left - rect.left : rect.right - indicator.right,
          translation: Math.abs(edge === 'top' || edge === 'bottom' ? matrix.m42 : matrix.m41),
        };
      }, direction);
      assert(geometry.distance > 0 && geometry.distance < 24, 'extra outward input has elastic resistance');
      assert(Math.abs(geometry.extent - geometry.distance) < 1, `feedback reveals only the pulled distance: ${JSON.stringify(geometry)}`);
      assert(Math.abs(geometry.offset) < 2, `feedback stays at the actual ${direction} viewport edge: ${JSON.stringify(geometry)}`);
      assert(Math.abs(geometry.translation - geometry.distance) < 1, 'content tracks elastic displacement');
      await page.screenshot({ path: `/tmp/inkra-boundary-pull-${width}-${direction}.png` });
      await page.waitForTimeout(650);
      assert.equal(await board.locator('[data-visible]').count(), 0, 'short pull retracts its feedback');
      assert.equal(await board.locator('[data-infinite-scroll-anchor]').count(), count, 'short pull never loads');

      // Reset the edge after the overshoot, then deliberately pull past the threshold.
      await board.evaluate((node, edge) => {
        if (edge === 'top') node.scrollTop = 0;
        if (edge === 'bottom') node.scrollTop = node.scrollHeight;
        if (edge === 'left') node.scrollLeft = 0;
        if (edge === 'right') node.scrollLeft = node.scrollWidth;
      }, direction);
      await page.mouse.wheel(horizontal ? sign * 80 : 0, horizontal ? 0 : sign * 80);
      await page.waitForFunction(edge => document.querySelector(`[data-testid="infinite-scroll-board"] [data-direction="${edge}"]`)?.getAttribute('data-status') === 'loading', direction);
      await page.waitForFunction(previous => document.querySelectorAll('[data-testid="infinite-scroll-board"] [data-infinite-scroll-anchor]').length > previous, count);
      await page.waitForTimeout(500);
      assert.equal(await board.locator('[data-visible]').count(), 0, 'feedback hides again after successful loading');
      console.log(`PASS ${width}px ${direction}: reach, pull, resist, rebound, load`);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
