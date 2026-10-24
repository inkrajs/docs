import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const pixels = node => {
  const canvas = node.querySelector('canvas');
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = Array.from(data).filter((_, index) => index % 4 === 3);
  return { painted: alpha.filter(value => value > 0).length, clear: alpha.filter(value => value === 0).length, max: Math.max(...alpha), hash: alpha.reduce((sum, value, index) => (sum + value * (index + 1)) % 2147483647, 0) };
};
try {
  for (const width of [1305, 390]) {
    await page.setViewportSize({ width, height: 954 });
    for (const theme of ['light', 'dark']) {
      await page.goto(`${base}/docs/components/skeleton#preview`);
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
      const skeleton = page.locator('.component-playground .inkra-skeleton');
      await skeleton.waitFor();
      await page.waitForFunction(() => {
        const canvas = document.querySelector('.component-playground .inkra-skeleton canvas');
        return canvas?.width > 0 && canvas?.height > 0;
      });
      await page.waitForTimeout(250);
      assert.match(await skeleton.getAttribute('class'), /surface--selection/);
      const sample = await skeleton.evaluate(pixels);
      assert(sample.painted > 20 && sample.clear > 20, 'pencil pigment and exposed paper');
      assert(sample.max < 200, 'no opaque paper backing or dark outline');
      assert.equal(await skeleton.evaluate(node => getComputedStyle(node).borderTopWidth), '0px');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('.component-playground').screenshot({ path: `/tmp/inkra-skeleton-${theme}-${width}.png` });
    }
  }
  await page.evaluate(async () => {
    document.getElementById('root').style.display = 'none';
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/skeleton.tsx');
    window.unmountSkeleton = mount(container);
  });
  const rounded = page.locator('[data-radius]');
  await rounded.last().waitFor();
  await page.waitForTimeout(250);
  const hashes = [];
  for (const radius of [0, 6, 8]) {
    const node = page.locator(`[data-radius="${radius}"]`);
    assert.equal(await node.evaluate(element => getComputedStyle(element).borderRadius), `${radius}px`);
    assert.equal((await node.boundingBox()).height, 64);
    hashes.push((await node.evaluate(pixels)).hash);
  }
  assert.equal(new Set(hashes).size, 3, 'radius changes actual wash pixels');
  const pulse = page.locator('body > div .inkra-skeleton[data-animation="pulse"]').last();
  assert.equal(await pulse.evaluate(node => getComputedStyle(node).animationName), 'inkra-skeleton-pulse');
  for (const media of [{ reducedMotion: 'reduce' }, { reducedMotion: 'no-preference', forcedColors: 'active' }, { forcedColors: 'none', media: 'print' }]) {
    await page.emulateMedia(media);
    assert.equal(await pulse.evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await pulse.evaluate(node => getComputedStyle(node).borderTopWidth), '0px');
  }
  await page.emulateMedia({ media: 'screen' });
  await rounded.first().evaluate(node => {
    node.dataset.pencilFallback = 'true';
    node.querySelector('canvas').style.display = 'none';
  });
  assert.equal(await rounded.first().evaluate(node => getComputedStyle(node).borderTopWidth), '0px');
  assert.notEqual(await rounded.first().evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => window.unmountSkeleton());
  assert.deepEqual(errors, []);
  console.log('PASS borderless Skeleton: light/dark, desktop/mobile, pencil pixels, radius, pulse, reduced motion, print and fallback');
} finally {
  await browser.close();
}
