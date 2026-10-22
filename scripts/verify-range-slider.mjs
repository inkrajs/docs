import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';

async function expectValue(slider, value) {
  await slider.page().waitForFunction(({ node, value }) => Number(node.getAttribute('aria-valuenow')) === value, {
    node: await slider.elementHandle(),
    value,
  });
}

async function choose(page, scope, name, value) {
  await scope.getByRole('combobox', { name, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

async function toggle(scope, name) {
  await scope.getByRole('switch', { name, exact: true }).click();
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    await page.goto(`${baseUrl}/components/range-slider#preview`);

    const playground = page.locator('.component-playground').first();
    const stage = playground.locator('.preview-stage');
    const lower = stage.getByRole('slider', { name: '最低价格', exact: true });
    const upper = stage.getByRole('slider', { name: '最高价格', exact: true });
    await lower.waitFor();
    assert.equal(await stage.getByRole('slider').count(), 2);
    await expectValue(lower, 20);
    await expectValue(upper, 80);
    assert.equal(await lower.getAttribute('aria-valuetext'), '$20');
    assert.equal(await upper.getAttribute('aria-valuetext'), '$80');

    await lower.focus();
    for (let index = 0; index < 15; index += 1) await page.keyboard.press('ArrowRight');
    await expectValue(lower, 70);
    await expectValue(upper, 80);

    const controls = playground.getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('tab', { name: '交互', exact: true }).click();
    await choose(page, playground, '最小间距', '20');
    await lower.focus();
    for (let index = 0; index < 20; index += 1) await page.keyboard.press('ArrowRight');
    await expectValue(lower, 60);
    await expectValue(upper, 80);

    await toggle(playground, '允许端点交叉');
    await lower.focus();
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await expectValue(stage.getByRole('slider').nth(0), 80);
    await expectValue(stage.getByRole('slider').nth(1), 100);

    await controls.getByRole('tab', { name: '基础', exact: true }).click();
    await choose(page, playground, '阅读方向', 'RTL');
    const first = stage.getByRole('slider').nth(0);
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expectValue(first, 75);

    await controls.getByRole('tab', { name: '状态', exact: true }).click();
    await toggle(playground, '禁用');
    assert.equal(await first.getAttribute('tabindex'), null);
    assert.equal(await first.getAttribute('data-disabled'), '');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    await playground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-range-slider-${width}.png`, animations: 'disabled' });
    await page.close();
    console.log(`PASS RangeSlider two-thumb naming, distance, crossing, keyboard, RTL, disabled and responsive layout at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
