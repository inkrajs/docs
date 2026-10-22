import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_SPARKLINE_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/docs/components/sparkline#preview`);
  const chart = page.locator('.inkra-sparkline').first();
  await chart.locator('svg').waitFor();
  assert((await chart.locator('path, rect, circle').count()) > 0, 'sparkline has visible SVG geometry');
  await page.waitForFunction(() => document.querySelector('.inkra-sparkline--pencil-ready .inkra-sparkline__pencil--static')?.width > 0);
  const staticCanvas = chart.locator('.inkra-sparkline__pencil--static');
  const interactionCanvas = chart.locator('.inkra-sparkline__pencil--interaction');
  assert((await staticCanvas.evaluate(node => node.width)) > 0, 'static pencil canvas contains pixels');
  assert((await interactionCanvas.evaluate(node => node.width)) > 0, 'interaction pencil canvas is sized');
  assert((await chart.locator('.inkra-sparkline__data span').count()) > 0, 'sparkline exposes textual data');
  await chart.locator('svg').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await chart.locator('.inkra-sparkline__tooltip').count(), 1);
  const assertFallback = async mode => {
    assert.equal(await staticCanvas.evaluate(node => getComputedStyle(node).display), 'none', `${mode} hides the static pencil canvas`);
    assert.equal(await interactionCanvas.evaluate(node => getComputedStyle(node).display), 'none', `${mode} hides the interaction pencil canvas`);
    assert.equal(await chart.locator('.inkra-sparkline__point').first().evaluate(node => getComputedStyle(node).opacity), '1', `${mode} restores SVG points`);
    assert.equal(await chart.locator('.inkra-sparkline__guide').evaluate(node => getComputedStyle(node).opacity), '1', `${mode} restores the SVG guide`);
  };
  await page.emulateMedia({ forcedColors: 'active' });
  await assertFallback('forced colors');
  await page.emulateMedia({ forcedColors: 'none', media: 'print' });
  await assertFallback('print');
  assert.deepEqual(errors, []);
  await page.close();

  for (const viewport of [{ width: 1100, height: 800 }, { width: 390, height: 844 }]) {
    for (const theme of ['light', 'dark']) {
      const visual = await browser.newPage({ viewport, hasTouch: viewport.width === 390, isMobile: viewport.width === 390 });
      await visual.addInitScript(value => localStorage.setItem('inkra-docs-theme', value), theme);
      await visual.goto(`${base}/docs/components/sparkline#preview`);
      await visual.waitForFunction(value => document.documentElement.dataset.inkraTheme === value, theme);
      await visual.waitForFunction(() => document.querySelector('.component-playground .inkra-sparkline--pencil-ready .inkra-sparkline__pencil--static')?.width > 0);
      await visual.screenshot({ path: `${outputDir}/sparkline-${viewport.width}-${theme}.png`, fullPage: true });
      await visual.close();
    }
  }
  console.log('PASS Sparkline static/interaction canvases, keyboard data and SVG forced-colors/print fallback');
} finally {
  await browser.close();
}
