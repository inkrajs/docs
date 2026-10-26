import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/input#preview');
    const playground = page.locator('.component-playground').first();
    const preview = playground.locator('.preview-stage');
    const input = preview.locator('input[name="title"]');
    await input.waitFor();
    assert.equal(await page.locator('.component-example').count(), 7);
    await preview.getByRole('button', { name: '清空名称', exact: true }).click();
    assert.equal(await input.inputValue(), '');
    await input.fill('Inkra demo');
    await playground.getByRole('tab', { name: '内容', exact: true }).click();
    const height = (await playground.boundingBox()).height;
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    const leading = playground.getByRole('switch', { name: '前置图标', exact: true });
    await leading.click();
    await page.waitForFunction(() => !document.querySelector('.component-playground code').textContent.includes('startIcon='));
    assert.match(await playground.locator('code').textContent(), /onValueChange=\{setValue\}/);
    assert(Math.abs((await playground.boundingBox()).height - height) < 1);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    assert.equal(await input.inputValue(), 'Inkra demo');
    const actionExample = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '加载与尾部操作', exact: true }) });
    for (const variant of ['underline', 'outline']) {
    const control = actionExample.locator(`.inkra-input-root[data-variant="${variant}"]`);
    const action = control.locator('.inkra-input__end-action');
    assert.equal(await action.locator('.inkra-input__action-divider').count(), 1);
    assert.equal(await action.getByRole('button', { name: '复制内容' }).locator('.docs-pencil-icon').evaluate(node => Math.round(node.getBoundingClientRect().width)), 22);
    const copy = action.getByRole('button', { name: '复制内容' });
    await control.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await copy.hover();
    await page.waitForFunction(() => {
      const action = document.querySelector('.component-example .inkra-input__end-action');
      const surface = action.querySelector('.inkra-button__surface');
      const border = surface.querySelector(':scope > .inkra-pencil-surface__border');
      return getComputedStyle(surface).transform === 'none' && border && getComputedStyle(border).display === 'none';
    });
    await page.waitForTimeout(550);
    const wash = action.locator('.inkra-input__action-wash');
    const actionBox = await action.boundingBox();
    const washBox = await wash.boundingBox();
    assert.equal(Math.round(actionBox.height - washBox.height), variant === 'underline' ? 8 : 0);
    assert.equal(Math.round(actionBox.width - washBox.width), variant === 'underline' ? 8 : 0);
    assert.equal(await wash.evaluate(node => getComputedStyle(node).opacity), '1');
    await control.screenshot({ path: `/tmp/inkra-input-hover-${variant}-${width}.png` });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    assert.equal(await wash.evaluate(node => getComputedStyle(node).opacity), '0');
    await page.keyboard.press('Tab');
    await copy.focus();
    assert.equal(await copy.locator('.inkra-button__focus-ring').evaluate(node => getComputedStyle(node).opacity), '1');
    await copy.evaluate(node => node.blur());
    await page.evaluate(() => document.documentElement.setAttribute('data-inkra-theme', 'dark'));
    await control.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await copy.hover();
    await page.waitForTimeout(550);
    await control.screenshot({ path: `/tmp/inkra-input-hover-${variant}-dark-${width}.png` });
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.documentElement.setAttribute('data-inkra-theme', 'light'));
    }
    const clearExample = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '清空与表单重置', exact: true }) });
    await clearExample.getByRole('button', { name: '清空非受控输入' }).click();
    await clearExample.getByRole('button', { name: '重置', exact: true }).click();
    assert.equal(await clearExample.locator('input[name="uncontrolled"]').inputValue(), 'Notes');
    await clearExample.getByRole('button', { name: '清空非受控输入' }).waitFor();
    if (width <= 768) await page.locator('.mobile-search-trigger').click();
    const search = page.getByRole('combobox', { name: '搜索文档', exact: true });
    await search.fill('Input');
    const searchForm = page.locator(width <= 768 ? '.search-screen' : '.header-search');
    await searchForm.getByRole('button', { name: '清空搜索' }).click();
    assert.equal(await search.inputValue(), '');
    assert.equal(await search.getAttribute('aria-expanded'), width <= 768 ? 'true' : 'false');
    if (width > 768) assert.equal(await search.getAttribute('aria-activedescendant'), null);
    await search.fill('Button');
    await search.press('ArrowDown');
    await search.press('Escape');
    if (width <= 768) await page.getByRole('dialog', { name: '搜索文档', exact: true }).waitFor({ state: 'hidden' });
    else {
      assert.equal(await search.inputValue(), '', 'inline search keeps its existing Escape reset behavior');
      assert.equal(await search.getAttribute('aria-expanded'), 'false');
    }
    await actionExample.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-input-action-${width}.png` });
    await page.evaluate(() => document.documentElement.setAttribute('data-inkra-theme', 'dark'));
    await page.screenshot({ path: `/tmp/inkra-input-action-dark-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto('http://127.0.0.1:4180/components/textarea#preview');
    const textarea = page.locator('.preview-stage textarea');
    await textarea.waitFor();
    const choose = async (name, option) => {
      await chooseDocsOption(page.locator('.preview-controls'), name, option, { exact: true, optionExact: true });
    };
    await choose('行数', '5');
    await choose('最大长度', '40');
    await page.waitForFunction(() => document.querySelector('.preview-stage textarea').maxLength === 40);
    assert.equal(await textarea.getAttribute('rows'), '5');
    await textarea.fill('a'.repeat(50));
    assert.equal((await textarea.inputValue()).length, 40);
    await page.locator('.preview-stage').getByRole('button', { name: '重置', exact: true }).click();
    assert.equal(await textarea.inputValue(), '');
    await page.goto('http://127.0.0.1:4180/components/field#preview');
    await page.getByRole('switch', { name: '多行输入', exact: true }).click();
    await page.locator('.preview-stage textarea').waitFor();
    await page.locator('.property-tabs').getByRole('tab', { name: '状态', exact: true }).click();
    await page.getByRole('switch', { name: '只读', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.preview-stage textarea').readOnly);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS Input, Textarea, Field demos, search and action styling at ${width}px`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
