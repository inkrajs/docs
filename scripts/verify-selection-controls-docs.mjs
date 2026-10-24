import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const text = (zh, en) => locale === 'zh-CN' ? zh : en;
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });

    for (const route of ['checkbox', 'switch', 'radio-group', 'choice-grid']) {
      await page.goto(`${base}/docs/components/${route}#preview`);
      const isGrid = route === 'choice-grid';
      const form = page.locator(isGrid ? '.choice-grid-native-form' : '.selection-native-form');
      await form.waitFor();
      if (isGrid) {
        await form.getByRole('radio', { name: text('图文', 'Visual'), exact: true }).check();
        await form.getByRole('checkbox', { name: text('备注', 'Notes'), exact: true }).uncheck();
        await form.getByRole('checkbox', { name: text('元数据', 'Metadata'), exact: true }).check();
      } else if (route === 'radio-group') {
        await form.getByRole('radio', { name: text('团队', 'Team'), exact: true }).check();
      } else {
        await form.getByRole(route, { name: text('接收更新', 'Receive updates'), exact: true }).uncheck();
      }
      await form.getByRole('button', { name: text('读取表单', 'Read form'), exact: true }).click();
      const submitted = JSON.parse(await form.locator('output').textContent());
      assert.deepEqual(submitted, isGrid ? { format: 'visual', sections: ['metadata'] }
        : route === 'radio-group' ? { visibility: 'team' } : {});
      await form.getByRole('button', { name: text('重置', 'Reset'), exact: true }).click();
      await page.waitForFunction(node => {
        const inputs = [...node.querySelectorAll('input')];
        return inputs.every(input => input.checked === input.defaultChecked)
          && inputs.every(input => (input.closest('.inkra-selection-control').dataset.checked === 'true') === input.checked);
      }, await form.elementHandle());
      const resetValues = await form.evaluate(node => [...new FormData(node)]);
      assert.deepEqual(resetValues, isGrid
        ? [['choice-grid-format', 'summary'], ['choice-grid-sections', 'notes']]
        : route === 'radio-group' ? [['visibility', 'private']] : [['updates', 'enabled']]);
      assert.equal(await form.locator('output').textContent(), '');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), text('重置', 'Reset'));

      await page.keyboard.press('Tab');
      const input = form.locator('input').first();
      await input.focus();
      const focus = isGrid ? input.locator('xpath=ancestor::div[contains(@class,"inkra-choice-grid__option")][1]').locator('.inkra-choice-grid__focus')
        : input.locator('xpath=..').locator('.inkra-selection-control__focus-ring');
      await page.waitForFunction(node => Number(getComputedStyle(node).opacity) > 0.99, await focus.elementHandle());
      await page.waitForFunction(node => [...node.querySelectorAll('canvas')].some(canvas => {
        if (!canvas.width || !canvas.height) return false;
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0);
      }), await focus.elementHandle());
      if (isGrid) {
        assert(await form.locator('.inkra-choice-grid__option-label.inkra-pencil-text, .inkra-choice-grid__option-label .inkra-pencil-text').count() >= 5);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} page does not overflow at ${width}`);
      await input.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-${route}-selection-docs-${width}.png`, animations: 'disabled' });

      await page.goto(`${base}/docs/components/${route}#api`);
      const expected = isGrid ? 'values / defaultValues / onValuesChange'
        : route === 'radio-group' ? 'name / form' : 'name / value / form';
      await page.getByRole('cell', { name: expected, exact: true }).waitFor();
      if (isGrid) {
        for (const unsupported of ['mode', 'renderItem', 'disabled / readOnly / invalid']) {
          assert.equal(await page.getByRole('cell', { name: unsupported, exact: true }).count(), 0);
        }
      }
      console.log(`PASS ${route} native submit/reset, focus pixels, API and layout: ${width}px ${locale} ${theme}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
