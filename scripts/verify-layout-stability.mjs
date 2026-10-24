import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('crash', () => errors.push('Page crashed'));
    await page.addInitScript(theme => {
      localStorage.setItem('inkra-docs-theme', theme);
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      window.layoutProbe = { draws: 0, longTasks: 0, maxTask: 0 };
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        window.layoutProbe.draws++;
        return draw.apply(this, args);
      };
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.layoutProbe.longTasks++;
          window.layoutProbe.maxTask = Math.max(window.layoutProbe.maxTask, entry.duration);
        }
      }).observe({ entryTypes: ['longtask'] });
    }, theme);
    for (let visit = 0; visit < 2; visit++) {
      await page.goto(`${base}/docs/components/layout#preview`);
      const frame = page.frameLocator('.layout-viewport__canvas');
      await frame.locator('.layout-notebook').waitFor();
      for (const size of [390, 768, 1024]) {
        await page.getByRole('radio', { name: String(size), exact: true }).check();
        await page.waitForFunction(size => {
          const frame = document.querySelector('.layout-viewport__canvas');
          return frame?.offsetWidth === size && frame.dataset.previewWidth === String(size);
        }, size);
      }
      await frame.locator('html').evaluate(async node => { await node.ownerDocument.fonts.ready; });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      const read = () => page.evaluate(() => {
        const frame = document.querySelector('.layout-viewport__canvas');
        const doc = frame.contentDocument;
        return {
          ...frame.contentWindow.layoutProbe,
          height: frame.offsetHeight,
          styles: doc.querySelectorAll('[data-preview-style]').length,
          pixels: [...doc.querySelectorAll('canvas')].reduce((sum, canvas) => sum + canvas.width * canvas.height, 0),
        };
      });
      const settled = await read();
      await page.waitForTimeout(500);
      assert.deepEqual(await read(), settled, 'idle preview does not continuously repaint, resize or allocate');
      assert(settled.height > 0 && settled.height < 1500);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `/tmp/inkra-layout-stability-${width}-${visit}.png`, animations: 'disabled' });
      console.log(`PASS Layout ${width}px ${theme} visit ${visit + 1}`, JSON.stringify(settled));
    }
    await page.evaluate(async () => {
      const { React: R, ReactDOM, ReactDOMClient, PencilSurface } = await import('/scripts/fixtures/layout-scroll.mjs');
      document.querySelector('#root').style.display = 'none';
      const host = document.createElement('div');
      document.body.prepend(host);
      const root = ReactDOMClient.createRoot(host);
      window.renderBudget = (width, height) => ReactDOM.flushSync(() => root.render(
        R.createElement(PencilSurface, { id: 'surface-budget', variant: 'outline', clipContent: true, style: { width, height } },
          R.createElement('button', { onClick: () => { window.budgetClicked = true; } }, 'Readable fallback')),
      ));
      window.renderBudget(5000, 5000);
    });
    await page.waitForFunction(() => document.querySelector('#surface-budget').dataset.pencilFallback === 'true');
    assert.deepEqual(await page.locator('#surface-budget canvas').evaluateAll(nodes => nodes.map(n => [n.width, n.height])), [[0, 0], [0, 0]]);
    await page.getByRole('button', { name: 'Readable fallback' }).click();
    assert(await page.evaluate(() => window.budgetClicked));
    await page.evaluate(() => window.renderBudget(1305, 954));
    await page.waitForFunction(() => {
      const surface = document.querySelector('#surface-budget');
      const canvas = surface.querySelector('canvas');
      return !surface.hasAttribute('data-pencil-fallback') && canvas.width >= 1305 && canvas.height >= 954;
    });
    const layers = await page.locator('#surface-budget canvas').evaluateAll(nodes => nodes.map(n => n.width * n.height));
    assert(layers.every(pixels => pixels <= 4 * 1024 * 1024), 'adaptive DPR respects each bitmap budget');
    assert(layers.reduce((sum, pixels) => sum + pixels, 0) <= 6 * 1024 * 1024, 'adaptive DPR respects combined bitmap budget');
    await page.evaluate(() => window.renderBudget(280, 160));
    await page.waitForFunction(() => !document.querySelector('#surface-budget').hasAttribute('data-pencil-fallback') && document.querySelector('#surface-budget canvas').width === 560);
    assert.deepEqual(await page.locator('#surface-budget canvas').evaluateAll(nodes => nodes.map(n => [n.width, n.height])), [[560, 320], [560, 320]]);
    assert.deepEqual(errors, []);
    console.log(`PASS oversized surface fallback, interaction and recovery at ${width}px`);
    await page.close();
  }
} finally {
  await browser.close();
}
