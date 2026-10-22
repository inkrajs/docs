import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_RADAR_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/radar#preview`);
    const playground = page.locator('.component-playground').first();
    const stage = playground.locator('.preview-stage');
    const radar = stage.locator('.inkra-radar').first();
    await radar.waitFor();
    const canvas = radar.locator('.inkra-radar__ink');
    await page.waitForFunction(() => document.querySelector('.component-playground .inkra-radar__ink')?.getAttribute('data-ready') === 'true');
    assert.equal(await canvas.getAttribute('data-ready'), 'true');
    assert(await canvas.evaluate(node => {
      const context = node.getContext('2d');
      return context && [...context.getImageData(0, 0, node.width, node.height).data].some((value, index) => index % 4 === 3 && value > 0);
    }), 'radar pencil canvas contains visible pixels');
    assert.equal(await radar.locator('.inkra-radar__svg-fallback').evaluate(node => getComputedStyle(node).opacity), '0');
    assert(await radar.getByRole('button', { name: 'Alpha', exact: true }).count() >= 1);
    assert.equal(await radar.locator('.inkra-radar__table tbody tr').count(), 3);
    const beta = radar.getByRole('button', { name: 'Beta', exact: true }).first();
    await beta.click();
    assert.equal(await beta.getAttribute('aria-pressed'), 'true');
    const toggle = playground.getByRole('group', { name: '属性', exact: true }).getByRole('switch', { name: '显示轴标签', exact: true });
    await toggle.click();
    assert.equal(await stage.locator('.inkra-radar__labels').count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
    await page.screenshot({ path: `${outputDir}/radar-${viewport.name}.png`, fullPage: true });
    await page.evaluate(() => document.documentElement.setAttribute('data-inkra-theme', 'dark'));
    await page.waitForTimeout(80);
    await page.screenshot({ path: `${outputDir}/radar-${viewport.name}-dark.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS Radar multi-series, controls, missing values, accessible table, mobile layout and screenshots');
} finally {
  await browser.close();
}
