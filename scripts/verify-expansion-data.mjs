import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4180';
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${baseUrl}/docs/components/data-table`, { waitUntil: 'networkidle' });
  const table = page.locator('.component-playground .data-demo-table').last();
  await table.waitFor();

  const sortableHeader = table.locator('.inkra-data-table__sort').first();
  await sortableHeader.click();
  assert.equal(await sortableHeader.locator('xpath=ancestor::th').getAttribute('aria-sort'), 'ascending');

  const firstRowCheckbox = table.locator('tbody input[type="checkbox"]').first();
  await firstRowCheckbox.check();
  assert.equal(await firstRowCheckbox.isChecked(), true);

  const nextPage = table.getByRole('button', { name: /下一页|Next page/ });
  await nextPage.click();
  assert.match(await table.locator('.inkra-data-table__pagination').innerText(), /2/);

  const filter = table.locator('input[type="search"]');
  await filter.fill(/zh-CN/.test(await page.locator('html').getAttribute('lang') ?? '') ? '评审' : 'Review');
  await page.waitForTimeout(50);
  assert.match(await table.locator('.inkra-data-table__pagination').innerText(), /1/);
  assert.equal(await table.locator('tbody tr').count(), 1);

  const playground = table.locator('xpath=ancestor::*[contains(@class, "component-playground")]');
  await playground.getByRole('tab', { name: /交互|Interaction/ }).click();
  await playground.getByLabel(/禁用所有行|Disable every row/).click();
  const headerCheckbox = table.locator('thead input[type="checkbox"]');
  assert.equal(await headerCheckbox.isDisabled(), true);

  await page.goto(`${baseUrl}/docs/components/tree`, { waitUntil: 'networkidle' });
  const tree = page.locator('.component-playground .data-demo-tree').last();
  await tree.waitFor();
  const workspace = tree.locator('.inkra-tree__item').filter({ hasText: /工作区|Workspace/ }).first();
  const disclosure = workspace.getByRole('button', { name: /折叠项目|Collapse item/ });
  await disclosure.click();
  assert.equal(await workspace.getAttribute('aria-expanded'), 'false');
  await workspace.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await workspace.getAttribute('aria-expanded'), 'true');

  const drafts = tree.locator('.inkra-tree__item').filter({ hasText: /草稿|Drafts/ }).first();
  assert.equal(await drafts.getAttribute('aria-selected'), 'true');
  await drafts.click();
  assert.equal(await drafts.getAttribute('aria-selected'), 'false');
  await drafts.focus();
  await page.keyboard.press('Space');
  assert.equal(await drafts.getAttribute('aria-selected'), 'true');
  const archive = tree.locator('.inkra-tree__item').filter({ hasText: /归档|Archive/ }).first();
  assert.equal(await archive.getAttribute('aria-disabled'), 'true');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('.component-playground .preview-controls-divider')?.getAttribute('data-orientation') === 'horizontal');
  await page.waitForFunction(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
} finally {
  await browser.close();
}
