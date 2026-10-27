import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/design-standard');
    const scale = page.locator('.color-system__scale').first();
    await scale.waitFor();
    assert.equal(await page.locator('.color-system__copy-feedback').count(), 0, 'no copy feedback row');
    const scaleHeight = await scale.evaluate(node => node.getBoundingClientRect().height);
    assert.equal(await scale.getByRole('status').evaluate(node => getComputedStyle(node).position), 'absolute');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async () => {} },
    }));
    await scale.getByRole('button').first().click();
    await page.waitForFunction(() => document.querySelector('.color-system__scale [role="status"]')?.textContent.includes('已复制'));
    assert.equal(await scale.evaluate(node => node.getBoundingClientRect().height), scaleHeight, 'copy feedback never reserves a row');
    await page.getByRole('tab', { name: '字体', exact: true }).click();
    await page.locator('#font-family-title').waitFor();
    assert.equal(await page.locator('.typography-system nav').count(), 0, 'no typography index');
    assert.equal(await page.locator('.icon-design:visible').count(), 0, 'font tab contains no icon examples');
    await page.getByRole('tab', { name: '材质', exact: true }).click();
    await page.locator('.material-specimens').waitFor();
    assert.equal(await page.locator('#font-family-title:visible, .icon-design:visible').count(), 0, 'materials stay independent');
    const iconTab = page.getByRole('tab', { name: '图标', exact: true });
    await iconTab.focus();
    await page.keyboard.press('Enter');
    assert.equal(await iconTab.getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.typography-system nav').count(), 0, 'no icon index');
    assert.equal(await page.locator('#font-family-title:visible, .material-specimens:visible').count(), 0);
    const section = page.locator('.icon-design');
    await section.scrollIntoViewIfNeeded();
    const principles = section.locator('.icon-design__principles');
    assert.equal(await principles.getByRole('heading', { level: 3 }).count(), 6);
    assert.match(await principles.innerText(), /outline 与 filled/);
    assert.match(await principles.innerText(), /fillColor/);
    assert.match(await principles.innerText(), /通常两块颜色/);
    assert.doesNotMatch(await principles.innerText(), /目录与滚动|预绘制|焦点|56px/);
    assert.doesNotMatch(await principles.innerText(), /不混用实心和线性/);
    assert.equal(await section.locator('.icon-design__choice').count(), 12);
    await section.getByRole('button', { name: '下载', exact: true }).click();
    assert.equal(await section.getByRole('button', { name: '下载', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.match(await section.locator('.icon-design__detail').textContent(), /保存文件到设备/);
    await chooseDocsOption(section, '图标尺寸', '14px', { exact: false, optionExact: true });
    assert.equal(await section.locator('.icon-design__sample canvas').first().evaluate(el => el.getBoundingClientRect().width), 14);
    await section.getByRole('button', { name: '查看源码' }).click();
    assert.match(await section.locator('pre').textContent(), /sourceSize=\{24\}/);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    assert(await section.locator('canvas').evaluateAll(nodes => nodes.some(c => c.width && c.height && c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0))));
    await section.screenshot({ path: `/tmp/inkra-icon-design-${width}.png` });
    console.log(`PASS icons at ${width}: selection, sizing, source, nonblank canvas, no overflow`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
