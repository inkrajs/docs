import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    const failedResources = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) failedResources.push(response.url());
    });
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    const response = await page.goto(new URL('/', baseURL).href);
    assert.equal(response.status(), 200);
    await page.locator('.home-showcase').waitFor();
    const demos = page.locator('.home-deferred-demo');
    assert.equal(await demos.count(), 19, 'All homepage placeholders are present');
    for (let index = 0; index < 19; index++) {
      const demo = demos.nth(index);
      await demo.scrollIntoViewIfNeeded();
      await demo.locator('.home-demo-content[data-revealed="true"]').waitFor({ state: 'visible' });
    }
    assert.equal(await page.locator('.home-demo-content > .home-specimen').count(), 18);
    assert.equal(await page.locator('.home-new-postcard').count(), 1);
    await page.locator('.home-map').evaluate(node => node.closest('.home-deferred-demo').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.locator('.home-map .leaflet-marker-icon').first().waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.home-map .inkra-journey-map__ink');
      if (!canvas?.width || !canvas.height) return false;
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      return data.some((value, index) => index % 4 === 3 && value > 20);
    });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.home-specimen').count(), 20, 'Includes both Flip faces');
    assert(await page.locator('.inkra-journey-map__ink').evaluate(canvas => {
      const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      return data.some((value, index) => index % 4 === 3 && value > 20);
    }));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-deployed-${width}.png`, fullPage: true });
    for (const path of ['/docs', '/docs/getting-started', '/docs/internationalization',
      '/docs/theming', '/docs/components/button#preview',
      '/docs/components/calendar/', '/docs/components/journey-map#preview',
      '/components/breadcrumb#preview']) {
      const result = await page.goto(new URL(path, baseURL).href);
      assert.equal(result.status(), 200, `Direct route ${path}`);
      await page.locator('.documentation h1').waitFor();
      assert.equal((await page.reload()).status(), 200, `Refresh ${path}`);
      await page.locator('.documentation h1').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path);
    }
    for (const [path, selector] of [
      ['/blog', '.blog-index'],
      ['/blog/from-travel-journal-to-inkra', '.blog-article'],
      ['/ecosystem', '.ecosystem-page__empty'],
    ]) {
      assert.equal((await page.goto(new URL(path, baseURL).href)).status(), 200, `Direct route ${path}`);
      await page.locator(selector).waitFor();
      assert.equal((await page.reload()).status(), 200, `Refresh ${path}`);
      await page.locator(selector).waitFor();
      for (const image of await page.locator(`${selector} img`).all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(node => node.decode());
        assert(await image.evaluate(node => node.naturalWidth > 0), `Image on ${path}`);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failedResources, []);
    console.log(`Deployment routes, assets, map and layout passed at ${width}px: ${baseURL}`);
    await page.close();
  }
} finally {
  await browser.close();
}
