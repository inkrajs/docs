import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark'], [320, 'light']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/docs/components/editable#preview');
    await page.evaluate(async theme => {
      const { React: R, ReactDOM, ReactDOMClient, Editable } = await import('/scripts/fixtures/editable.mjs');
      document.getElementById('root').style.display = 'none';
      document.documentElement.dataset.inkraTheme = theme;
      const host = document.createElement('main');
      host.id = 'editable-fixture';
      Object.assign(host.style, { padding: '20px', maxWidth: '560px' });
      document.body.prepend(host);
      const root = ReactDOMClient.createRoot(host);
      const h = R.createElement;
      function Example({ config }) {
        const [value, setValue] = R.useState(config.editorType === 'select' ? 'draft' : 'Initial text');
        const ref = R.useRef(null);
        return h('div', { dir: config.rtl ? 'rtl' : 'ltr' },
          h(Editable, {
            ref, ...config, value, onValueChange: setValue,
            'aria-label': 'Edit', startEditingLabel: 'Edit', saveLabel: 'Confirm', cancelLabel: 'Cancel',
            inputProps: { size: config.size || 'md' },
            textareaProps: { rows: 3, size: config.size || 'md' },
            selectProps: { mode: config.mode, dir: config.rtl ? 'rtl' : 'ltr', size: config.size || 'md', items: [
              { value: 'draft', label: 'Draft' }, { value: 'review', label: 'In review' },
              { value: 'blocked', label: 'Blocked', disabled: true },
            ] },
            validate: next => config.validate && !next.trim() ? 'Value required' : undefined,
            onSave: config.async ? () => new Promise(resolve => { window.finishSave = resolve; }) : undefined,
          }),
          h('button', { id: 'outside' }, 'Outside'));
      }
      window.mountEditable = config => {
        ReactDOM.flushSync(() => root.render(h(Example, { key: JSON.stringify(config), config })));
      };
    }, theme);
    const editable = page.locator('#editable-fixture .inkra-editable');
    const display = editable.locator('[data-editable-display]');
    const confirm = editable.getByRole('button', { name: 'Confirm', exact: true });
    const cancel = editable.getByRole('button', { name: 'Cancel', exact: true });
    async function mount(config) {
      await page.evaluate(config => window.mountEditable(config), config);
      await display.waitFor();
      assert.equal(await editable.locator('.inkra-editable__actions').count(), 0);
      assert.equal(await display.evaluate(node => getComputedStyle(node).borderWidth), '0px');
    }
    async function displayed(text) {
      await page.waitForFunction(({ node, text }) => node.querySelector('[data-editable-display]')?.textContent === text, { node: await editable.elementHandle(), text });
    }
    for (const editorType of ['input', 'textarea']) {
      await mount({ editorType });
      await display.focus();
      await display.press('Enter');
      const input = editable.getByRole('textbox');
      await input.waitFor();
      await page.waitForFunction(node => document.activeElement === node, await input.elementHandle());
      const surface = input.locator('xpath=ancestor::*[contains(@class,"inkra-field-control-hit")]');
      assert.equal(await surface.locator('.inkra-editable__actions button').count(), 2, 'actions belong to the input surface');
      assert.equal(await surface.getAttribute('data-variant'), 'underline');
      const inputBox = await input.boundingBox();
      const actionBox = await confirm.boundingBox();
      assert(inputBox.x + inputBox.width <= actionBox.x + 1, 'actions must not cover the text');
      assert(actionBox.width >= 44, 'touch action stays usable');
      await input.fill('Edited text');
      await cancel.click();
      await displayed('Initial text');
      await page.waitForFunction(node => node === document.activeElement, await display.elementHandle());
      assert(await display.evaluate(node => node === document.activeElement));
      await display.click();
      await input.fill('Saved text');
      if (editorType === 'textarea') {
        await input.press('End');
        await input.press('Enter');
        assert.equal(await input.inputValue(), 'Saved text\n');
        await input.pressSequentially('Second line');
        await input.press('Control+Enter');
        await displayed('Saved text\nSecond line');
      } else {
        await input.press('Enter');
        await displayed('Saved text');
      }
      await display.click();
      await editable.screenshot({ path: `/tmp/inkra-editable-${editorType}-${width}.png` });
      await input.press('Escape');
    }
    for (const mode of ['dropdown', 'searchable', 'stepper']) {
      await mount({ editorType: 'select', mode, blurBehavior: 'save' });
      await displayed('Draft');
      await display.click();
      if (mode === 'stepper') {
        const spin = editable.getByRole('spinbutton');
        await spin.focus();
        await spin.press('ArrowRight');
        assert.equal(await spin.getAttribute('aria-valuetext'), 'In review');
      } else {
        await editable.getByRole('combobox').click();
        await page.getByRole('option', { name: 'In review', exact: true }).click();
        await page.waitForTimeout(60);
        assert.equal(await editable.getAttribute('data-editing'), 'true', 'portal selection is internal, not blur-save');
      }
      await cancel.click();
      await displayed('Draft');
      await display.click();
      if (mode === 'stepper') await editable.getByRole('spinbutton').press('ArrowRight');
      else {
        await editable.getByRole('combobox').click();
        await page.getByRole('option', { name: 'In review', exact: true }).click();
      }
      await confirm.click();
      await displayed('In review');
      await display.click();
      await editable.screenshot({ path: `/tmp/inkra-editable-${mode}-${width}.png` });
      await cancel.click();
    }
    await mount({ editorType: 'input', validate: true, async: true });
    await display.click();
    await editable.getByRole('textbox').fill('');
    await confirm.click();
    await editable.getByRole('alert').waitFor();
    assert.equal(await editable.getAttribute('data-editing'), 'true');
    await editable.getByRole('textbox').fill('Async saved');
    await confirm.click();
    await page.waitForFunction(() => typeof window.finishSave === 'function');
    assert(await cancel.isDisabled());
    await page.evaluate(() => { window.finishSave('Save rejected'); window.finishSave = null; });
    await page.getByText('Save rejected', { exact: true }).waitFor();
    await confirm.click();
    await page.waitForFunction(() => typeof window.finishSave === 'function');
    await page.evaluate(() => window.finishSave());
    await displayed('Async saved');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no viewport overflow');
    assert.deepEqual(errors, []);
    console.log(`PASS Editable built-ins, shared actions, focus, cancel/save, multiline, Select portals, async validation: ${width}px ${theme}`);
    await page.close();
  }
} finally { await browser.close(); }
