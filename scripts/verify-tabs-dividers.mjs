import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/docs/components/tabs#preview');
  const playground = page.locator('.component-playground').first();
  const tabs = playground.getByRole('tablist', { name: '笔记分类', exact: true });
  assert.equal(await tabs.locator('.inkra-tabs__divider').count(), 0);
  await playground.getByRole('switch', { name: '分割线', exact: true }).check();
  const lines = tabs.locator('.inkra-tabs__divider:visible');
  assert.equal(await lines.count(), await tabs.getByRole('tab').count() - 1);
  const line = lines.first();
  assert.equal(await line.getAttribute('data-orientation'), 'vertical');
  const rect = await line.boundingBox();
  const first = await tabs.getByRole('tab').nth(0).boundingBox();
  const second = await tabs.getByRole('tab').nth(1).boundingBox();
  assert(rect.height >= 28 && rect.width === 8);
  assert(Math.abs(rect.x - first.x - first.width - 8) < 1);
  assert(Math.abs(second.x - rect.x - rect.width - 8) < 1);
  await tabs.getByRole('tab').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(node => node.getAttribute('aria-selected') === 'true', await tabs.getByRole('tab').nth(1).elementHandle());
  await playground.getByRole('combobox', { name: '排列', exact: true }).click();
  await page.getByRole('option', { name: '纵向', exact: true }).click();
  assert.equal(await line.getAttribute('data-orientation'), 'horizontal');
  const verticalLine = await line.boundingBox();
  const verticalTab = await tabs.getByRole('tab').nth(1).boundingBox();
  assert(Math.abs(verticalLine.width - verticalTab.width + 16) < 1 && verticalLine.height === 8);
  await playground.getByRole('combobox', { name: '阅读方向', exact: true }).click();
  await page.getByRole('option', { name: '从右到左', exact: true }).click();
  await playground.getByRole('combobox', { name: '排列', exact: true }).click();
  await page.getByRole('option', { name: '横向', exact: true }).click();
  const rtlFirst = await tabs.getByRole('tab').first().boundingBox();
  const rtlLine = await line.boundingBox();
  assert(Math.abs(rtlFirst.x - rtlLine.x - rtlLine.width - 8) < 1);
  await playground.getByRole('switch', { name: '分割线', exact: true }).uncheck();
  assert.equal(await lines.count(), 0);
  const headerSpacing = await page.locator('.site-navigation').evaluate(nav => {
    const items = Array.from(nav.querySelectorAll('a'));
    return items.map((item, index) => {
      const before = index ? nav.querySelectorAll('.site-navigation__divider')[index - 1] : document.querySelector('.app-header--docs .inkra-layout__header-sidebar-divider');
      const after = nav.querySelectorAll('.site-navigation__divider')[index] ?? nav.nextElementSibling;
      if (!before || !after) throw new Error('The real header dividers must bound every navigation item');
      const a = item.getBoundingClientRect(), b = before.getBoundingClientRect(), c = after.getBoundingClientRect();
      return [a.left - b.right, c.left - a.right];
    });
  });
  assert.equal(headerSpacing.length, 3, 'Checks all three primary navigation items');
  for (const gaps of headerSpacing) for (const gap of gaps) assert.equal(gap, 8);
  console.log('PASS optional dividers, equal gaps, horizontal/vertical, RTL and keyboard navigation');
} finally { await browser.close(); }
