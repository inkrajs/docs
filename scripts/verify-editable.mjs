import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.INKRA_DOCS_URL ?? 'http://localhost:4180';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 760 } });
try {
  await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'en'));
  await page.goto(`${baseURL}/docs/components/editable`, { waitUntil: 'networkidle' });
  const display = page.locator('[data-editable-display="true"]').first();
  await display.focus();
  await page.keyboard.press('Enter');
  const editor = page.locator('[data-editable-editor="true"] input, [data-editable-editor="true"] textarea').first();
  await editor.fill('Edited title');
  await page.keyboard.press('Escape');
  assert.equal(await display.textContent(), 'Click to edit this title');
  await display.click();
  await editor.fill('Saved title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  assert.equal(await display.textContent(), 'Saved title');
  assert.equal(await page.locator('.inkra-editable__actions').count(), 0);
  const dimensions = await display.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
  assert.ok(dimensions.width > 0 && dimensions.height >= 44);
  await page.screenshot({ path: '/tmp/inkra-editable.png', fullPage: true });
} finally {
  await browser.close();
}
