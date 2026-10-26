import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const widths = process.env.INKRA_VIEWPORT ? [Number(process.env.INKRA_VIEWPORT)] : [1280, 390];
const browser = await chromium.launch();
const errors = [];

async function pullAtEdge(page, locator, direction, distance = 104) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(50);
  const box = await locator.boundingBox();
  assert(box, 'pull target has geometry');
  const x = box.x + Math.min(box.width / 2, 180);
  const y = box.y + Math.min(box.height / 2, 140);
  const vector = direction === 'top' ? { x: 0, y: distance }
    : direction === 'bottom' ? { x: 0, y: -distance }
      : direction === 'left' ? { x: distance, y: 0 }
        : { x: -distance, y: 0 };
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, radiusX: 8, radiusY: 8, force: 0.7, id: 1 }],
  });
  for (const step of [0.25, 0.5, 0.75, 1]) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + vector.x * step, y: y + vector.y * step, radiusX: 8, radiusY: 8, force: 0.7, id: 1 }],
    });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      hasTouch: true,
      isMobile: width < 500,
      reducedMotion: width < 500 ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/infinite-scroll#preview`);
      const board = page.getByTestId('infinite-scroll-board');
      await board.waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page does not overflow horizontally');
      assert.equal(await board.getAttribute('data-pull-direction'), null, 'no stale pull state on mount');

      if (width === 390) {
        for (const direction of ['top', 'bottom', 'left', 'right']) {
          await board.evaluate((element, edge) => {
            if (edge === 'top') element.scrollTop = 0;
            else if (edge === 'bottom') element.scrollTop = element.scrollHeight;
            else if (edge === 'left') element.scrollLeft = 0;
            else element.scrollLeft = element.scrollWidth;
          }, direction);
          const count = await board.locator('[data-infinite-scroll-anchor]').count();
          await pullAtEdge(page, board, direction);
          const diagnostic = await board.evaluate((element, edge) => ({
            direction: element.getAttribute('data-pull-direction'),
            scrollLeft: element.scrollLeft,
            scrollTop: element.scrollTop,
            maxLeft: element.scrollWidth - element.clientWidth,
            maxTop: element.scrollHeight - element.clientHeight,
            status: element.querySelector(`[data-direction="${edge}"]`)?.getAttribute('data-status'),
          }), direction);
          console.log(`CHECK InfiniteScroll touch ${direction} ${width}px`, diagnostic);
          await page.waitForFunction(({ previous }) => document.querySelectorAll('[data-testid="infinite-scroll-board"] [data-infinite-scroll-anchor]').length > previous, { previous: count });
          assert.equal(await board.getAttribute('data-pull-direction'), null, `${direction} release clears displacement state`);
        }
      }

      const history = page.getByTestId('infinite-scroll-history');
      await history.evaluate(element => { element.scrollTop = 0; });
      const stable = history.locator('[data-infinite-scroll-anchor="history-20"]');
      const before = await stable.boundingBox();
      const beforeContainer = await history.boundingBox();
      assert(before, 'stable history anchor is visible');
      assert(beforeContainer, 'history container has geometry');
      await history.getByRole('button', { name: /Load earlier items|加载更早内容|前の項目|이전 항목|éléments précédents/i }).click();
      await history.locator('[data-infinite-scroll-anchor="history-12"]').waitFor();
      const after = await stable.boundingBox();
      const afterContainer = await history.boundingBox();
      assert(after, 'stable history anchor remains mounted');
      assert(afterContainer, 'history container remains mounted');
      const anchorShift = (after.y - afterContainer.y) - (before.y - beforeContainer.y);
      assert(Math.abs(anchorShift) <= 2, `prepend keeps the reading position (${anchorShift}px)`);

      const failure = page.getByTestId('infinite-scroll-failure');
      await failure.getByRole('button', { name: /Load more|加载更多|読み込|불러오기|Charger/i }).click();
      const retry = failure.getByRole('button', { name: /Retry|重试|再試行|다시 시도|Réessayer/i });
      await retry.waitFor({ state: 'attached' });
      await retry.scrollIntoViewIfNeeded();
      assert.equal(await retry.isVisible(), true, 'retry is reachable inside the local scroll container');
      await retry.click();
      await failure.getByText(/End reached|已到末尾|末尾|마지막|Fin atteinte/i).waitFor({ state: 'attached' });
      assert.equal(await failure.locator('[aria-busy="true"]').count(), 0, 'retry settles without duplicate loading');

      const pull = page.getByTestId('infinite-scroll-pull');
      await pull.evaluate(element => { element.scrollTop = 0; });
      const itemCount = await pull.locator('[data-infinite-scroll-anchor]').count();
      await pullAtEdge(page, pull, 'top');
      await page.waitForFunction(({ count }) => document.querySelectorAll('[data-testid="infinite-scroll-pull"] [data-infinite-scroll-anchor]').length > count, { count: itemCount });
      assert.equal(await pull.getAttribute('data-pull-direction'), null, 'touch release clears displacement state');

      if (width === 1280) {
        const lifecycle = page.getByTestId('infinite-scroll-lifecycle');
        const lifecycleEvents = page.getByTestId('infinite-scroll-lifecycle-events');
        const lifecycleIndicator = lifecycle.locator('[data-direction="bottom"]');
        const startLifecycleLoad = async expectedStarted => {
          const loadButton = lifecycleIndicator.getByRole('button');
          await loadButton.scrollIntoViewIfNeeded();
          await loadButton.click();
          await page.waitForFunction(({ started }) => Number(document.querySelector('[data-testid="infinite-scroll-lifecycle-events"]')?.getAttribute('data-started')) === started, { started: expectedStarted });
          assert.equal(await lifecycleIndicator.getAttribute('data-status'), 'loading');
        };

        await startLifecycleLoad(1);
        await page.getByTestId('infinite-scroll-container-toggle').click();
        await page.waitForFunction(() => document.querySelector('[data-testid="infinite-scroll-lifecycle-events"]')?.getAttribute('data-aborted') === '1');
        assert.equal(await lifecycleIndicator.getAttribute('data-status'), 'idle', 'container replacement restores idle');

        await startLifecycleLoad(2);
        await page.getByTestId('infinite-scroll-disabled-toggle').click();
        await page.waitForFunction(() => document.querySelector('[data-testid="infinite-scroll-lifecycle-events"]')?.getAttribute('data-aborted') === '2');
        assert.equal(await lifecycleIndicator.getAttribute('data-status'), 'idle', 'disabled cancellation restores idle');
        await page.getByTestId('infinite-scroll-disabled-toggle').click();

        await startLifecycleLoad(3);
        await page.getByTestId('infinite-scroll-direction-toggle').click();
        await page.waitForFunction(() => document.querySelector('[data-testid="infinite-scroll-lifecycle-events"]')?.getAttribute('data-aborted') === '3');
        assert.equal(await lifecycleIndicator.getAttribute('data-active'), null, 'removed direction leaves no active indicator');
        await page.getByTestId('infinite-scroll-direction-toggle').click();
        await lifecycleIndicator.getByRole('button').waitFor({ state: 'attached' });
        assert.equal(await lifecycleIndicator.getAttribute('data-status'), 'idle', 're-added direction can load again');
        assert.equal(await lifecycleEvents.getAttribute('data-completed'), '0', 'cancelled business work never completes');
      }

      if (width === 390) {
        const controlled = page.getByTestId('infinite-scroll-controlled');
        await controlled.evaluate(element => { element.scrollTop = 0; });
        const unexpectedBefore = Number(await page.getByTestId('infinite-scroll-controlled-count').textContent());
        await pullAtEdge(page, controlled, 'top');
        await page.waitForTimeout(180);
        assert.equal(Number(await page.getByTestId('infinite-scroll-controlled-count').textContent()), unexpectedBefore, 'controlled loading blocks touch requests');
        assert.equal(await controlled.getAttribute('data-pull-direction'), null, 'controlled loading never becomes pulling');
      }

      const masonry = page.getByTestId('infinite-scroll-masonry');
      const masonryItems = masonry.locator('.inkra-masonry__item');
      assert(await masonry.evaluate(element => element.clientWidth >= 280), 'Masonry composition uses the available responsive width');
      const beforeMasonry = await masonryItems.count();
      await masonry.evaluate(element => { element.scrollTop = element.scrollHeight; });
      if (beforeMasonry < 20) {
        await masonry.locator('.inkra-loading').waitFor({ state: 'attached' });
        await page.waitForFunction(({ count }) => document.querySelectorAll('[data-testid="infinite-scroll-masonry"] .inkra-masonry__item').length > count, { count: beforeMasonry });
      } else {
        await masonry.getByText(/All content loaded|已加载全部内容|すべて読み込み済み|모두 불러옴|Tout est chargé/i).waitFor({ state: 'attached' });
      }
      const boxes = await masonryItems.evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }));
      for (let first = 0; first < boxes.length; first += 1) for (let second = first + 1; second < boxes.length; second += 1) {
        const a = boxes[first]; const b = boxes[second];
        const overlaps = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        assert.equal(overlaps, false, `Masonry items ${first} and ${second} do not overlap`);
      }

      await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
      await board.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'RTL keeps page overflow contained');
      await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

      await page.screenshot({ path: `/tmp/inkra-infinite-scroll-${width}.png`, animations: 'disabled', fullPage: true });
      console.log(`PASS InfiniteScroll touch, anchors, retry and responsive layout ${width}px`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
