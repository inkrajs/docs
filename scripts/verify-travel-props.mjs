import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const choose = async (label, option) => {
  await chooseDocsOption(page, label, option, { exact: true, optionExact: true });
  await page.getByRole('listbox').waitFor({ state: 'hidden' });
};
const toggle = name => page.getByRole('switch', { name, exact: true }).click();
const playground = page.locator('.component-playground');
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/components/calendar');
    await choose('标记样式', '圆点');
    assert(await playground.locator('[data-indicator="dot"]').count() > 0);
    await choose('标记样式', '隐藏');
    assert.equal(await playground.locator('.inkra-calendar__event').count(), 0);
    await playground.getByRole('button', { name: /湖边散步/ }).first().waitFor();
    await toggle('显示周数');
    const dayBox = await playground.locator('.rdp-day_button').first().boundingBox();
    assert(dayBox.width >= 44 && dayBox.height >= 44);
    assert(await playground.locator('.rdp-week_number').count() > 0);
    await choose('显示月份数', '2');
    assert.equal(await playground.locator('.rdp-month').count(), 2);
    await choose('选择模式', '日期范围');
    await toggle('显示相邻月日期');
    await page.screenshot({ path: `/tmp/inkra-travel-props-calendar-${width}.png`, fullPage: true });
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.match(await playground.locator('code').textContent(), /numberOfMonths=\{2\}.*showWeekNumber=\{true\}/);
    assert.match(await playground.locator('code').textContent(), /eventIndicator="none"/);

    await page.goto('http://127.0.0.1:4180/components/day-agenda');
    await choose('时间格式', '12 小时');
    await choose('内容密度', '紧凑');
    await toggle('显示事件说明');
    await toggle('事件分割线');
    assert.equal(await playground.locator('.inkra-agenda__description').count(), 0);
    assert.equal(await playground.locator('.inkra-agenda__events .inkra-pencil-line').count(), 0);
    assert.equal(await playground.locator('.inkra-agenda').getAttribute('data-density'), 'compact');
    assert.match(await playground.locator('.inkra-agenda__time').first().textContent(), /上午/);
    await toggle('禁用');
    assert.equal(await playground.locator('button.inkra-agenda__event:disabled').count(), 5);
    const eventBox = await playground.locator('button.inkra-agenda__event').first().boundingBox();
    assert(eventBox.height >= 44);
    await page.screenshot({ path: `/tmp/inkra-travel-props-agenda-${width}.png`, fullPage: true });

    await page.goto('http://127.0.0.1:4180/components/journey-map');
    await page.waitForFunction(() => !document.querySelector('[aria-label="放大"]').disabled);
    await page.getByRole('button', { name: '放大', exact: true }).click();
    await page.evaluate(() => {
      window.originalMapCanvas = document.querySelector('.inkra-journey-map__ink');
      window.originalMarker = document.querySelector('.inkra-journey-map__marker').style.transform;
    });
    await toggle('地图手势');
    await toggle('滚轮缩放');
    assert.equal(await page.locator('.leaflet-grab').count(), 0);
    assert(await page.evaluate(() => window.originalMapCanvas === document.querySelector('.inkra-journey-map__ink') && window.originalMarker === document.querySelector('.inkra-journey-map__marker').style.transform));
    await toggle('地图工具栏');
    assert.equal(await page.locator('.inkra-journey-map__tools').count(), 0);
    await toggle('地点列表');
    assert.equal(await page.locator('.inkra-journey-map__places').count(), 0);
    await toggle('跟随选中地点');
    await choose('地点', 'Ridge');
    await page.waitForTimeout(100);
    const centered = await page.locator('.inkra-journey-map__marker[title="Ridge"]').evaluate(marker => {
      const r = marker.getBoundingClientRect();
      const host = document.querySelector('.inkra-journey-map__host').getBoundingClientRect();
      return Math.abs(r.x + r.width / 2 - host.x - host.width / 2) < 2 && Math.abs(r.y + r.height / 2 - host.y - host.height / 2) < 2;
    });
    assert(centered, 'external selection centers only when enabled');
    assert(await page.locator('.inkra-journey-map__attribution').isVisible());
    await page.screenshot({ path: `/tmp/inkra-travel-props-map-${width}.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS expanded travel properties at ${width}`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
