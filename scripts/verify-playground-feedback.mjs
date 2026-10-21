import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['journey-map', 'input', 'slider', 'input-number']) {
      await page.goto(`http://127.0.0.1:4180/components/${route}#preview`);
      const playground = page.locator('.component-playground').first();
      await playground.waitFor();
      const display = playground.locator('.preview-display');
      const controls = playground.locator('.preview-controls');
      if (width > 768) {
        assert.equal(Math.round((await controls.boundingBox()).height), Math.round((await display.boundingBox()).height), `${route} controls fill preview row`);
      } else {
        assert.equal(await controls.evaluate(node => node.scrollHeight), await controls.evaluate(node => node.clientHeight), `${route} mobile controls flow naturally`);
      }
      const height = (await playground.boundingBox()).height;
      await playground.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs((await playground.boundingBox()).height - height) < 1, `${route} stable preview/code height`);
      await playground.getByRole('tab', { name: '预览', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (route === 'journey-map') await page.screenshot({ path: `/tmp/inkra-map-controls-${width}.png` });
    }
    await page.goto('http://127.0.0.1:4180/components/popover#preview');
    const trigger = page.getByRole('button', { name: '编辑名称', exact: true });
    await trigger.click();
    await page.keyboard.press('Escape');
    assert(await trigger.evaluate(node => node === document.activeElement));
    await page.keyboard.press('Tab');
    await trigger.focus();
    await page.waitForFunction(() => {
      const node = [...document.querySelectorAll('button')].find(button => button.textContent === '编辑名称');
      return node && getComputedStyle(node.querySelector('.inkra-button__focus-ring')).opacity === '1';
    });
    assert.equal(await trigger.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
    await trigger.screenshot({ path: `/tmp/inkra-popover-focus-${width}.png` });
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await trigger.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
    await page.emulateMedia({ forcedColors: 'none' });
    await page.goto('http://127.0.0.1:4180/components/button#preview');
    const button = page.locator('#button-demo-panel-preview > .inkra-button');
    await button.waitFor();
    await page.waitForTimeout(250);
    assert(await button.locator('.inkra-button__surface > canvas').evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some((value, i) => i % 4 === 3 && value > 0);
    }), 'button material canvas is nonblank');
    await button.screenshot({ path: `/tmp/inkra-button-wash-${width}.png` });
    console.log(`PASS playground heights, Button wash and Popover keyboard focus at ${width}px`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
