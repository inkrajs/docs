import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function currentPage(scope) {
  return scope.locator('[aria-current="page"]').textContent();
}

try {
  for (const [width, height] of [[1280, 900], [768, 900], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/components/pagination#preview`);
    const basic = page.getByTestId('pagination-basic');
    await basic.getByRole('button', { name: /^(下一页|Next page)$/ }).click();
    assert.equal(await currentPage(basic), '2');
    const controlled = page.getByTestId('pagination-playground');
    const paginationList = controlled.locator('.inkra-pagination__list');
    assert(await paginationList.evaluate(node => {
      const tops = [...node.children].map(item => Math.round(item.getBoundingClientRect().top));
      return new Set(tops).size === 1 && node.clientWidth <= node.parentElement.clientWidth;
    }), 'Pagination controls must stay in one locally scrollable row');
    await controlled.getByRole('button', { name: /^(最后一页|Last page)$/ }).click();
    assert.equal(await currentPage(controlled), '20');
    assert(await controlled.getByRole('button', { name: /^(下一页|Next page)$/ }).isDisabled());
    await page.getByRole('spinbutton', { name: /总页数|Total pages/ }).fill('3');
    assert.equal(await currentPage(controlled), '3', 'shrinking totals must clamp the controlled display');
    await controlled.getByRole('button', { name: /^(第一页|First page)$/ }).click();
    assert.equal(await currentPage(controlled), '1');
    assert(await controlled.getByRole('button', { name: /^(上一页|Previous page)$/ }).isDisabled());
    await page.getByRole('spinbutton', { name: /总页数|Total pages/ }).fill('0');
    assert.equal(await controlled.locator('[aria-current="page"]').count(), 0);
    for (const button of await controlled.getByRole('button').all()) assert(await button.isDisabled());
    await page.getByRole('spinbutton', { name: /总页数|Total pages/ }).fill('3');
    assert.equal(await currentPage(controlled), '1');
    const empty = page.getByTestId('pagination-empty');
    for (const button of await empty.getByRole('button').all()) assert(await button.isDisabled());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

    await page.goto(`${baseUrl}/components/command#preview`);
    const inline = page.getByTestId('command-basic');
    const input = inline.getByRole('combobox');
    await input.fill('zzzz-no-command');
    await inline.getByText(/没有匹配的命令|No matching commands/).waitFor();
    await input.fill('new-note');
    await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-testid="command-result"]')?.textContent === 'new-note');
    await input.fill('find-note');
    await input.dispatchEvent('compositionstart', { data: '查' });
    await input.press('Enter');
    assert.equal(await page.getByTestId('command-result').textContent(), 'new-note', 'IME Enter must not execute a command');
    await input.dispatchEvent('compositionend', { data: '查' });
    await input.press('Enter');
    assert.equal(await page.getByTestId('command-result').textContent(), 'find-note');
    await input.fill('');
    await input.press('End');
    const activeId = await input.getAttribute('aria-activedescendant');
    assert.equal(await page.locator(`[id="${activeId}"]`).getAttribute('data-value'), 'preferences', 'disabled archive must be skipped');
    await input.press('ArrowDown');
    const loopedId = await input.getAttribute('aria-activedescendant');
    assert.equal(await page.locator(`[id="${loopedId}"]`).getAttribute('data-value'), 'new-note');

    const playground = page.getByTestId('command-playground');
    await page.getByRole('tab', { name: /^(状态|State)$/ }).click();
    await page.getByRole('combobox', { name: /预览主题|Preview theme/ }).click();
    await page.getByRole('option', { name: /^(深色|Dark)$/ }).click();
    await page.getByRole('tab', { name: /^(布局|Layout)$/ }).click();
    await page.getByRole('switch', { name: 'RTL', exact: true }).click();
    const trigger = playground.getByRole('button', { name: /打开命令面板|Open command palette/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: /^(命令面板|Command palette)$/ });
    assert.equal(await dialog.evaluate(node => getComputedStyle(node).direction), 'rtl');
    assert.equal(await dialog.locator('xpath=ancestor::*[contains(@class,"inkra-portal-theme-bridge")]').getAttribute('data-inkra-theme'), 'dark');
    await dialog.getByRole('combobox').fill('preferences');
    await dialog.getByRole('combobox').press('Enter');
    await dialog.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => document.activeElement === node), 'Overlay must return focus');
    await trigger.click();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    const commandPlayground = page.locator('.component-playground');
    await commandPlayground.getByRole('tab', { name: /^(代码|Code)$/ }).click();
    const code = await commandPlayground.locator('code').textContent();
    assert.match(code, /const \[active, setActive\] = useState/);
    assert.match(code, /const \[search, setSearch\] = useState/);
    assert.match(code, /const \[selected, setSelected\] = useState/);
    assert.match(code, /dir="rtl" data-inkra-theme="dark"/);
    assert.match(code, /value="archive" disabled=\{true\}/);
    assert.doesNotMatch(code, /createNote|>\.\.\.</);
    await commandPlayground.getByRole('tab', { name: /^(预览|Preview)$/ }).click();
    const composition = page.getByTestId('command-composition');
    const compositionTrigger = composition.getByRole('button', { name: /搜索操作|Search actions/ });
    await compositionTrigger.click();
    const compositionDialog = page.getByRole('dialog', { name: /^(操作命令|Actions)$/ });
    await compositionDialog.getByRole('combobox').fill('find-note');
    await compositionDialog.getByRole('combobox').press('Enter');
    await compositionDialog.waitFor({ state: 'hidden' });
    assert.equal(await composition.locator('output').textContent(), 'find-note');
    assert(await compositionTrigger.evaluate(node => document.activeElement === node));
    await page.emulateMedia({ forcedColors: 'active' });
    await input.focus();
    assert(await input.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}x${height}: Pagination boundaries, Command search/IME/keyboard/Overlay focus`);
  }
} finally {
  await browser.close();
}
