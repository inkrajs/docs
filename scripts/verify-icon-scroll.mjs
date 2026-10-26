import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const base = process.env.DOCS_URL || 'http://127.0.0.1:4180';
const capture = process.env.ICON_SCROLL_CAPTURE === '1';
const report = [];
const errors = [];

async function collect(page, phase, action) {
  await page.evaluate(name => {
    window.iconScrollPhase = name;
    window.iconScrollFrames = [];
    window.iconScrollWatching = true;
  }, phase);
  await action();
  await page.waitForTimeout(100);
  return page.evaluate(() => {
    window.iconScrollWatching = false;
    return window.iconScrollFrames;
  });
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => { errors.push(error.stack ?? error.message); console.error(error.stack ?? error.message); });
    await page.goto(`${base}/docs/components/icon#preview`);
    const catalog = page.locator('.icon-examples__catalog');
    const grid = catalog.locator('.icon-examples__grid');
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      const grid = document.querySelector('.icon-examples__grid');
      window.iconScrollNodes = new Map([...grid.querySelectorAll('[data-icon-key]')].map(tile => [tile.dataset.iconKey, { tile, glyph: tile.querySelector('.icon-examples__choice-content') }]));
      window.iconScrollWatching = false;
      window.iconScrollFrames = [];
      const sample = () => {
        if (window.iconScrollWatching) {
          const bounds = grid.getBoundingClientRect();
          const failures = [];
          const tiles = [...grid.querySelectorAll('[data-icon-key]')];
          let visible = 0;
          for (const tile of tiles) {
            const rect = tile.getBoundingClientRect();
            if (rect.bottom <= Math.max(bounds.top, 0) || rect.top >= Math.min(bounds.bottom, innerHeight)
              || rect.right <= Math.max(bounds.left, 0) || rect.left >= Math.min(bounds.right, innerWidth)) continue;
            visible++;
            const canvas = tile.querySelector('canvas.inkra-pencil-icon');
            const svg = tile.querySelector('svg');
            if (svg || !canvas || canvas.dataset.pencilIconReady !== 'true') failures.push({ key: tile.dataset.iconKey, svg: Boolean(svg), ready: canvas?.dataset.pencilIconReady ?? false });
            if (canvas) {
              const box = canvas.getBoundingClientRect();
              if (Math.abs(box.width - 32) > 0.1 || Math.abs(box.height - 32) > 0.1) failures.push({ key: tile.dataset.iconKey, size: [box.width, box.height] });
            }
          }
          const changedNodes = tiles.filter(tile => window.iconScrollNodes.get(tile.dataset.iconKey)?.tile !== tile).map(tile => tile.dataset.iconKey);
          const columns = new Set(tiles.map(tile => Math.round(tile.getBoundingClientRect().left))).size;
          const rowHeight = tiles[columns] && tiles[0] ? tiles[columns].offsetTop - tiles[0].offsetTop : 64;
          window.iconScrollFrames.push({ phase: window.iconScrollPhase, scrollTop: grid.scrollTop, pageY: scrollY,
            visible, failures, changedNodes, total: tiles.length, painted: grid.querySelectorAll('canvas.inkra-pencil-icon').length,
            budget: Math.min(tiles.length - 1, columns * (Math.ceil(grid.clientHeight / Math.max(rowHeight, 1)) + 6) + 2) });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    for (const [variant, label] of [['outline', '线条'], ['filled', '填充'], ['colorful', '彩色']]) {
      const radio = catalog.getByRole('radio', { name: label, exact: true });
      if (capture && !await radio.count()) continue;
      assert.equal(await radio.count(), 1, `${variant}: selectable appearance exists`);
      await radio.check({ force: true });
      await grid.scrollIntoViewIfNeeded();
      await grid.evaluate(node => { node.scrollTop = 0; });
      await page.waitForTimeout(150);
      const frames = [];
      frames.push(...await collect(page, 'wheel-down-up', async () => {
        await grid.hover();
        for (const delta of [180, 320, 520, 800, -260, -480, -800]) {
          await page.mouse.wheel(0, delta);
          await page.waitForTimeout(20);
        }
      }));
      frames.push(...await collect(page, 'jump-cold-rows', async () => {
        for (const fraction of [1, 0, 0.8, 0.2, 0.6, 0, 1]) {
          await grid.evaluate((node, value) => { node.scrollTop = (node.scrollHeight - node.clientHeight) * value; }, fraction);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        }
      }));
      const pageY = await page.evaluate(() => scrollY);
      frames.push(...await collect(page, 'page-out-and-back', async () => {
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(100);
        await page.evaluate(value => scrollTo(0, value), pageY);
        await page.waitForTimeout(150);
      }));
      const focusTile = grid.locator('[data-icon-key]').first();
      await focusTile.focus();
      await page.evaluate(() => { window.iconScrollFocused = document.activeElement; });
      frames.push(...await collect(page, 'focused-tile-retained', async () => {
        await grid.evaluate(node => { node.scrollTop = node.scrollHeight; });
        await page.waitForTimeout(60);
        assert(await page.evaluate(() => document.activeElement === window.iconScrollFocused), 'scroll retains native focus');
        await grid.evaluate(node => { node.scrollTop = 0; });
      }));
      await focusTile.press('Enter');
      assert.equal(await focusTile.getAttribute('aria-pressed'), 'true', 'keyboard selection remains functional');
      const failedFrames = frames.filter(frame => frame.failures.length || frame.changedNodes.length || frame.painted > frame.budget);
      const summary = { width, variant, frames: frames.length, visibleFrames: frames.filter(frame => frame.visible).length,
        failedFrames: failedFrames.length, svgFrames: frames.filter(frame => frame.failures.some(failure => failure.svg)).length,
        unreadyFrames: frames.filter(frame => frame.failures.some(failure => failure.ready === false)).length,
        maxPainted: Math.max(...frames.map(frame => frame.painted)), samples: failedFrames.slice(0, 8) };
      report.push(summary);
      console.log(JSON.stringify(summary));
      await grid.screenshot({ path: `/tmp/inkra-icon-scroll-${capture ? 'before' : 'after'}-${variant}-${width}.png` });
      if (!capture) {
        assert(summary.visibleFrames >= 10, `${width}/${variant}: live scrolling frames, not only settled state, were sampled`);
        assert.equal(summary.failedFrames, 0, `${width}/${variant}: every visible scrolling-frame glyph is ready pencil, fixed-size and bounded`);
      }
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: no page overflow`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`/tmp/inkra-icon-scroll-${capture ? 'before' : 'after'}.json`, JSON.stringify(report, null, 2));
  writeFileSync('/tmp/inkra-icon-scroll-errors.json', JSON.stringify(errors, null, 2));
  await browser.close();
}
