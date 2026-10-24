import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    for (const name of ['input', 'textarea', 'select', 'tag-input', 'slider', 'rating', 'transfer', 'tree-select', 'date-picker', 'editable']) {
      await page.goto(`${base}/docs/components/${name}#preview`);
      const playground = page.locator('.component-playground').first();
      await playground.waitFor();
      await setPlaygroundControls(playground, false);
      const stage = playground.locator('.preview-stage');
      assert.equal(await stage.locator('output').count(), 0, `${name}: no demo status output`);
      assert.equal(await stage.locator('button[type="submit"], button[type="reset"]').count(), 0, `${name}: forms belong below`);
      if (name === 'input') {
        const input = stage.getByRole('textbox');
        assert.equal(await stage.locator('.inkra-field__description').count(), 0);
        assert.equal(await input.getAttribute('required'), null);
        await input.fill('Plain preview');
        assert.equal(await input.inputValue(), 'Plain preview');
      }
      if (name === 'textarea') {
        await stage.getByRole('textbox').fill('First\nSecond');
        assert.equal(await stage.getByRole('textbox').inputValue(), 'First\nSecond');
        const form = page.getByTestId('textarea-form');
        await form.getByRole('textbox').fill('Form notes');
        await form.locator('button[type="submit"]').click();
        assert.equal(await form.locator('output').textContent(), 'Form notes');
        await form.locator('button[type="reset"]').click();
        assert.equal(await form.getByRole('textbox').inputValue(), 'Inkra');
      }
      if (name === 'tag-input') {
        await stage.getByRole('textbox').fill('New tag');
        await stage.getByRole('textbox').press('Enter');
        assert.match(await stage.textContent(), /New tag/);
      }
      if (name === 'slider' || name === 'rating') {
        const slider = stage.getByRole('slider').first();
        const before = await slider.getAttribute('aria-valuenow');
        await slider.focus();
        await slider.press('ArrowRight');
        assert.notEqual(await slider.getAttribute('aria-valuenow'), before);
      }
      if (name === 'editable') {
        await stage.locator('[data-editable-display]').click();
        await stage.getByRole('textbox').fill('Edited title');
        await stage.getByRole('textbox').press('Enter');
        await stage.locator('[data-editable-display]').waitFor();
        assert.equal(await stage.locator('[data-editable-display]').textContent(), 'Edited title');
      }
      if (name === 'input' || name === 'editable') {
        await playground.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `/tmp/inkra-minimal-${name}-${width}.png`, animations: 'disabled' });
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: no page overflow`);
      console.log(`PASS minimal ${name}: ${width}px ${locale}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
