import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_SEGMENTED_PROGRESS_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

async function openExamples(page) {
  await page.goto(`${base}/docs/components/progress#preview`);
  const examples = page.locator('.segmented-progress-examples').first();
  await examples.locator('.inkra-progress[data-shape="segmented"]').first().waitFor();
  return examples;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const examples = await openExamples(page);
  const preview = examples.locator('.component-playground .inkra-progress[data-shape="segmented"]').first();

  assert.equal(await preview.getAttribute('role'), 'progressbar');
  assert.equal(await preview.getAttribute('aria-valuemin'), '0');
  assert.equal(await preview.locator('.inkra-progress__segment').count(), 10);
  const partial = preview.locator('.inkra-progress__segment[data-fill="partial"]');
  assert.equal(await partial.count(), 1, 'fractional policy exposes one partial cell');
  const partialClip = await partial.locator('.inkra-progress__segment-fill-clip').evaluate(node => getComputedStyle(node).clipPath);
  assert.match(partialClip, /inset\(0px 80% 0px 0px\)|inset\(0px 80% 0px\)/, partialClip);

  const pigments = await examples.locator('.component-example .inkra-progress__segment-fill').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).getPropertyValue('--inkra-selection-pigment').trim()).filter(Boolean));
  assert(new Set(pigments).size >= 3, JSON.stringify(pigments));
  assert(await preview.locator('canvas.inkra-pencil-surface__ink').count() >= 20, 'outline and wash canvases render for every cell');

  await page.screenshot({ path: `${outputDir}/segmented-progress-desktop-light.png`, fullPage: true });
  await page.getByRole('radio', { name: '深色主题' }).last().click();
  await page.waitForFunction(() => document.documentElement.dataset.inkraTheme === 'dark');
  await page.screenshot({ path: `${outputDir}/segmented-progress-desktop-dark.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(error.message));
  const mobileExamples = await openExamples(mobile);
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile page has no horizontal overflow');
  const unknown = mobileExamples.locator('.component-example .inkra-progress[data-state="indeterminate"]').last();
  assert.equal(await unknown.getAttribute('aria-valuenow'), null);
  await unknown.evaluate(node => { node.dir = 'rtl'; });
  assert.equal(await unknown.evaluate(node => getComputedStyle(node.querySelector('.inkra-progress__segments')).direction), 'rtl');
  await mobile.screenshot({ path: `${outputDir}/segmented-progress-mobile.png`, fullPage: true });
  assert.deepEqual(mobileErrors, []);
  await mobile.close();

  console.log('PASS Segmented Progress ARIA, cells, partial fill, pigments, pencil canvases, RTL, themes and mobile layout');
} finally {
  await browser.close();
}
