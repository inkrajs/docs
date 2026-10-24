import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  await page.goto(`${process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180'}/docs/design-standard`);
  const selected = page.locator('.nav-link[aria-current="page"]');
  await selected.scrollIntoViewIfNeeded();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.inkraTheme = theme; }, theme);
    for (const state of ['normal', 'hover', 'focus']) {
      if (state === 'hover') await selected.hover();
      if (state === 'focus') await selected.focus();
      const colors = await page.evaluate(theme => {
        const text = document.querySelector('.nav-link[aria-current="page"] .inkra-pencil-text');
        const icon = document.querySelector('.nav-link[aria-current="page"] .docs-pencil-icon');
        const sample = document.querySelector(`.color-palette__applications [data-inkra-theme="${theme}"] .inkra-pencil-surface--action .inkra-pencil-text:last-child`);
        return [text, icon, sample].map(node => node ? getComputedStyle(node).color : null);
      }, theme);
      assert(colors[2], 'reference palette text exists');
      assert.equal(colors[0], colors[2], `${theme} ${state}: selected text matches the reference foreground`);
      assert.equal(colors[1], colors[2], `${theme} ${state}: selected icon matches the reference foreground`);
    }
    await selected.screenshot({ path: `/tmp/inkra-nav-foreground-${theme}.png` });
  }
  await page.evaluate(() => document.documentElement.style.setProperty('--inkra-on-accent', '#c9a4e8'));
  assert.equal(await selected.locator('.inkra-pencil-text').evaluate(node => getComputedStyle(node).color), 'rgb(201, 164, 232)', 'custom theme foreground is inherited');
  console.log('PASS selected navigation foreground matches light/dark palette and custom theme, including hover/focus');
} finally { await browser.close(); }
