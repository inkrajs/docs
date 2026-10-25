import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [430, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 932 }, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/docs/getting-started');
    const trigger = page.getByRole('button', { name: '搜索文档', exact: true });
    const theme = page.locator('.header-customize');
    const a = await trigger.boundingBox(), b = await theme.boundingBox();
    assert(a.x + a.width <= b.x + 1 && Math.abs(a.y - b.y) < 1, 'search is immediately before theme');
    assert.equal(await page.locator('.app-header .header-search').isVisible(), false);
    await trigger.tap();
    const dialog = page.getByRole('dialog', { name: '搜索文档', exact: true });
    const input = dialog.getByRole('combobox');
    await input.waitFor();
    assert(await input.evaluate(node => node === document.activeElement), 'search autofocus');
    const bounds = await dialog.boundingBox();
    assert(Math.abs(bounds.x) < 1 && Math.abs(bounds.y) < 1 && Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - 932) < 1, 'full viewport search');
    assert(await dialog.getByRole('option').count() > 10, 'empty query presents navigable pages');
    await input.fill('not-a-page-987654321');
    await dialog.getByText('没有匹配的页面', { exact: true }).waitFor();
    await input.fill('Button');
    assert(await dialog.getByRole('option').count() > 0);
    await input.press('ArrowDown');
    const selected = await input.getAttribute('aria-activedescendant');
    assert(await page.locator(`[id="${selected}"]`).count() === 1, 'active option exists');
    await input.fill('');
    const list = dialog.getByRole('listbox');
    await list.evaluate(node => { node.scrollTop = 450; });
    assert(await list.evaluate(node => node.scrollTop > 0), 'results scroll within the search page');
    assert.equal(new URL(page.url()).pathname, '/docs/getting-started');
    await input.fill('Grid');
    await page.screenshot({ path: `/tmp/inkra-mobile-search-${width}.png` });
    await dialog.getByRole('option').first().tap();
    await page.waitForURL('**/docs/components/grid#preview');
    await dialog.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node === document.activeElement), 'selection restores trigger focus');
    await trigger.tap();
    await dialog.getByRole('button', { name: '关闭', exact: true }).tap();
    await dialog.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node === document.activeElement));
    await trigger.tap();
    await input.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await trigger.tap();
    await page.setViewportSize({ width: 1024, height: 932 });
    await dialog.waitFor({ state: 'hidden' });
    assert(await page.locator('.app-header .header-search input').evaluate(node => node === document.activeElement), 'desktop transition restores inline search');
    assert.deepEqual(errors, []);
    console.log(`PASS mobile search ${width}: layout, focus, results, scrolling, navigation and dismissal`);
    await page.close();
  }
} finally { await browser.close(); }
