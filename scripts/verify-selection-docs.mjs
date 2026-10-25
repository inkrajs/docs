import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls as controls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const copy = (zh, en) => locale === 'zh-CN' ? zh : en;
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    await page.goto(`${base}/docs/components/tree-select#preview`);
    const playground = page.locator('.component-playground').first();
    const tree = playground.locator('.inkra-tree-select');
    await tree.waitFor();
    await controls(playground, true);
    await playground.getByRole('combobox', { name: copy('尺寸', 'Size'), exact: true }).click();
    await page.getByRole('option', { name: copy('大', 'Large'), exact: true }).click();
    await playground.getByRole('combobox', { name: copy('阅读方向', 'Direction'), exact: true }).click();
    await page.getByRole('option', { name: copy('从右到左', 'RTL'), exact: true }).click();
    await playground.locator('.preview-controls').getByRole('tab', { name: copy('状态', 'State'), exact: true }).click();
    await playground.getByRole('switch', { name: copy('只读', 'Read only'), exact: true }).click();
    await playground.getByRole('switch', { name: copy('错误状态', 'Invalid'), exact: true }).click();
    await playground.getByRole('tab', { name: copy('代码', 'Code'), exact: true }).click();
    const code = await playground.locator('.code-panel code').textContent();
    for (const fragment of ['size="lg"', 'dir="rtl"', 'readOnly={true}', 'invalid={true}', `clearLabel="${copy('清空树选择', 'Clear tree selection')}"`]) {
      assert(code.includes(fragment), `generated code includes ${fragment}`);
    }
    await playground.getByRole('tab', { name: copy('预览', 'Preview'), exact: true }).click();
    await controls(playground, false);
    assert.equal(await tree.getAttribute('data-size'), 'lg');
    assert.equal(await tree.getAttribute('data-readonly'), 'true');
    assert.equal(await tree.getAttribute('data-invalid'), 'true');
    assert.equal(await tree.getAttribute('dir'), 'rtl');
    assert(await tree.locator('.inkra-tree-select__clear').isDisabled());
    await tree.locator('.inkra-tree-select__trigger').click();
    assert.equal(await page.locator('.inkra-tree-select__popover').count(), 0);
    await controls(playground, true);
    await playground.getByRole('switch', { name: copy('只读', 'Read only'), exact: true }).click();
    await playground.getByRole('switch', { name: copy('错误状态', 'Invalid'), exact: true }).click();
    await controls(playground, false);
    const before = await tree.locator('.inkra-tree-select__control').boundingBox();
    await tree.getByRole('button', { name: copy('清空树选择', 'Clear tree selection'), exact: true }).click();
    await tree.locator('.inkra-tree-select__value[data-placeholder="true"]').waitFor();
    assert.equal(await tree.locator('.inkra-tree-select__value').textContent(), copy('选择工作区', 'Choose workspaces'));
    await controls(playground, false);
    const after = await tree.locator('.inkra-tree-select__control').boundingBox();
    assert(Math.abs(after.height - 48) <= 1 && Math.abs(after.width - before.width) <= 1,
      `clearing preserves the shared control geometry: ${JSON.stringify({ before, after })}`);
    await page.waitForFunction(() => document.activeElement?.classList.contains('inkra-tree-select__trigger'));
    const form = page.locator('.tree-select-demo--form');
    await form.getByRole('button', { name: copy('清空树选择', 'Clear tree selection'), exact: true }).click();
    assert.equal(await form.evaluate(node => new FormData(node).get('location')), null);
    await form.getByRole('button', { name: copy('重置', 'Reset'), exact: true }).click();
    await page.waitForFunction(() => new FormData(document.querySelector('.tree-select-demo--form')).get('location') === 'web');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await playground.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `/tmp/inkra-selection-docs-${width}.png`, animations: 'disabled' });
    await page.goto(`${base}/docs/components/tree-select#api`);
    await page.getByRole('cell', { name: 'branchSelection', exact: true }).waitFor();
    assert.equal(await page.getByRole('cell', { name: 'multiple / cascade', exact: true }).count(), 0);
    assert.equal(await page.getByRole('cell', { name: 'searchable / clearable', exact: true }).count(), 0);
    assert(await page.getByRole('cell', { name: 'selectionPropagation', exact: true }).isVisible());
    await page.goto(`${base}/docs/components/select#api`);
    const searchableApi = page.getByRole('region', { name: 'Select.Searchable API', exact: true });
    await searchableApi.getByRole('cell', { name: 'searchPlacement', exact: true }).waitFor();
    assert(await searchableApi.getByRole('cell', { name: 'clearable / clearLabel / openLabel', exact: true }).isVisible());
    assert.deepEqual(errors, []);
    console.log(`PASS selection docs live sizing/state/RTL/source/reset and actual APIs: ${width}px ${locale} ${theme}`);
    await page.close();
  }
} finally {
  await browser.close();
}
