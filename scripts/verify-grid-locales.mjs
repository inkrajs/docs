import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { docsLanguages, lookupDocsMessage } from '../src/docsLocales.ts';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];
const t = (locale, source) => {
  if (locale === 'zh-CN') return source;
  const value = lookupDocsMessage(locale, source);
  assert(value, `Missing ${locale} translation: ${source}`);
  return value;
};
const expectedNames = locale => ['草图', '图标', '色彩', '文字', '布局', '交互'].map(source => t(locale, source));

async function language(page, width, locale, label) {
  if (await page.evaluate(() => document.documentElement.lang) === locale) return;
  if (width < 800) await page.locator('.menu-button').click();
  const sidebar = page.locator(width < 800 ? '.mobile-drawer' : '.desktop-sidebar');
  await sidebar.locator('.language-control [role="combobox"]').click();
  await page.getByRole('option', { name: label, exact: true }).click();
  await page.waitForFunction(value => document.documentElement.lang === value, locale);
  if (width < 800) {
    await page.keyboard.press('Escape');
    await page.locator('.mobile-drawer').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => !document.querySelector('.docs-layout').inert);
  }
}

async function checkPage(page, title, locale, intro) {
  assert.equal(await page.locator('.page-heading h1').innerText(), title);
  assert.equal(await page.locator('.page-heading > p').innerText(), t(locale, intro));
  assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-locale')), locale);
}

async function checkOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no document overflow`);
  const clipped = await page.locator('.preview-controls button, .preview-controls label').evaluateAll(nodes => nodes.filter(node => {
    const box = node.getBoundingClientRect();
    // Pencil focus decorations intentionally extend outside controls; only
    // the selectable text should be contained by the control's layout box.
    return box.width && box.height && [...node.querySelectorAll('.inkra-pencil-text__source')].some(source => {
      const text = source.getBoundingClientRect();
      return text.width && text.height && (text.left < box.left - 1 || text.right > box.right + 1
        || text.top < box.top - 1 || text.bottom > box.bottom + 1);
    });
  }).map(node => node.textContent));
  assert.deepEqual(clipped, [], `${label}: controls do not clip translated labels`);
}

async function capture(page, route, width, locale) {
  await checkOverflow(page, `${route}/${width}/${locale}`);
  if (!['ja', 'ko', 'fr'].includes(locale)) return;
  await page.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); });
  await page.screenshot({ path: `/tmp/inkra-${route}-${width}-${locale}.png`, fullPage: true, animations: 'disabled' });
}

async function propertyTab(playground, locale, source) {
  await playground.locator('.preview-controls').getByRole('tab', { name: t(locale, source), exact: true }).click();
}

async function chooseMode(page, playground, locale, source) {
  await propertyTab(playground, locale, '布局');
  await playground.getByRole('combobox', { name: t(locale, '模式'), exact: true }).click();
  for (const name of ['拖拽看板', '行列调整', '基础网格']) {
    assert(await page.getByRole('option', { name: t(locale, name), exact: true }).isVisible());
  }
  await page.getByRole('option', { name: t(locale, source), exact: true }).click();
}

try {
  for (const width of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/grid#preview`);
    const playground = page.locator('.component-playground');
    const gridRoot = await page.locator('.grid-examples').elementHandle();
    await setPlaygroundControls(playground, false);
    await playground.getByRole('button', { name: '保存草稿', exact: true }).click();
    await setPlaygroundControls(playground, true);
    await playground.getByRole('slider', { name: '间距', exact: true }).press('ArrowRight');
    await setPlaygroundControls(playground, false);

    for (const [locale, label] of docsLanguages) {
      await language(page, width, locale, label);
      await checkPage(page, 'Grid', locale, '强迫症友好：每个格子都有自己的工位。');
      assert(await page.locator('.grid-examples').evaluate((node, before) => node === before, gridRoot), 'locale switch preserves Grid example instance');
      assert.equal(await playground.getByRole('button', { name: t(locale, '已保存'), exact: true }).count(), 1, 'saved state survives language and mode changes');
      assert.deepEqual(await playground.locator('.inkra-grid-board__title').allTextContents(),
        ['工作动态', '本周任务', '待审核', '快速笔记'].map(source => t(locale, source)));
      await capture(page, 'grid-locales', width, locale);
      await setPlaygroundControls(playground, true);
      await propertyTab(playground, locale, '布局');
      assert.equal(await playground.getByRole('slider', { name: t(locale, '间距'), exact: true }).getAttribute('aria-valuenow'), '16');
      assert(await playground.getByRole('slider', { name: t(locale, '行高'), exact: true }).isVisible());
      assert(await playground.getByRole('switch', { name: t(locale, '窄屏自动换行'), exact: true }).isVisible());
      await propertyTab(playground, locale, '交互');
      for (const source of ['拖拽位置', '调整卡片大小']) assert(await playground.getByRole('switch', { name: t(locale, source), exact: true }).isVisible());
      assert(await playground.getByRole('button', { name: t(locale, '恢复布局'), exact: true }).isVisible());
      await propertyTab(playground, locale, '状态');
      assert(await playground.getByRole('switch', { name: t(locale, '禁用调整'), exact: true }).isVisible());
      await chooseMode(page, playground, locale, '行列调整');
      await propertyTab(playground, locale, '交互');
      for (const source of ['调整列宽', '调整行高']) assert(await playground.getByRole('switch', { name: t(locale, source), exact: true }).isVisible());
      await checkOverflow(page, `Grid track controls/${width}/${locale}`);
      await setPlaygroundControls(playground, false);
      assert.deepEqual(await playground.locator('.inkra-grid-resizable .grid-examples__cell').allTextContents(), expectedNames(locale));
      await setPlaygroundControls(playground, true);
      await chooseMode(page, playground, locale, '基础网格');
      assert(await playground.getByRole('slider', { name: t(locale, '列数'), exact: true }).isVisible());
      await setPlaygroundControls(playground, false);
      assert.deepEqual(await playground.locator('.grid-examples__basic .grid-examples__cell').allTextContents(), expectedNames(locale));
      await setPlaygroundControls(playground, true);
      await chooseMode(page, playground, locale, '拖拽看板');
      await setPlaygroundControls(playground, false);
      console.log(`PASS Grid introduction, three modes, controls and preserved state: ${width}px ${locale}`);
    }
    await gridRoot.dispose();

    await page.goto(`${base}/docs/components/inventory-grid#preview`);
    const inventoryRoot = page.locator('.inventory-grid-examples .inkra-inventory-grid');
    const inventoryNode = await inventoryRoot.elementHandle();
    const supply = inventoryRoot.locator('[data-inventory-item="supply"]');
    await setPlaygroundControls(playground, false);
    await supply.focus(); await page.keyboard.press('Space');
    await page.locator('.inkra-inventory-grid__overlay').waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('.inkra-inventory-grid__preview')?.style.left === '96px');
    await page.keyboard.press('Enter');
    await page.locator('.inkra-inventory-grid__overlay').waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.querySelector('[data-inventory-item="supply"]')?.style.left === '96px');

    for (const [locale, label] of docsLanguages) {
      await language(page, width, locale, label);
      await checkPage(page, 'InventoryGrid', locale, '大小不一，刚好装下。');
      assert(await inventoryRoot.evaluate((node, before) => node === before, inventoryNode), 'locale switch preserves InventoryGrid instance');
      assert.equal(await supply.evaluate(node => node.style.left), '96px', 'item position survives language changes');
      assert.equal(await inventoryRoot.getAttribute('aria-label'), t(locale, '物品收纳'));
      assert.deepEqual(await inventoryRoot.locator('.inkra-inventory-grid__header > .inkra-pencil-text').allTextContents(), [t(locale, '背包'), t(locale, '收纳')]);
      for (const [id, source] of [['tool', '维修工具'], ['supply', '补给'], ['map', '地图'], ['kit', '修理包']]) {
        assert.equal(await inventoryRoot.locator(`[data-inventory-item="${id}"]`).getAttribute('aria-label'), t(locale, source));
      }
      await capture(page, 'inventory-grid-locales', width, locale);
      await setPlaygroundControls(playground, true);
      await propertyTab(playground, locale, '布局');
      assert.equal(await playground.getByRole('slider', { name: t(locale, '格子尺寸'), exact: true }).getAttribute('aria-valuenow'), '48');
      await propertyTab(playground, locale, '交互');
      for (const source of ['允许旋转', '收纳只接受补给']) assert(await playground.getByRole('switch', { name: t(locale, source), exact: true }).isVisible());
      assert(await playground.getByRole('button', { name: t(locale, '恢复位置'), exact: true }).isVisible());
      await checkOverflow(page, `InventoryGrid interaction/${width}/${locale}`);
      await propertyTab(playground, locale, '状态');
      for (const source of ['禁用', '只读', '拒绝受控更新']) assert(await playground.getByRole('switch', { name: t(locale, source), exact: true }).isVisible());
      await setPlaygroundControls(playground, false);
      console.log(`PASS InventoryGrid introduction, controls, labels and preserved item placement: ${width}px ${locale}`);
    }
    await inventoryNode.dispose();
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS Grid and InventoryGrid five-language introductions and playgrounds. API/accessibility prose retain existing bilingual fallback.');
} finally { await browser.close(); }
