import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  for (const width of [1305, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 954 } });
    const errors = [];
    const openedUrls = [];
    await context.route('https://github.com/**', route => {
      openedUrls.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>GitHub destination fixture</title>' });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/components/input-number#preview');
    const link = page.locator('.header-github');
    const label = 'GitHub 仓库（新标签页打开）';
    await page.getByRole('link', { name: label, exact: true }).waitFor();
    assert.equal(await link.getAttribute('data-variant'), 'outline', 'Border is present without hover or focus');
    assert.equal(await link.getAttribute('href'), 'https://github.com/inkrajs/inkra');
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.match(await link.getAttribute('rel'), /noopener/);
    const box = await link.boundingBox();
    assert(box.width >= 44 && box.height >= 44, 'At least 44px hit target');
    const search = await page.locator('.header-search').boundingBox();
    if (width > 768) assert(box.x >= search.x + search.width, 'GitHub follows search');
    else {
      assert(box.x + box.width <= width, 'GitHub remains inside narrow header');
      assert(search.y >= box.y + box.height, 'Search has its own narrow-screen row');
    }
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.header-github canvas.inkra-pencil-icon');
      if (!canvas?.width || !canvas.height) return false;
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels.some((value, index) => index % 4 === 3 && value > 0);
    });
    await link.hover();
    await page.getByRole('tooltip', { name: label, exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('tooltip').waitFor({ state: 'hidden' });
    await link.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    assert(await link.evaluate(node => node === document.activeElement && node.matches(':focus-visible')));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-header-github-${width}.png` });
    const popupPromise = context.waitForEvent('page');
    await link.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.deepEqual(openedUrls, ['https://github.com/inkrajs/inkra']);
    assert.equal(await popup.evaluate(() => window.opener), null);
    assert.match(page.url(), /components\/input-number#preview$/);
    await popup.close();
    await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'en'));
    await page.reload();
    await page.getByRole('link', { name: 'GitHub repository (opens in a new tab)', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width}px: layout, pencil pixels, tooltip, keyboard, new-tab destination and bilingual label`);
  }
} finally {
  await browser.close();
}
