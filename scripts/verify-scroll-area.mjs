import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.width <= 480 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/docs/components/scroll-area#preview`);
    const root = page.locator('.component-playground .inkra-scroll-area').first();
    await root.waitFor();
    const viewportEl = root.locator('.inkra-scroll-area__viewport');
    assert.equal(await viewportEl.getAttribute('aria-label'), '可滚动文档预览');
    assert.equal(await root.locator('.inkra-scroll-area__scrollbar[data-orientation="vertical"]').count(), 1);
    assert.equal(await root.locator('.inkra-scroll-area__scrollbar[data-orientation="horizontal"]').count(), 1);

    const controls = page.locator('.component-playground').getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('tab', { name: '交互', exact: true }).click();
    await controls.getByRole('combobox', { name: '滚动条策略' }).click();
    await page.getByRole('option', { name: '常显' }).click();
    assert.equal(await root.getAttribute('data-type'), 'always');
    await controls.getByRole('button', { name: '增加内容' }).click();
    await viewportEl.locator('[data-expanded="true"]').waitFor();
    await page.waitForFunction(element => element.scrollHeight > element.clientHeight, await viewportEl.elementHandle());
    await root.locator('.inkra-scroll-area__scrollbar[data-orientation="vertical"]').waitFor();
    await viewportEl.focus();
    await page.keyboard.press('End');
    await page.waitForFunction(element => element.scrollTop > 0, await viewportEl.elementHandle());
    assert(await viewportEl.evaluate(el => el.scrollTop > 0), 'End moves the native viewport');
    await page.keyboard.press('Home');
    await page.waitForFunction(element => element.scrollTop === 0, await viewportEl.elementHandle());
    assert.equal(await viewportEl.evaluate(el => el.scrollTop), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page does not overflow horizontally');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS ScrollArea native viewport, keyboard, two-axis bars, visibility policy, dynamic content and responsive overflow');
} finally {
  await browser.close();
}
