import assert from 'node:assert/strict';
import { chooseDocsOption } from './playground-test-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1302, 390]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/components/button#preview');
    await page.reload();
    const playground = page.locator('.playground').first();
    const button = page.locator('#button-demo-panel-preview > .inkra-button');
    const select = async (scope, label, value) => {
      await chooseDocsOption(scope, label, value);
    };
    const toggle = async (scope, name) => {
      const control = scope.getByRole('switch', { name, exact: true });
      const previous = await control.isChecked();
      await control.click();
      await page.waitForFunction(({ element, previous }) => element.checked !== previous, { element: await control.elementHandle(), previous });
    };
    await select(playground, '加载位置', '起始');
    await toggle(playground, '首尾图标');
    const before = await button.boundingBox();
    await toggle(playground, '加载中');
    await page.locator('#button-demo-panel-preview > .inkra-button:disabled').waitFor();
    const after = await button.boundingBox();
    assert(Math.abs(before.width - after.width) < 1 && Math.abs(before.height - after.height) < 1, 'loading preserves geometry');
    assert.equal(await button.locator('.inkra-button__label').evaluate(node => getComputedStyle(node).opacity), '1');
    assert.equal(await button.isDisabled(), true);
    await toggle(playground, '撑满宽度');
    await page.locator('#button-demo-panel-preview > .inkra-button[data-full-width="true"]').waitFor();
    await select(playground, '内容对齐', '末尾');
    await select(playground, '文字方向', 'RTL');
    assert.equal(await button.locator('.inkra-button__surface').evaluate(node => getComputedStyle(node).justifyContent), 'flex-end');
    await toggle(playground, '自定义加载图标');
    await button.locator('.inkra-button__loading-indicator canvas').waitFor({ state: 'attached' });
    assert.equal(await button.locator('.inkra-button__loading-indicator .inkra-button__spinner').count(), 0);
    const previewHeight = (await playground.boundingBox()).height;
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.match(await playground.locator('code').textContent(), /fullWidth.*align="end".*loadingPosition="start"/);
    assert(Math.abs((await playground.boundingBox()).height - previewHeight) < 1);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    const groups = page.locator('.comparison-list .component-playground').first();
    const group = groups.getByRole('group', { name: '文本对齐', exact: true });
    const sizes = await group.locator(':scope > .inkra-button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
    assert(Math.max(...sizes) - Math.min(...sizes) < 1, 'equal group widths');
    await toggle(groups, '禁用');
    await group.locator('button:disabled').first().waitFor();
    assert.equal(await group.locator('button:disabled').count(), 3);
    await select(groups, '尺寸', 'sm');
    await group.locator('button[data-size="sm"]').first().waitFor();
    assert.equal(await group.locator('button[data-size="sm"]').count(), 3);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await playground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-button-props-${width}.png` });
    console.log(`PASS Button and ButtonGroup at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
