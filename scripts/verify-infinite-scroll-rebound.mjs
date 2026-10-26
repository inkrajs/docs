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
    await page.locator('.inkra-infinite-scroll').first().waitFor();
    const client = await context.newCDPSession(page);

    async function mount(direction) {
      await page.evaluate(async edge => {
        window.reboundFixture?.unmount();
        document.getElementById('root').hidden = true;
        document.getElementById('rebound-fixture')?.remove();
        const container = document.createElement('section');
        container.id = 'rebound-fixture';
        document.body.append(container);
        const fixture = await import('/scripts/fixtures/InfiniteScrollReboundFixture.tsx');
        window.reboundFixture = fixture.mount(container, edge);
        window.scrollTo(0, 0);
      }, direction);
      const board = page.getByTestId('rebound');
      await board.waitFor();
      await board.evaluate((node, edge) => {
        node.scrollTop = edge === 'bottom' ? node.scrollHeight : 0;
        node.scrollLeft = edge === 'right' ? node.scrollWidth : 0;
      }, direction);
      await page.waitForTimeout(70);
      return board;
    }

    async function pull(board, direction, distances) {
      const box = await board.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      const horizontal = direction === 'left' || direction === 'right';
      const sign = direction === 'top' || direction === 'left' ? 1 : -1;
      const point = distance => [{ x: x + (horizontal ? distance * sign : 0),
        y: y + (horizontal ? 0 : distance * sign), id: 1, radiusX: 6, radiusY: 6 }];
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(0) });
      const samples = [];
      for (const distance of distances) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(distance) });
        await page.waitForTimeout(20);
        samples.push(await board.evaluate((node, axis) => {
          const body = node.querySelector('.inkra-infinite-scroll__body');
          const style = getComputedStyle(body);
          const matrix = new DOMMatrixReadOnly(style.transform);
          return { distance: Math.abs(axis ? matrix.m41 : matrix.m42), transition: style.transitionDuration };
        }, horizontal));
      }
      return samples;
    }

    for (const direction of ['top', 'bottom', 'left', 'right']) {
      let board = await mount(direction);
      const samples = await pull(board, direction, [16, 32, 48]);
      assert(samples.every(sample => sample.transition === '0s'), 'pull tracks the finger without interpolation');
      for (const [index, raw] of [16, 32, 48].entries()) {
        assert(Math.abs(samples[index].distance - 144 * raw / (144 + raw)) < 1, 'continuous resistance matches physical pull');
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const animation = await board.evaluate(async (node, edge) => {
        const body = node.querySelector('.inkra-infinite-scroll__body');
        getComputedStyle(body).transform;
        const transition = body.getAnimations().find(item => item.transitionProperty === 'transform');
        if (!transition) return null;
        transition.pause();
        await transition.ready;
        const duration = Number(transition.effect.getTiming().duration);
        const samples = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
          transition.currentTime = duration * fraction;
          const matrix = new DOMMatrixReadOnly(getComputedStyle(body).transform);
          return (edge === 'left' || edge === 'right' ? matrix.m41 : matrix.m42)
            * (edge === 'top' || edge === 'left' ? 1 : -1);
        });
        transition.finish();
        return { duration, samples };
      }, direction);
      assert(animation, 'release creates a real compositor transition');
      assert.equal(animation.duration, 420);
      assert(animation.samples[0] > 30, 'release begins at the pulled position');
      assert(animation.samples.some(value => value < -0.2), 'release overshoots slightly');
      assert(Math.abs(animation.samples.at(-1)) < 0.01, 'release settles to zero');
      assert.equal(await page.evaluate(() => window.reboundFixture.events.length), 0, 'short pull never loads');

      // A load resolves before the rebound ends; prepended items must not absorb its transform.
      board = await mount(direction);
      await pull(board, direction, [24, 48, 80, 104]);
      const before = await board.evaluate((node, edge) => {
        const body = node.querySelector('.inkra-infinite-scroll__body');
        const matrix = new DOMMatrixReadOnly(getComputedStyle(body).transform);
        const anchor = node.querySelector('[data-infinite-scroll-anchor="0"]').getBoundingClientRect();
        const viewport = node.getBoundingClientRect();
        return edge === 'left' ? anchor.left - viewport.left - matrix.m41 : anchor.top - viewport.top - matrix.m42;
      }, direction);
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => document.querySelectorAll('#rebound-fixture [data-infinite-scroll-anchor]').length === 14);
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.reboundFixture.events.length), 1, 'one release produces one request');
      if (direction === 'top' || direction === 'left') {
        const after = await board.evaluate((node, edge) => {
          const anchor = node.querySelector('[data-infinite-scroll-anchor="0"]').getBoundingClientRect();
          const viewport = node.getBoundingClientRect();
          return edge === 'left' ? anchor.left - viewport.left : anchor.top - viewport.top;
        }, direction);
        assert(Math.abs(after - before) <= 2, `${direction} anchor survives a fast load during rebound: ${before} -> ${after}`);
      }
      console.log(JSON.stringify({ width, direction, animation }));
    }

    const interrupted = await mount('top');
    await pull(interrupted, 'top', [24, 48]);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(40);
    await pull(interrupted, 'top', [24, 48]);
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.reboundFixture.events.length), 0, 'interrupted rebound and cancellation do not load');
    assert.equal(await interrupted.getAttribute('data-pull-direction'), null, 'cancelled pull leaves no stale gesture state');
    assert.equal(await interrupted.evaluate(node => new DOMMatrixReadOnly(
      getComputedStyle(node.querySelector('.inkra-infinite-scroll__body')).transform).m42), 0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const board = await mount('top');
    await pull(board, 'top', [24, 48]);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(30);
    assert.equal(await board.evaluate(node => {
      const body = node.querySelector('.inkra-infinite-scroll__body');
      return new DOMMatrixReadOnly(getComputedStyle(body).transform).m42;
    }), 0, 'reduced motion resets immediately');
    await page.screenshot({ path: `/tmp/inkra-rebound-${width}.png` });
    await client.detach();
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('InfiniteScroll rebound verified in desktop and mobile Chromium touch simulations.');
} finally {
  await browser.close();
}
