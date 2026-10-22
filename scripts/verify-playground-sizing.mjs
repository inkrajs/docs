import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const settleLayout = page => page.evaluate(async () => {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    for (const route of ['log', 'radar', 'number-ticker', 'overflow-list', 'pan-zoom']) {
      await page.goto(`${base}/docs/components/${route}#preview`);
      const playground = page.locator('.component-playground').first();
      await playground.waitFor();
      const stage = playground.locator('.preview-stage');
      await stage.scrollIntoViewIfNeeded();
      await settleLayout(page);
      const dimensions = await stage.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const children = [...node.children].map(child => child.getBoundingClientRect());
        return {
          height: bounds.height,
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
          contained: children.every(child => child.top >= bounds.top - 1 && child.bottom <= bounds.bottom + 1),
        };
      });
      assert(dimensions.height >= 340, `${route}: minimum preview height at ${width}`);
      assert(dimensions.contained, `${route}: preview must contain the full example at ${width}`);
      assert(dimensions.scrollHeight <= dimensions.clientHeight + 1, `${route}: no outer vertical clipping at ${width}`);
      const before = await playground.boundingBox();
      await playground.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs((await playground.boundingBox()).height - before.height) < 1, `${route}: code switch height`);
      assert.equal(await stage.getAttribute('inert'), '', `${route}: hidden preview is inert`);
      assert.equal(await stage.isVisible(), false, `${route}: hidden preview not visible`);
      await playground.getByRole('tab', { name: '预览', exact: true }).click();
      assert.equal(await stage.isVisible(), true);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: page overflow at ${width}`);
      if (route === 'log') {
        // A taller example must grow the shared surface rather than create a nested scroll viewport.
        const frame = stage.locator('.log-examples__frame');
        await frame.evaluate(node => node.style.blockSize = '640px');
        await settleLayout(page);
        assert((await stage.boundingBox()).height >= 640, 'preview grows with its child');
        await frame.evaluate(node => node.style.removeProperty('block-size'));
        await settleLayout(page);
        assert(Math.abs((await stage.boundingBox()).height - dimensions.height) < 1, 'preview shrinks back with its child');
      }
      if (route === 'number-ticker' && width > 1024) {
        const link = page.locator('.desktop-sidebar a.nav-link[href$="/number-ticker"]');
        const label = link.locator('.inkra-pencil-text');
        assert.equal(await label.getAttribute('title'), 'NumberTicker');
        assert.equal(await label.evaluate(node => getComputedStyle(node).whiteSpace), 'nowrap');
        assert.equal(await label.evaluate(node => node.classList.contains('inkra-pencil-text--ellipsis')), true);
        assert.match(await link.getAttribute('href'), /number-ticker$/);
      }
      if (route === 'overflow-list') {
        assert.equal(await stage.locator('.overflow-list-examples__toolbar').evaluate(node => getComputedStyle(node).borderBottomWidth), '0px');
        assert.equal(await stage.locator('.overflow-list-examples__toolbar-frame > .inkra-pencil-line').count(), 1);
      }
      if (route === 'radar') {
        const labels = await stage.locator('.inkra-radar__labels > span').evaluateAll(nodes => nodes.map(node => {
          const text = node.querySelector('.inkra-pencil-text');
          if (!text) return { readable: false };
          const style = getComputedStyle(text);
          return { readable: text.getBoundingClientRect().height <= parseFloat(style.lineHeight) * 2 + 1 };
        }));
        assert(labels.length > 0 && labels.every(label => label.readable), `Radar axis labels must not stack letter-by-letter at ${width}`);
        assert.equal(await stage.locator('.inkra-radar > .inkra-table-container').count(), 1, 'Radar delegates table scrolling to Table.Container');
        assert.equal(await stage.locator('.inkra-radar__table-wrap').count(), 0, 'Radar has no second scroll wrapper');
      }
      if (route === 'pan-zoom') {
        const viewport = stage.locator('.inkra-pan-zoom__viewport').first();
        assert.equal(await viewport.count(), 1, 'PanZoom keeps its scoped viewport class');
        assert.equal(await viewport.evaluate(node => getComputedStyle(node).overflow), 'hidden', 'transformed content stays clipped');
        await page.waitForFunction(() => {
          const viewport = document.querySelector('.component-playground .inkra-pan-zoom__viewport');
          const board = viewport?.querySelector('.pan-zoom-examples__board');
          if (!viewport || !board) return false;
          const outer = viewport.getBoundingClientRect();
          const inner = board.getBoundingClientRect();
          return inner.left >= outer.left - 2 && inner.right <= outer.right + 2
            && inner.top >= outer.top - 2 && inner.bottom <= outer.bottom + 2;
        }, undefined, { timeout: 5000 });
      }
      await page.screenshot({ path: `/tmp/inkra-corrections-${route}-${width}.png` });
      console.log(`PASS preview geometry and code switching: ${route} ${width}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
