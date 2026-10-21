import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';

async function valueIs(locator, value) {
  await locator.page().waitForFunction(({ element, value }) => {
    const valueText = element.getAttribute('aria-valuetext');
    return Number(element.getAttribute('aria-valuenow')) === value && (valueText === null || Number.parseFloat(valueText) === value);
  }, { element: await locator.elementHandle(), value });
}

async function choose(page, scope, name, value) {
  await scope.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

async function toggle(scope, name) {
  const toggle = scope.getByRole('switch', { name, exact: true });
  const current = await toggle.isChecked();
  await toggle.click();
  await toggle.page().waitForFunction(({ element, current }) => element.checked !== current, { element: await toggle.elementHandle(), current });
}

async function insetThumbInsideTrack(stage, orientation) {
  await stage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const { rail, thumbs } = await stage.evaluate(element => ({
    rail: element.querySelector('.inkra-slider__track').getBoundingClientRect().toJSON(),
    thumbs: [...element.querySelectorAll('.inkra-slider__thumb')].map(thumb => ({
      hit: thumb.getBoundingClientRect().toJSON(),
      visual: thumb.querySelector('.inkra-slider__thumb-surface').getBoundingClientRect().toJSON(),
    })),
  }));
  for (const { hit, visual } of thumbs) {
    assert(hit.width >= 44 && hit.height >= 44, '44px thumb target');
    assert(orientation === 'horizontal' ? rail.height > visual.height : rail.width > visual.width, 'inset rail exceeds thumb thickness');
    assert(visual.x >= rail.x - 1 && visual.y >= rail.y - 1 && visual.x + visual.width <= rail.x + rail.width + 1 && visual.y + visual.height <= rail.y + rail.height + 1, `inset thumb remains entirely in rail: ${JSON.stringify({ rail, visual, hit, orientation })}`);
  }
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/slider#preview`);
      const playground = page.locator('.component-playground').first();
      const stage = playground.locator('.preview-stage');
      const thumb = stage.getByRole('slider');
      await thumb.waitFor();
      await valueIs(thumb, 40);
      await thumb.focus();
      await page.keyboard.press('ArrowRight');
      await valueIs(thumb, 41);
      assert.equal(await thumb.getAttribute('aria-valuetext'), '41%');
      await page.keyboard.press('Shift+ArrowRight');
      await valueIs(thumb, 51);
      await page.keyboard.press('Home');
      await valueIs(thumb, 0);
      await page.keyboard.press('End');
      await valueIs(thumb, 100);
      assert.match(await stage.locator('.slider-demo__commit').textContent(), /100/);
      await choose(page, playground, '阅读方向', 'RTL');
      await thumb.focus();
      await page.keyboard.press('ArrowRight');
      await valueIs(thumb, 99);
      await choose(page, playground, '排列', '纵向');
      await thumb.focus();
      await page.keyboard.press('ArrowUp');
      await valueIs(thumb, 100);
      assert.equal(await thumb.getAttribute('aria-orientation'), 'vertical');
      await choose(page, playground, '排列', '横向');
      await choose(page, playground, '阅读方向', 'LTR');
      await toggle(playground, '禁用');
      await thumb.focus();
      await page.keyboard.press('ArrowLeft');
      await valueIs(thumb, 100);
      assert.equal(await thumb.getAttribute('tabindex'), null);
      await toggle(playground, '禁用');
      const track = stage.locator('.inkra-slider__track');
      await track.scrollIntoViewIfNeeded();
      const box = await track.boundingBox();
      await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2);
      const clickedValue = Number(await thumb.getAttribute('aria-valuenow'));
      assert(clickedValue >= 55 && clickedValue <= 65, 'track click updates value');
      await choose(page, playground, '外观', '内嵌滑块');
      for (const size of ['Small', 'Medium', 'Large']) {
        await choose(page, playground, '尺寸', size);
        for (const [orientation, label] of [['horizontal', '横向'], ['vertical', '纵向']]) {
          await choose(page, playground, '排列', label);
          for (const dir of ['LTR', 'RTL']) {
            await choose(page, playground, '阅读方向', dir);
            for (const [key, value] of [['Home', 0], ['End', 100]]) {
              await thumb.focus();
              await page.keyboard.press(key);
              await valueIs(thumb, value);
              await insetThumbInsideTrack(stage, orientation);
            }
          }
        }
      }
      await choose(page, playground, '尺寸', 'Medium');
      await choose(page, playground, '排列', '横向');
      await choose(page, playground, '阅读方向', 'LTR');
      await toggle(playground, '范围选择');
      await stage.getByRole('slider', { name: '下限', exact: true }).waitFor();
      const lower = stage.getByRole('slider', { name: '下限', exact: true });
      const upper = stage.getByRole('slider', { name: '上限', exact: true });
      await valueIs(lower, 20);
      await valueIs(upper, 80);
      assert.equal(await stage.getByRole('slider').count(), 2);
      await lower.focus();
      await page.keyboard.press('Home');
      await valueIs(lower, 0);
      await upper.focus();
      await page.keyboard.press('End');
      await valueIs(upper, 100);
      await insetThumbInsideTrack(stage, 'horizontal');
      await playground.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-slider-inset-${width}.png`, animations: 'disabled' });
      await choose(page, playground, '外观', '标准滑块');
      const formExample = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '表单与重置', exact: true }) });
      const volume = formExample.getByRole('slider', { name: '音量', exact: true });
      const rangeLower = formExample.getByRole('slider', { name: '下限', exact: true });
      const rangeUpper = formExample.getByRole('slider', { name: '上限', exact: true });
      await volume.focus();
      await page.keyboard.press('ArrowRight');
      await valueIs(volume, 26);
      assert.equal(await volume.getAttribute('aria-valuetext'), '26%');
      await rangeLower.focus();
      for (let index = 0; index < 15; index += 1) await page.keyboard.press('ArrowRight');
      await valueIs(rangeLower, 70);
      await valueIs(rangeUpper, 80);
      await formExample.getByRole('button', { name: '读取表单', exact: true }).click();
      assert.equal(await formExample.locator('output').textContent(), '{"level":"26","range":["70","80"]}');
      await formExample.getByRole('button', { name: '重置', exact: true }).click();
      await valueIs(volume, 25);
      await valueIs(rangeLower, 20);
      await valueIs(rangeUpper, 80);
      assert.equal(await volume.getAttribute('aria-valuetext'), '25%');
      assert.equal(await formExample.locator('.inkra-slider__range').first().evaluate(element => element.style.clipPath), 'inset(0px 75% 0px 0%)');
      assert.equal(await formExample.locator('.inkra-slider__range').nth(1).evaluate(element => element.style.clipPath), 'inset(0px 20%)');
      assert.equal(await formExample.locator('output').textContent(), '');
      await formExample.getByRole('button', { name: '读取表单', exact: true }).click();
      assert.equal(await formExample.locator('output').textContent(), '{"level":"25","range":["20","80"]}');
      await formExample.locator('form').evaluate(element => { element.dir = 'rtl'; });
      await page.waitForFunction(element => element.getAttribute('dir') === 'rtl', await formExample.locator('.inkra-slider').first().elementHandle());
      await volume.focus();
      await page.keyboard.press('ArrowRight');
      await valueIs(volume, 24);
      assert.equal(await volume.getAttribute('aria-valuetext'), '24%');
      const before = (await playground.boundingBox()).height;
      await playground.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs((await playground.boundingBox()).height - before) < 1, 'code view height stable');
      assert.match(await playground.locator('code').textContent(), /minStepsBetweenThumbs/);
      await playground.getByRole('tab', { name: '预览', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
      await playground.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-slider-${width}.png`, animations: 'disabled' });
      await page.goto(`${baseUrl}/components/popover#preview`);
      const offset = page.locator('.component-playground').getByRole('slider', { name: '偏移', exact: true });
      await offset.focus();
      await page.keyboard.press('ArrowRight');
      await valueIs(offset, 12);
      await page.locator('.component-playground').getByRole('tab', { name: '代码', exact: true }).click();
      assert.match(await page.locator('.component-playground code').textContent(), /sideOffset=\{12\}/);
      assert.equal(await page.locator('input[type="range"]').count(), 0, 'Popover no native ranges');
      console.log(`PASS Slider keyboard/RTL/vertical/pointer/disabled/range/reset/Popover integration, ${width}px`);
    } finally { await page.close(); }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
