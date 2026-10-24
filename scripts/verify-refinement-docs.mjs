import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls as controls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const text = (zh, en) => locale === 'zh-CN' ? zh : en;
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    await page.goto(`${base}/docs/components/color-picker#preview`);
    const form = page.locator('.color-picker-demo__form');
    const input = form.locator('input.inkra-color-picker__input');
    await input.fill('#abc');
    await input.press('Enter');
    await form.getByRole('button', { name: text('读取表单', 'Read form'), exact: true }).click();
    assert.equal(await form.evaluate(node => new FormData(node).get('accent')), '#aabbccff');
    assert((await form.locator(':scope > output').textContent()).includes('#aabbccff'));
    assert.equal(await input.inputValue(), '#aabbccff');
    await form.getByRole('button', { name: text('重置', 'Reset'), exact: true }).click();
    await page.waitForFunction(() => new FormData(document.querySelector('.color-picker-demo__form')).get('accent') === '#629568bf');
    assert.equal(await input.inputValue(), '#629568bf');
    await form.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `/tmp/inkra-color-picker-docs-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    await page.goto(`${base}/docs/components/transfer#preview`);
    const playground = page.locator('.component-playground').first();
    await controls(playground, true);
    await playground.getByRole('combobox', { name: text('阅读方向', 'Direction'), exact: true }).click();
    await page.getByRole('option', { name: text('从右到左', 'RTL'), exact: true }).click();
    await playground.getByRole('tab', { name: text('代码', 'Code'), exact: true }).click();
    const code = await playground.locator('.code-panel code').textContent();
    assert(code.includes('dir="rtl"'));
    assert(code.includes('formatCount={localizedCount}'));
    await playground.getByRole('tab', { name: text('预览', 'Preview'), exact: true }).click();
    await controls(playground, false);
    assert.equal(await playground.locator('.inkra-transfer').getAttribute('dir'), 'rtl');
    assert(await playground.locator('.inkra-editable-text').evaluateAll(nodes =>
      nodes.length > 0 && nodes.every(node => getComputedStyle(node).display === 'none')),
    'RTL native-text fallback removes inactive drawing layers from scroll geometry');
    assert(await playground.locator('.inkra-input').evaluateAll(nodes =>
      nodes.every(node => !['transparent', 'rgba(0, 0, 0, 0)'].includes(getComputedStyle(node).color))),
    'RTL fallback keeps native input text readable');
    const uncontrolled = page.getByTestId('transfer-uncontrolled');
    await uncontrolled.getByRole('checkbox').nth(1).check();
    const copy = await uncontrolled.innerText();
    assert(locale !== 'zh-CN' || !copy.includes(' selected'), 'Chinese examples localize counts in every instance');
    await playground.locator('.inkra-transfer__panel').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-transfer-docs-${width}.png`, animations: 'disabled' });
    const geometry = await page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      outside: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 20).map(node => ({ className: node.className, right: node.getBoundingClientRect().right, transform: getComputedStyle(node).transform,
          parent: node.parentElement?.outerHTML.slice(0, 1600), style: node.getAttribute('style'),
          parentRect: node.parentElement?.getBoundingClientRect().toJSON(),
        })),
    }));
    assert(geometry.scrollWidth <= geometry.width, JSON.stringify(geometry));

    await controls(playground, true);
    await playground.getByRole('combobox', { name: text('阅读方向', 'Direction'), exact: true }).click();
    await page.getByRole('option', { name: text('从左到右', 'LTR'), exact: true }).click();
    await controls(playground, false);
    await page.waitForFunction(root => [...root.querySelectorAll('.inkra-editable-text')].every(node =>
      getComputedStyle(node).display === 'block'), await playground.elementHandle());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'LTR drawing recovers without overflow');

    await page.goto(`${base}/docs/components/upload#preview`);
    const uploadPlayground = page.locator('.component-playground').first();
    await controls(uploadPlayground, false);
    const upload = uploadPlayground.locator('.inkra-upload');
    await upload.waitFor();
    await upload.scrollIntoViewIfNeeded();
    const dropzone = upload.locator('.inkra-upload__dropzone');
    await page.waitForFunction(node => !node.closest('[inert]'), await dropzone.elementHandle());
    await dropzone.focus();
    assert(await dropzone.evaluate(node => node === document.activeElement), 'upload receives keyboard focus');
    const chooserPromise = page.waitForEvent('filechooser');
    await dropzone.press('Enter');
    const chooser = await chooserPromise;
    await chooser.setFiles([]);
    await page.screenshot({ path: `/tmp/inkra-upload-docs-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    for (const [route, required, removed] of [
      ['color-picker', ['showAlpha', 'name / form', 'onInvalidInput'], ['formats', 'alpha', 'disabled / readOnly']],
      ['transfer', ['targetKeys / defaultTargetKeys', 'onTargetKeysChange', 'formatCount'], ['value / defaultValue', 'filterable / sortable', 'disabled / readOnly']],
    ]) {
      await page.goto(`${base}/docs/components/${route}#api`);
      for (const name of required) await page.getByRole('cell', { name, exact: true }).waitFor();
      for (const name of removed) assert.equal(await page.getByRole('cell', { name, exact: true }).count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS refinement docs: reset, normalized form value, RTL/source, localized counts and API ${width}px ${locale} ${theme}`);
    await page.close();
  }
} finally {
  await browser.close();
}
