import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const presets = ['inbox', 'search', 'folder', 'documents', 'messages', 'image', 'offline', 'favorites'];
const pixelHash = canvas => {
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let painted = 0, hash = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i]) painted++;
    hash = (hash + (pixels[i] + pixels[i - 1] + pixels[i - 2] + pixels[i - 3]) * i) % 2147483647;
  }
  return { painted, clear: pixels.length / 4 - painted, hash };
};
try {
  await page.goto(base);
  for (const width of [1305, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const locale of ['zh-CN', 'en']) {
      await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      await page.goto(`${base}/docs/components/empty#preview`);
      await page.reload();
      const playground = page.locator('.component-playground');
      await playground.waitFor();
      const illustration = playground.locator('.inkra-empty__icon[data-illustration]');
      await illustration.locator('canvas[data-pencil-icon-ready]').first().waitFor();
      assert.equal(Math.round((await illustration.boundingBox()).width), 160);
      const hashes = [];
      for (const preset of presets) {
        const icon = page.locator(`.empty-illustration-gallery [data-illustration="${preset}"]`);
        await icon.scrollIntoViewIfNeeded();
        await icon.locator('canvas[data-pencil-icon-ready]').last().waitFor();
        const pixels = await icon.locator('canvas').last().evaluate(pixelHash);
        assert(pixels.painted > 100 && pixels.clear > 100, `${preset} pigment and exposed paper`);
        hashes.push(pixels.hash);
        assert.equal(await icon.locator('svg').last().isVisible(), false);
      }
      assert.equal(new Set(hashes).size, 8);
      const before = await illustration.locator('canvas').last().evaluate(pixelHash);
      for (const theme of ['dark', 'light']) {
        await page.evaluate(theme => {
          document.documentElement.setAttribute('data-theme', theme);
          document.documentElement.setAttribute('data-inkra-theme', theme);
        }, theme);
        await page.waitForTimeout(300);
        const actual = await illustration.locator('canvas').last().evaluate(pixelHash);
        if (theme === 'dark') assert.notEqual(actual.hash, before.hash, 'theme changes actual ink');
        await playground.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `/tmp/inkra-empty-${theme}-${locale}-${width}.png` });
        await page.locator('.empty-illustration-gallery').screenshot({ path: `/tmp/inkra-empty-gallery-${theme}-${locale}-${width}.png` });
      }
      await setPlaygroundControls(playground, true);
      const controls = playground.locator('.preview-controls');
      await controls.getByRole('combobox', { name: locale === 'zh-CN' ? '插画' : 'Illustration', exact: true }).click();
      await page.getByRole('option', { name: locale === 'zh-CN' ? '无搜索结果' : 'No results', exact: true }).click();
      await setPlaygroundControls(playground, false);
      assert.equal(await illustration.getAttribute('data-illustration'), 'search');
      await playground.getByRole('tab', { name: locale === 'zh-CN' ? '代码' : 'Code', exact: true }).click();
      assert.match(await playground.locator('.code-panel code').textContent(), /illustration="search"/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  await page.evaluate(async () => {
    document.getElementById('root').style.display = 'none';
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/empty.tsx');
    window.unmountEmpty = mount(container);
  });
  await page.locator('[data-test-size="lg"] canvas[data-pencil-icon-ready]').first().waitFor();
  for (const [size, expected] of [['sm', 112], ['md', 160], ['lg', 192]]) {
    assert.equal(Math.round((await page.locator(`[data-test-size="${size}"] .inkra-empty__icon`).boundingBox()).width), expected);
  }
  assert.equal(Math.round((await page.locator('[data-test-custom-size] .inkra-empty__icon').boundingBox()).width), 144);
  assert.equal(await page.getByRole('img', { name: 'No results' }).count(), 1);
  assert((await page.locator('[data-test-narrow] .inkra-empty__icon').boundingBox()).width <= 36);
  assert.equal(await page.locator('[data-test-custom] canvas').count(), 0);
  assert.equal(await page.locator('[data-test-custom] svg').count(), 1);
  assert.equal(await page.locator('[data-test-null] > *').count(), 0);
  const layer = page.locator('[data-test-size="md"] .inkra-empty__illustration-layer').last();
  await layer.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('contextlost')));
  assert.equal(await layer.locator('svg').isVisible(), true, 'context loss restores SVG');
  for (const media of [{ forcedColors: 'active' }, { forcedColors: 'none', media: 'print' }]) {
    await page.emulateMedia(media);
    assert.equal(await page.locator('[data-test-size="lg"] svg').last().isVisible(), true);
    assert.equal(await page.locator('[data-test-size="lg"] canvas').last().isVisible(), false);
  }
  await page.emulateMedia({ forcedColors: 'none', media: 'screen' });
  await page.evaluate(() => window.unmountEmpty());
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.reload();
  await page.goto(`${base}/docs/components/empty#preview`);
  const fallback = page.locator('.component-playground .inkra-empty__illustration-fallback').last();
  await fallback.waitFor();
  assert.equal(await fallback.isVisible(), true, 'no context preserves visible SVG');
  assert.deepEqual(errors, []);
  console.log('PASS Empty: 8 distinct pencil illustrations, sizes, overrides, locales, themes, narrow layout, SVG fallback, context loss, print and forced colors');
} finally { await browser.close(); }
