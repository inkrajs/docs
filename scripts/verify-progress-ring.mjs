import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark'], [320, 'light']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/progress#preview`);
    const playground = page.locator('.component-playground').first();
    const playgroundProgress = playground.locator('.inkra-progress');
    const controls = playground.getByRole('group', { name: '属性', exact: true });
    assert.equal(await playgroundProgress.getAttribute('data-shape'), 'linear');
    await setPlaygroundControls(playground, true);
    await chooseDocsOption(controls, '展示形式', '环状', { exact: true, optionExact: true });
    await playgroundProgress.locator('.inkra-progress__ring-ink[data-ready="true"]').waitFor();
    await chooseDocsOption(controls, '展示形式', '条形', { exact: true, optionExact: true });
    assert.equal(await playgroundProgress.getAttribute('data-shape'), 'linear');
    await chooseDocsOption(controls, '展示形式', '环状', { exact: true, optionExact: true });
    await controls.getByRole('tab', { name: '内容', exact: true }).click();
    await chooseDocsOption(controls, '自定义内容', '百分比', { exact: true, optionExact: true });
    await controls.getByRole('tab', { name: '布局', exact: true }).click();
    await chooseDocsOption(controls, '内容位置', '下方', { exact: true, optionExact: true });
    assert.equal(await playgroundProgress.locator('.inkra-progress__body').getAttribute('data-content-position'), 'bottom');
    await playground.locator('.playground-toolbar').getByRole('tab', { name: '代码', exact: true }).click();
    assert((await playground.locator('code').textContent()).includes('contentPosition="bottom"'));
    await playground.locator('.playground-toolbar').getByRole('tab', { name: '预览', exact: true }).click();
    await setPlaygroundControls(playground, false);
    await page.screenshot({ path: `/tmp/inkra-progress-docs-${width}.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(async theme => {
      const { React: R, ReactDOM, ReactDOMClient, Progress } = await import('/scripts/fixtures/progress.mjs');
      document.querySelector('#root').style.display = 'none';
      const host = document.createElement('main');
      host.id = 'progress-fixture';
      host.dataset.inkraTheme = theme;
      Object.assign(host.style, { padding: '20px', width: '100%', boxSizing: 'border-box', background: 'var(--inkra-paper)', color: 'var(--inkra-ink)' });
      document.body.prepend(host);
      const root = ReactDOMClient.createRoot(host);
      window.renderProgress = props => ReactDOM.flushSync(() => root.render(R.createElement(Progress, {
        shape: 'circular', diameter: 128, value: 40, seed: 'ring-test', 'aria-label': 'Upload',
        children: ({ percent }) => percent === null ? '...' : `${Math.round(percent)}%`, ...props,
      })));
      window.renderProgress({});
      window.ringPaints = 0;
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        if (this.canvas.classList.contains('inkra-progress__ring-ink')) window.ringPaints++;
        return draw.apply(this, args);
      };
    }, theme);
    const progress = page.locator('#progress-fixture .inkra-progress');
    const ring = progress.locator('.inkra-progress__ring');
    const canvas = ring.locator('canvas');
    const ready = () => page.waitForFunction(() => document.querySelector('#progress-fixture .inkra-progress__ring-ink')?.dataset.ready === 'true');
    await ready();
    const pixels = await canvas.evaluate(node => node.toDataURL());
    assert(await canvas.evaluate(node => node.getContext('2d').getImageData(0, 0, node.width, node.height).data.some((value, index) => index % 4 === 3 && value > 0)));
    const before = await ring.boundingBox();
    assert.equal(before.width, 128);
    assert.equal(before.height, 128);
    await page.evaluate(() => { window.ringPaints = 0; });
    const coverage = [];
    for (const value of [0, 25, 50, 100, 75]) {
      await page.evaluate(value => window.renderProgress({ value }), value);
      assert.equal(await progress.getAttribute('aria-valuenow'), String(value));
      assert.equal(await progress.locator('.inkra-progress__content').textContent(), `${value}%`);
      assert.equal(await progress.evaluate(node => node.style.getPropertyValue('--inkra-progress-angle')), `${value * 3.6}deg`);
      assert.equal(await canvas.evaluate(node => node.toDataURL()), pixels, 'changing progress preserves pencil texture');
      const box = await ring.boundingBox();
      assert.equal(box.width, before.width);
      assert.equal(box.height, before.height);
      if (width === 1305) {
        const screenshot = await ring.screenshot();
        coverage.push(await page.evaluate(async data => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width; canvas.height = image.height;
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
          const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height);
          let count = 0;
          for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
            const radius = Math.hypot(x - canvas.width / 2, y - canvas.height / 2) / canvas.width;
            const offset = (y * canvas.width + x) * 4;
            if (radius > 0.32 && radius < 0.5 && Math.abs(pixels[offset] - pixels[0]) + Math.abs(pixels[offset + 1] - pixels[1]) + Math.abs(pixels[offset + 2] - pixels[2]) > 80) count++;
          }
          return count;
        }, screenshot.toString('base64')));
      }
    }
    if (coverage.length) {
      assert.equal(coverage[0], 0, '0% leaves the full gap');
      assert(coverage[3] > 500, 'complete ring has visible pixels');
      assert(coverage[1] / coverage[3] > 0.15 && coverage[1] / coverage[3] < 0.35, '25% paints approximately a quarter circle');
      assert(coverage[2] / coverage[3] > 0.4 && coverage[2] / coverage[3] < 0.6, '50% paints approximately a semicircle');
    }
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => window.ringPaints), 0, 'progress does not repaint the full ring');
    await page.evaluate(theme => { document.querySelector('#progress-fixture').dataset.inkraTheme = theme === 'light' ? 'dark' : 'light'; }, theme);
    await page.waitForFunction(before => document.querySelector('#progress-fixture canvas.inkra-progress__ring-ink').toDataURL() !== before, pixels);
    await page.evaluate(theme => { document.querySelector('#progress-fixture').dataset.inkraTheme = theme; }, theme);
    await page.waitForFunction(before => document.querySelector('#progress-fixture canvas.inkra-progress__ring-ink').toDataURL() === before, pixels);
    for (const dir of ['ltr', 'rtl']) {
      for (const contentPosition of ['center', 'top', 'bottom', 'start', 'end']) {
        await page.evaluate(props => window.renderProgress(props), { dir, contentPosition, children: '72%' });
        const { graphic, content } = await progress.evaluate(node => ({
          graphic: node.querySelector('.inkra-progress__ring').getBoundingClientRect().toJSON(),
          content: node.querySelector('.inkra-progress__content').getBoundingClientRect().toJSON(),
        }));
        if (contentPosition === 'center') {
          assert(Math.abs(content.x + content.width / 2 - graphic.x - graphic.width / 2) < 1);
          assert(Math.abs(content.y + content.height / 2 - graphic.y - graphic.height / 2) < 1);
        } else if (contentPosition === 'top') assert(content.y + content.height <= graphic.y);
        else if (contentPosition === 'bottom') assert(content.y >= graphic.y + graphic.height);
        else if ((contentPosition === 'start') === (dir === 'ltr')) assert(content.x + content.width <= graphic.x);
        else assert(content.x >= graphic.x + graphic.width);
      }
    }
    await page.evaluate(() => window.renderProgress({ value: null }));
    assert.equal(await progress.getAttribute('aria-valuenow'), null);
    assert.equal(await progress.locator('.inkra-progress__content').textContent(), '...');
    assert.notEqual(await ring.locator('.inkra-progress__ring-rotation').evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#progress-fixture .inkra-progress__ring-rotation')).animationName === 'none');
    assert.equal(await ring.locator('.inkra-progress__ring-rotation').evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.evaluate(() => window.renderProgress({ value: 72 }));
    await page.screenshot({ path: `/tmp/inkra-progress-ring-${width}-${theme}.png` });
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#progress-fixture .inkra-progress__ring-ink')).visibility === 'hidden');
    assert.equal(await canvas.evaluate(node => getComputedStyle(node).visibility), 'hidden');
    assert.equal(await ring.locator('svg').evaluate(node => getComputedStyle(node).visibility), 'visible');
    assert.equal(await progress.getAttribute('aria-valuenow'), '72');
    await page.emulateMedia({ forcedColors: 'none' });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#progress-fixture .inkra-progress__ring-ink')).visibility === 'visible');
    await page.evaluate(() => window.renderProgress({ diameter: 512, contentPosition: 'bottom', children: 'A longer description that wraps on narrow screens' }));
    const large = await ring.boundingBox();
    assert(Math.abs(large.width - large.height) < 1);
    assert(large.width <= width - 40);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const contentPosition of ['start', 'end']) {
      await page.evaluate(props => window.renderProgress(props), { diameter: 240, contentPosition, children: 'A longer external description with wrapping text' });
      const graphic = await ring.boundingBox();
      assert(graphic.width > 32 && Math.abs(graphic.width - graphic.height) < 1, JSON.stringify({ width, contentPosition, graphic }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.evaluate(() => window.renderProgress({ label: 'A long label above the circle', diameter: 96, children: '40%' }));
    // Compare a single layout snapshot; font loading can move both between protocol calls.
    const { labeledRing, center } = await progress.evaluate(node => ({
      labeledRing: node.querySelector('.inkra-progress__ring').getBoundingClientRect().toJSON(),
      center: node.querySelector('.inkra-progress__content').getBoundingClientRect().toJSON(),
    }));
    assert(Math.abs(center.x + center.width / 2 - labeledRing.x - labeledRing.width / 2) < 1,
      JSON.stringify({ width, theme, labeledRing, center }));
    assert(center.width < labeledRing.width, 'long external label cannot enlarge center content over the ring');
    await page.evaluate(() => window.renderProgress({ shape: 'linear', size: 'lg', value: 75, children: undefined }));
    assert.equal((await progress.locator('.inkra-progress__track').boundingBox()).height, 24);
    assert.equal((await progress.locator('.inkra-progress__track').boundingBox()).width, (await progress.boundingBox()).width);
    assert.equal(await ring.count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS circular Progress pixels, cached updates, positions, RTL, fallback, motion and linear compatibility: ${width}px ${theme}`);
  }
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (this.classList.contains('inkra-progress__ring-ink')) return null;
      return original.apply(this, args);
    };
  });
  await page.goto(`${base}/docs/components/progress#preview`);
  const fallbackPlayground = page.locator('.component-playground').first();
  await setPlaygroundControls(fallbackPlayground, true);
  await chooseDocsOption(fallbackPlayground, '展示形式', '环状', { exact: true, optionExact: true });
  await setPlaygroundControls(fallbackPlayground, false);
  const fallbackProgress = page.locator('.component-playground .inkra-progress').first();
  const fallback = fallbackProgress.locator('.inkra-progress__ring-fallback');
  await fallback.waitFor();
  assert.equal(await fallback.evaluate(node => getComputedStyle(node).visibility), 'visible');
  assert.equal(await fallbackProgress.getAttribute('aria-valuenow'), '48');
  await page.close();
  console.log('PASS circular canvas failure retains readable SVG and progress semantics');
} finally { await browser.close(); }
