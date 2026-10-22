import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
const controls = page.getByRole('group', { name: '属性', exact: true });
async function choose(label, option) {
  await controls.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
async function toggle(name) { await controls.getByRole('switch', { name, exact: true }).click(); }
async function range(name, value) {
  await controls.getByRole('slider', { name, exact: true }).fill(String(value));
}
async function source() {
  await page.locator('.component-playground').getByRole('tab', { name: '代码', exact: true }).click();
  return page.locator('.component-playground code').textContent();
}
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto(`${base}/components/tabs`);
    await choose('尺寸', 'Large');
    await choose('对齐', 'Center');
    await choose('阅读方向', 'RTL');
    await toggle('等宽铺满');
    await toggle('显示图标');
    await toggle('绘制动画');
    await toggle('循环导航');
    await toggle('保留面板内容');
    const demo = page.locator('.preview-display .tabs-demo');
    assert.equal(await demo.getAttribute('data-size'), 'lg');
    assert.equal(await demo.getAttribute('dir'), 'rtl');
    const buttons = demo.getByRole('tab');
    const boxes = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
    assert(Math.abs(boxes[0].width - boxes[1].width) < 1);
    assert(boxes.every(box => box.height >= 44));
    await buttons.nth(1).click();
    assert.equal(await demo.locator('.inkra-tabs__selection').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations()).length), 0);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(80);
    assert.equal(await buttons.nth(1).getAttribute('aria-selected'), 'true');
    assert.equal(await demo.locator('.inkra-tabs__content[hidden]').count(), 1);
    const height = (await page.locator('.component-playground').boundingBox()).height;
    const code = await source();
    assert(code.includes('animated={false}') && code.includes('loop={false}') && code.includes('fullWidth={true}') && code.includes('startIcon='));
    assert(Math.abs((await page.locator('.component-playground').boundingBox()).height - height) < 1);
    await page.locator('.component-playground').getByRole('tab', { name: '预览', exact: true }).click();
    await page.screenshot({ path: `/tmp/inkra-props-tabs-${width}.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 1302, height: 954 });
  await page.goto(`${base}/components/tooltip`);
  await choose('对齐', 'End');
  await range('显示延迟', 0);
  await range('圆角', 0);
  await toggle('边缘避让');
  await toggle('悬停内容保持打开');
  await page.locator('.preview-display button').hover();
  await page.getByRole('tooltip').waitFor();
  assert.equal(await page.locator('.inkra-tooltip__content').getAttribute('data-align'), 'end');
  await page.keyboard.press('Escape');
  assert((await source()).includes('delayDuration={0} disableHoverableContent={true}'));
  await page.goto(`${base}/components/accordion`);
  await toggle('禁用第二项');
  await toggle('显示分割线');
  await toggle('显示图标');
  const accordion = page.locator('.preview-display .inkra-accordion');
  assert(await accordion.getByRole('button').nth(1).isDisabled());
  assert.equal(await accordion.locator('.inkra-accordion__divider').count(), 0);
  assert.equal(await accordion.locator('.inkra-accordion__trigger-icon').count(), 0);
  await accordion.getByRole('button').nth(2).click();
  assert((await source()).includes('value={"three"}'));
  await page.goto(`${base}/components/badge`);
  await choose('尺寸', 'Large');
  await choose('图标位置', 'End');
  assert.equal(await page.locator('.preview-display .inkra-badge').getAttribute('data-size'), 'lg');
  assert.equal(await page.locator('.preview-display .inkra-badge__icon').count(), 1);
  assert((await source()).includes('endIcon='));
  await page.goto(`${base}/components/separator`);
  await range('笔触粗细', 2);
  assert((await source()).includes('weight={2}'));
  await page.goto(`${base}/components/skeleton`);
  await range('圆角', 0);
  assert((await source()).includes('radius={0}'));
  await page.goto(`${base}/components/progress`);
  await choose('展示形式', '条形');
  await choose('尺寸', 'Large');
  await choose('阅读方向', 'RTL');
  await controls.getByRole('tab', { name: '内容', exact: true }).click();
  await range('最大值', 200);
  await range('当前值', 150);
  const progress = page.locator('.preview-display [role="progressbar"]');
  assert.equal(await progress.getAttribute('aria-valuemax'), '200');
  assert.equal(await progress.getAttribute('aria-valuenow'), '150');
  assert.equal((await progress.locator('.inkra-progress__track').boundingBox()).height, 24);
  assert.equal(await progress.locator('.inkra-progress__content').textContent(), '75%');
  await controls.getByRole('tab', { name: '基础', exact: true }).click();
  await controls.getByRole('textbox', { name: '名称', exact: true }).fill('');
  assert((await source()).includes('aria-label="Progress"'));
  assert.deepEqual(errors, []);
  console.log('PASS expanded properties: Tabs layout/icons/animation/loop, Tooltip, Accordion, Badge, Separator, Skeleton, Progress; responsive layout and live code');
} finally { await browser.close(); }
