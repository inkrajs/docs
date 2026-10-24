import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'en'));
    await page.goto(`${base}/docs/components/context-menu#preview`);
    const target = page.locator('.preview-display [data-context-menu-trigger]');
    await target.waitFor();
    const playground = page.locator('.component-playground');
    await setPlaygroundControls(playground, true);
    await playground.locator('.preview-controls').getByRole('tab', { name: 'State', exact: true }).click();
    await setPlaygroundControls(playground, false);
    for (let attempt = 0; attempt < 3; attempt++) {
      await target.click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Duplicate note', exact: true }).click();
      await setPlaygroundControls(playground, true);
      await playground.locator('.preview-controls output').filter({ hasText: 'Note duplicated' }).waitFor();
      await setPlaygroundControls(playground, false);
      await target.focus();
      await page.keyboard.press('Shift+F10');
      await page.getByRole('menuitem', { name: 'Duplicate note', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('menu').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.matches('.preview-display [data-context-menu-trigger]'));
    }
    assert.deepEqual(errors, [], 'mount and repeated portal theme updates do not loop');
    await page.close();
    console.log(`PASS ContextMenu mount, pointer/keyboard, actions and focus: ${width}px`);
  }
} finally {
  await browser.close();
}
