import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_HEATMAP_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

async function choose(page, scope, label, value) {
  await scope.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

async function toggle(scope, label) {
  await scope.getByRole('switch', { name: label, exact: true }).click();
}

const browser = await chromium.launch();
try {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 900, touch: false },
    { name: 'mobile', width: 390, height: 844, touch: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/heatmap#preview`);

    const playground = page.locator('.component-playground').first();
    const stage = playground.locator('.preview-stage');
    const grid = stage.getByRole('grid', { name: '团队健康矩阵', exact: true });
    await grid.waitFor();
    const cells = grid.getByRole('gridcell');
    assert.equal(await cells.count(), 16);
    assert.equal(await grid.getAttribute('aria-rowcount'), '5');
    assert.equal(await grid.getAttribute('aria-colcount'), '5');

    const zero = grid.getByRole('gridcell', { name: 'Support, Momentum: 0%', exact: true });
    const missing = grid.getByRole('gridcell', { name: 'Design, Quality: 未测量', exact: true });
    assert.equal(await zero.getAttribute('data-value'), '0');
    assert.equal(await zero.getAttribute('data-missing'), null);
    assert.equal(await missing.getAttribute('data-missing'), 'true');

    const selected = grid.getByRole('gridcell', { name: 'Engineering, Momentum: 88%', exact: true });
    assert.equal(await selected.getAttribute('aria-selected'), 'true');
    await selected.focus();
    await page.keyboard.press('ArrowRight');
    const quality = grid.getByRole('gridcell', { name: 'Engineering, Quality: 78%', exact: true });
    assert(await quality.evaluate(node => node === document.activeElement));
    await page.keyboard.press('Space');
    assert.equal(await quality.getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert(await grid.getByRole('gridcell', { name: 'Engineering, Clarity: 69%', exact: true }).evaluate(node => node === document.activeElement));
    await page.keyboard.press('Control+End');
    assert(await grid.getByRole('gridcell', { name: 'Support, Risk: 39%', exact: true }).evaluate(node => node === document.activeElement));

    await choose(page, playground, '色阶', '离散分箱');
    await choose(page, playground, '分箱数', '3');
    assert.equal(await stage.locator('.inkra-heatmap__legend-bin').count(), 3);
    await playground.getByRole('group', { name: '属性', exact: true }).getByRole('tab', { name: '显示', exact: true }).click();
    await toggle(playground, '显示数值');
    assert.equal(await stage.locator('.inkra-heatmap__value-mark').count(), 15);
    assert.equal(await missing.locator('.inkra-heatmap__value-mark').count(), 0);
    await toggle(playground, '显示图例');
    assert.equal(await stage.locator('.inkra-heatmap__legend').count(), 0);

    if (!viewport.touch) {
      await zero.hover();
      await assert.doesNotReject(async () => stage.locator('.inkra-heatmap__details').getByText('0%').waitFor());
    }

    const custom = page.getByRole('grid', { name: '区域工作量', exact: true });
    await custom.waitFor();
    assert.equal(await custom.locator('.heatmap-demo__custom-cell').count(), 8);
    assert.equal(await custom.getByRole('gridcell', { name: 'South, Returning: 未测量', exact: true }).getAttribute('data-missing'), 'true');

    const cellBox = await cells.first().boundingBox();
    assert(cellBox.width >= 44 && cellBox.height >= 44, JSON.stringify(cellBox));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
    await playground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outputDir}/heatmap-${viewport.name}.png`, fullPage: true });
    await page.evaluate(() => document.documentElement.setAttribute('data-inkra-theme', 'dark'));
    await page.waitForTimeout(80);
    assert(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme.includes('dark')));
    await page.screenshot({ path: `${outputDir}/heatmap-${viewport.name}-dark.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }

  console.log('PASS Heatmap grid navigation, controlled selection, scale controls, missing values, custom content, mobile layout and visuals');
} finally {
  await browser.close();
}
