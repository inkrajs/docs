import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const name of ['calendar', 'day-agenda', 'journey-map']) {
      await page.goto(`http://127.0.0.1:4180/components/${name}`);
      const playground = page.locator('.component-playground');
      await playground.waitFor();
      if (name === 'journey-map') {
        await page.getByRole('button', { name: '放大', exact: true }).waitFor();
        await page.waitForFunction(() => !document.querySelector('[aria-label="放大"]').disabled);
        await page.getByRole('button', { name: '放大', exact: true }).click();
        await page.getByRole('button', { name: '复位视图', exact: true }).click();
        await page.locator('.inkra-journey-map__places').getByRole('button', { name: 'Lake' }).click();
        assert.equal(await page.locator('.inkra-journey-map__places').getByRole('button', { name: 'Lake' }).getAttribute('aria-pressed'), 'true');
        assert(await page.locator('.inkra-journey-map__ink').evaluate(c => c.width && c.height && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0)));
      } else if (name === 'day-agenda') {
        await playground.getByRole('button', { name: /湖边散步/ }).click();
        assert.match(await page.locator('.travel-examples__detail').textContent(), /湖边散步/);
      } else {
        const day = playground.locator('.rdp-day_button').filter({ hasText: /^22$/ }).first();
        await day.click();
        await page.keyboard.press('ArrowRight');
        assert(await page.evaluate(() => document.activeElement.classList.contains('rdp-day_button')));
      }
      const box = await playground.boundingBox();
      await playground.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs((await playground.boundingBox()).height - box.height) < 1);
      const code = await playground.locator('code').textContent();
      await playground.getByRole('switch').first().click();
      assert.notEqual(await playground.locator('code').textContent(), code);
      await playground.getByRole('tab', { name: '预览', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at ${width}`);
      await page.waitForTimeout(400);
      if (name === 'journey-map') {
        const within = await page.locator('.inkra-journey-map__host').evaluate(host => {
          const box = host.getBoundingClientRect();
          return [...host.querySelectorAll('.inkra-journey-map__marker')].every(marker => { const r = marker.getBoundingClientRect(); return r.x >= box.x && r.y >= box.y && r.right <= box.right && r.bottom <= box.bottom; });
        });
        assert(within, 'map markers remain framed after hidden code update');
      }
      await page.screenshot({ path: `/tmp/inkra-travel-${name}-${width}.png`, fullPage: true });
      await page.locator('.page-tabs').getByRole('tab', { name: 'API', exact: true }).click();
      assert(await page.locator('.component-api table').isVisible());
      await page.locator('.page-tabs').getByRole('tab', { name: '无障碍', exact: true }).click();
      assert((await page.locator('.component-api p').textContent()).length > 30);
    }
    console.log(`PASS travel components at ${width}: selection, live code, stable height, no page overflow`);
  }
  await page.evaluate(() => localStorage.setItem('inkra-docs-theme', 'dark'));
  await page.setViewportSize({ width: 1302, height: 954 });
  for (const name of ['calendar', 'day-agenda', 'journey-map']) {
    await page.goto(`http://127.0.0.1:4180/components/${name}`);
    await page.locator('.component-playground').waitFor();
    if (name === 'journey-map') await page.waitForFunction(() => !document.querySelector('[aria-label="放大"]').disabled);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/inkra-travel-${name}-dark.png`, fullPage: true });
    assert(await page.locator('.preview-display canvas').evaluateAll(nodes => nodes.some(c => c.width && c.height && c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0))));
  }
  assert.deepEqual(errors, []);
  console.log('PASS dark rendering and no browser errors');
} finally { await browser.close(); }
