import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { chooseDocsOption, setPlaygroundControls } from './playground-test-helpers.mjs';

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

async function waitForAutomaticIdle(board) {
  const page = board.page();
  let previousCount = -1;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="infinite-scroll-board"]');
      if (!(root instanceof HTMLElement)) return false;
      const indicators = [...root.querySelectorAll('[data-active][data-direction]')];
      return indicators.length > 0 && indicators.every(node =>
        node.getAttribute('data-status') === 'idle' && !node.hasAttribute('data-visible'));
    });
    const count = await board.locator('[data-infinite-scroll-anchor]').count();
    await page.waitForTimeout(180);
    const settled = await board.evaluate((element, expectedCount) => {
      const indicators = [...element.querySelectorAll('[data-active][data-direction]')];
      return element.querySelectorAll('[data-infinite-scroll-anchor]').length === expectedCount
        && indicators.every(node => node.getAttribute('data-status') === 'idle'
          && !node.hasAttribute('data-visible')
          && node.getBoundingClientRect()[node.getAttribute('data-direction') === 'top'
            || node.getAttribute('data-direction') === 'bottom' ? 'height' : 'width'] === 0);
    }, count);
    if (settled && count === previousCount) return;
    previousCount = count;
  }
  throw new Error('Automatic initial boundary filling did not settle to hidden idle indicators');
}

async function loadAtScrollBoundary(page, board, direction) {
  const indicator = board.locator(`[data-direction="${direction}"]`);
  const previous = await board.locator('[data-infinite-scroll-anchor]').count();
  const beforeExtent = await board.evaluate(element => ({
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
  }));
  const captureLoading = direction === 'top' && page.viewportSize()?.width === 1280;
  if (captureLoading) await page.evaluate(() => {
    const original = window.setTimeout;
    window.__inkraInfiniteScrollOriginalSetTimeout = original;
    window.setTimeout = (handler, timeout, ...arguments_) => original(handler, timeout === 360 ? 1600 : timeout, ...arguments_);
  });
  const anchor = await board.evaluate((element, edge) => {
    if (edge === 'top') element.scrollTop = 0;
    else if (edge === 'bottom') element.scrollTop = element.scrollHeight;
    else if (edge === 'left') element.scrollLeft = 0;
    else element.scrollLeft = element.scrollWidth;
    if (edge !== 'top' && edge !== 'left') return null;
    const viewport = element.getBoundingClientRect();
    const candidates = [...element.querySelectorAll('[data-infinite-scroll-anchor]')]
      .filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > viewport.top && rect.top < viewport.bottom
          && rect.right > viewport.left && rect.left < viewport.right;
      })
      .sort((first, second) => {
        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        return edge === 'top' ? a.top - b.top : a.left - b.left;
      });
    const node = candidates[0];
    if (!(node instanceof HTMLElement)) return null;
    const rect = node.getBoundingClientRect();
    return {
      key: node.dataset.infiniteScrollAnchor,
      offset: edge === 'top' ? rect.top - viewport.top : rect.left - viewport.left,
    };
  }, direction);

  await page.waitForFunction(({ edge }) => {
    const node = document.querySelector(`[data-testid="infinite-scroll-board"] [data-direction="${edge}"]`);
    return node?.getAttribute('data-status') === 'loading' && node.hasAttribute('data-visible');
  }, { edge: direction });
  await page.waitForTimeout(40);
  if (captureLoading) await page.evaluate(() => {
    if (window.__inkraInfiniteScrollOriginalSetTimeout) {
      window.setTimeout = window.__inkraInfiniteScrollOriginalSetTimeout;
      delete window.__inkraInfiniteScrollOriginalSetTimeout;
    }
  });
  assert.equal(await indicator.getByRole('button').count(), 0, `${direction} automatic loading has no permanent load button`);
  const spinner = indicator.locator('.inkra-infinite-scroll__loading .inkra-progress[data-shape="circular"][data-state="indeterminate"]');
  assert.equal(await spinner.count(), 1, `${direction} loading uses one compact circular progressbar`);
  assert(await spinner.getAttribute('aria-label'), `${direction} progressbar has an accessible label`);
  const loadingLabel = indicator.locator('.inkra-infinite-scroll__loading-label');
  assert.equal(await loadingLabel.count(), 1, `${direction} loading presents text beside the spinner`);
  assert.equal(await indicator.locator('.inkra-infinite-scroll__indicator-line').count(), 0, `${direction} feedback has no permanent divider`);
  const visibility = await indicator.evaluate((node, edge) => {
    const container = node.closest('[data-testid="infinite-scroll-board"]');
    const progress = node.querySelector('.inkra-progress[data-shape="circular"]');
    const label = node.querySelector('.inkra-infinite-scroll__loading-label');
    const content = container?.querySelector('.inkra-infinite-scroll__content');
    if (!(container instanceof HTMLElement) || !(progress instanceof HTMLElement)
      || !(label instanceof HTMLElement) || !(content instanceof HTMLElement)) return null;
    const outer = container.getBoundingClientRect();
    const scaleX = outer.width > 0 && container.offsetWidth > 0 ? outer.width / container.offsetWidth : 1;
    const scaleY = outer.height > 0 && container.offsetHeight > 0 ? outer.height / container.offsetHeight : 1;
    const viewport = {
      left: outer.left + container.clientLeft * scaleX,
      top: outer.top + container.clientTop * scaleY,
      right: outer.left + (container.clientLeft + container.clientWidth) * scaleX,
      bottom: outer.top + (container.clientTop + container.clientHeight) * scaleY,
    };
    const visibleRect = element => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        visibleWidth: Math.max(0, Math.min(viewport.right, rect.right) - Math.max(viewport.left, rect.left)),
        visibleHeight: Math.max(0, Math.min(viewport.bottom, rect.bottom) - Math.max(viewport.top, rect.top)),
      };
    };
    const feedbackRects = [progress.getBoundingClientRect(), label.getBoundingClientRect()];
    const indicatorRect = node.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const followsContent = edge === 'top' ? indicatorRect.bottom <= contentRect.top + 1
      : edge === 'bottom' ? indicatorRect.top >= contentRect.bottom - 1
        : edge === 'left' ? indicatorRect.right <= contentRect.left + 1
          : indicatorRect.left >= contentRect.right - 1;
    const contentOverlapCount = [...container.querySelectorAll('[data-infinite-scroll-anchor]')]
      .filter(anchor => {
        const rect = anchor.getBoundingClientRect();
        return feedbackRects.some(feedback =>
          Math.min(rect.right, feedback.right) - Math.max(rect.left, feedback.left) > 1
          && Math.min(rect.bottom, feedback.bottom) - Math.max(rect.top, feedback.top) > 1);
      }).length;
    return { edge, indicator: visibleRect(node), spinner: visibleRect(progress), label: visibleRect(label), contentOverlapCount, followsContent };
  }, direction);
  assert(visibility, `${direction} loading geometry is measurable`);
  assert.equal(visibility.followsContent, true, `${direction} indicator is laid out beyond the real content edge: ${JSON.stringify(visibility)}`);
  const edgeVisibility = direction === 'top' || direction === 'bottom'
    ? visibility.indicator.visibleHeight
    : visibility.indicator.visibleWidth;
  assert(edgeVisibility > 0, `${direction} indicator intersects its scroll viewport edge: ${JSON.stringify(visibility)}`);
  for (const [part, rect] of [['spinner', visibility.spinner], ['label', visibility.label]]) {
    assert(rect.visibleWidth >= rect.width - 1 && rect.visibleHeight >= rect.height - 1,
      `${direction} ${part} is fully visible inside the scroll viewport: ${JSON.stringify(visibility)}`);
  }
  assert.equal(visibility.contentOverlapCount, 0, `${direction} transparent feedback does not overlap content: ${JSON.stringify(visibility)}`);
  const loadingExtent = await board.evaluate(element => ({
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
  }));
  if (direction === 'top' || direction === 'bottom') {
    assert.equal(loadingExtent.scrollWidth, beforeExtent.scrollWidth, `${direction} feedback transform does not expand scrollWidth`);
  } else {
    assert.equal(loadingExtent.scrollHeight, beforeExtent.scrollHeight, `${direction} feedback transform does not expand scrollHeight`);
  }
  if (captureLoading) await page.screenshot({ path: '/tmp/inkra-infinite-loading.png', animations: 'disabled' });
  await page.waitForFunction(({ count }) =>
    document.querySelectorAll('[data-testid="infinite-scroll-board"] [data-infinite-scroll-anchor]').length > count,
  { count: previous });
  await page.waitForFunction(({ edge }) => {
    const node = document.querySelector(`[data-testid="infinite-scroll-board"] [data-direction="${edge}"]`);
    return node?.getAttribute('data-status') === 'idle' && !node.hasAttribute('data-visible');
  }, { edge: direction });

  if (anchor?.key) {
    const after = await board.evaluate((element, value) => {
      const node = [...element.querySelectorAll('[data-infinite-scroll-anchor]')]
        .find(candidate => candidate.getAttribute('data-infinite-scroll-anchor') === value.key);
      if (!(node instanceof HTMLElement)) return null;
      const viewport = element.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      return value.edge === 'top' ? rect.top - viewport.top : rect.left - viewport.left;
    }, { edge: direction, key: anchor.key });
    assert(after !== null, `${direction} anchor remains mounted`);
    assert(Math.abs(after - anchor.offset) <= 2, `${direction} prepend keeps the reading position (${after - anchor.offset}px)`);
  }
}

async function readSettledMasonry(masonry) {
  await masonry.locator('.inkra-masonry[data-layout="ready"]').waitFor();
  await masonry.page().waitForFunction(() => {
    const items = [...document.querySelectorAll('[data-testid="infinite-scroll-masonry"] .inkra-masonry__item')];
    return items.length > 0 && items.every(item => item.hasAttribute('data-positioned'));
  });
  return masonry.evaluate(async element => {
    const grid = element.querySelector('.inkra-masonry');
    if (!(grid instanceof HTMLElement)) throw new Error('Masonry grid is missing');
    await document.fonts?.ready;
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const snapshot = () => [...grid.querySelectorAll('.inkra-masonry__item')].map(item => {
      const rect = item.getBoundingClientRect();
      return {
        index: Number(item.getAttribute('data-index')),
        column: Number(item.getAttribute('data-column')),
        transform: getComputedStyle(item).transform,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });
    const same = (left, right) => left.length === right.length && left.every((item, index) => {
      const next = right[index];
      return item.index === next.index
        && item.column === next.column
        && Math.abs(item.left - next.left) < 0.25
        && Math.abs(item.right - next.right) < 0.25
        && Math.abs(item.top - next.top) < 0.25
        && Math.abs(item.bottom - next.bottom) < 0.25;
    });

    let previous = [];
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const items = [...grid.querySelectorAll('.inkra-masonry__item')];
      await Promise.all(items.flatMap(item => item.getAnimations()).map(animation => animation.finished.catch(() => undefined)));
      await frame();
      await frame();
      const current = snapshot();
      if (grid.getAttribute('data-layout') === 'ready'
        && current.length > 0
        && items.every(item => item.hasAttribute('data-positioned'))
        && same(previous, current)) return current;
      previous = current;
    }
    throw new Error(`Masonry layout did not settle: ${JSON.stringify(previous)}`);
  });
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
      const playground = page.locator('.component-playground').first();
      await setPlaygroundControls(playground, true);
      await chooseDocsOption(playground, '触发方式', '到达边界自动加载');
      await setPlaygroundControls(playground, false);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page does not overflow horizontally');
      assert.equal(await board.getAttribute('data-pull-direction'), null, 'no stale pull state on mount');
      await waitForAutomaticIdle(board);
      assert.equal(await board.locator('[data-visible]').count(), 0, 'automatic idle indicators are hidden');
      assert.equal(await board.getByRole('button').count(), 0, 'automatic preview has no permanent load buttons');
      for (const direction of ['top', 'bottom', 'left', 'right']) {
        await loadAtScrollBoundary(page, board, direction);
      }

      const history = page.getByTestId('infinite-scroll-history');
      await history.scrollIntoViewIfNeeded();
      assert.equal(await history.getByRole('button').count(), 0, 'history loads by scrolling, not a button');
      assert.equal(await history.locator('[data-infinite-scroll-anchor]').count(), 16, 'history does not load before reaching its threshold');
      await history.evaluate(element => { element.scrollTop = 32; });
      await page.waitForTimeout(100);
      assert.equal(await history.locator('[data-direction="top"]').getAttribute('data-status'), 'idle', 'history waits until the top is reached');
      const beforeOffset = await history.evaluate(element => {
        element.scrollTop = 0;
        const anchor = element.querySelector('[data-infinite-scroll-anchor="history-20"]');
        return anchor.getBoundingClientRect().top - element.getBoundingClientRect().top;
      });
      const stable = history.locator('[data-infinite-scroll-anchor="history-20"]');
      await page.waitForFunction(() => document.querySelector('[data-testid="infinite-scroll-history"] [data-direction="top"]')?.getAttribute('data-status') === 'loading');
      assert.equal(await history.locator('[data-direction="top"] .inkra-infinite-scroll__loading').count(), 1, 'scrolling shows transient loading feedback');
      await history.locator('[data-infinite-scroll-anchor="history-12"]').waitFor();
      await page.waitForFunction(() => {
        const indicator = document.querySelector('[data-testid="infinite-scroll-history"] [data-direction="top"]');
        return indicator?.getAttribute('data-status') === 'idle' && !indicator.hasAttribute('data-visible');
      });
      await page.waitForTimeout(100);
      const after = await stable.boundingBox();
      const afterContainer = await history.boundingBox();
      assert(after, 'stable history anchor remains mounted');
      assert(afterContainer, 'history container remains mounted');
      const anchorShift = (after.y - afterContainer.y) - beforeOffset;
      assert(Math.abs(anchorShift) <= 2, `prepend keeps the reading position (${anchorShift}px)`);
      assert.equal(await history.locator('[data-infinite-scroll-anchor]').count(), 24, 'one threshold crossing loads one history page');

      await history.evaluate(element => { element.scrollTop = 100; });
      if (width < 500) await pullAtEdge(page, history, 'top', 140);
      else {
        await history.hover();
        await page.mouse.wheel(0, -100);
      }
      await history.locator('[data-infinite-scroll-anchor="history-4"]').waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid="infinite-scroll-history"] [data-direction="top"]')?.getAttribute('data-status') === 'end');
      await history.evaluate(element => { element.scrollTop = 0; });
      await page.waitForTimeout(350);
      assert.equal(await history.locator('[data-infinite-scroll-anchor]').count(), 32, 'history stops loading when there are no earlier items');

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
      const settledItems = await readSettledMasonry(masonry);
      const overlapPairs = [];
      for (let first = 0; first < settledItems.length; first += 1) for (let second = first + 1; second < settledItems.length; second += 1) {
        const a = settledItems[first]; const b = settledItems[second];
        const doesOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        if (doesOverlap) overlapPairs.push({ first: a, second: b });
      }
      assert.deepEqual(overlapPairs, [], `Masonry settled layout overlaps: ${JSON.stringify(overlapPairs)}`);

      await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
      await board.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'RTL keeps page overflow contained');
      await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

      await page.screenshot({ path: `/tmp/inkra-infinite-scroll-${width}.png`, animations: 'disabled', fullPage: true });
      console.log(`PASS InfiniteScroll automatic thresholds, touch, anchors, retry and responsive layout ${width}px`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
