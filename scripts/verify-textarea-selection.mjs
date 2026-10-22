import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async theme => {
      const { React: R, ReactDOM, ReactDOMClient, Textarea, Input, PencilText, Table } = await import('/scripts/fixtures/textarea.mjs');
      document.querySelector('#root').style.display = 'none';
      const host = document.createElement('main');
      host.id = 'textarea-fixture';
      host.dataset.inkraTheme = theme;
      Object.assign(host.style, { padding: '20px', maxWidth: '600px', background: 'var(--inkra-paper)', color: 'var(--inkra-ink)' });
      document.body.prepend(host);
      const h = R.createElement;
      const root = ReactDOMClient.createRoot(host);
      window.mountTextarea = (props = {}) => ReactDOM.flushSync(() => root.render(h('form', { id: 'textarea-form' },
        h(Textarea, { key: JSON.stringify(props), 'aria-label': 'Notes', name: 'notes', maxLength: 10, ...props }),
        h('button', { type: 'reset' }, 'Reset'),
        h(Input, { 'aria-label': 'Title', defaultValue: 'Pencil 文字' }),
        h(Table.Root, null, h(Table.Body, null, h(Table.Row, null, h(Table.Cell, null,
          h(PencilText, null, 'value / defaultValue'))))))));
      window.mountTextarea();
    }, theme);
    const textarea = page.getByRole('textbox', { name: 'Notes', exact: true });
    const count = page.locator('.inkra-textarea__count');
    const ready = async field => {
      await field.evaluate(async node => {
        for (let i = 0; i < 250; i++) {
          if (node.closest('.inkra-field-control-hit').dataset.pencilEditableReady === 'true') return;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        throw new Error('Editable lettering did not paint');
      });
    };
    assert.equal(await textarea.evaluate(node => getComputedStyle(node).resize), 'none');
    assert.equal(await page.locator('.inkra-textarea__resize').count(), 0);
    assert.equal(await count.getAttribute('data-visible'), 'false');
    const initial = await textarea.boundingBox();
    await textarea.fill('12345678');
    assert.equal(await count.textContent(), '2 remaining');
    assert.equal(await count.getAttribute('data-visible'), 'true');
    assert.deepEqual(await textarea.boundingBox(), initial, 'counter does not shift editor geometry');
    await textarea.press('End');
    await textarea.pressSequentially('90123');
    assert.equal(await textarea.inputValue(), '1234567890', 'native maxLength enforced');
    assert.equal(await count.textContent(), '0 remaining');
    await ready(textarea);
    await textarea.evaluate(node => { node.focus(); node.select(); });
    const layers = await textarea.evaluate(node => ({
      native: Number(getComputedStyle(node).zIndex),
      canvas: Number(getComputedStyle(node.parentElement.querySelector('.inkra-editable-text')).zIndex),
      selected: getComputedStyle(node, '::selection').color,
      pointerEvents: getComputedStyle(node.parentElement.querySelector('.inkra-editable-text')).pointerEvents,
    }));
    assert(layers.canvas > layers.native, 'ink stays above opaque selection background');
    assert.equal(layers.selected, 'rgba(0, 0, 0, 0)', 'native duplicate glyphs stay hidden');
    assert.equal(layers.pointerEvents, 'none');
    await page.screenshot({ path: `/tmp/inkra-textarea-selected-${theme}.png` });
    await textarea.press('Backspace');
    assert.equal(await textarea.inputValue(), '');
    assert.equal(await count.getAttribute('data-visible'), 'false');
    await page.evaluate(() => window.mountTextarea({ defaultValue: '12345678', countMode: 'fraction', countDisplay: 'always' }));
    assert.equal(await count.textContent(), '8 / 10');
    await textarea.fill('1234567890');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.inkra-textarea__count').textContent === '8 / 10');
    await page.evaluate(() => window.mountTextarea({ defaultValue: '中文😀', countMode: 'progress', countDisplay: 'always', resize: 'vertical' }));
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '4', 'UTF-16 matches native limit');
    const handle = page.getByRole('slider', { name: 'Resize text area' });
    const before = (await textarea.boundingBox()).height;
    await handle.focus();
    await handle.press('ArrowDown');
    assert.equal(Math.round((await textarea.boundingBox()).height), Math.round(before + 20));
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 40, { steps: 4 });
    await page.mouse.up();
    assert.equal(Math.round((await textarea.boundingBox()).height), Math.round(before + 60));
    await textarea.dispatchEvent('compositionstart');
    assert.equal(await textarea.evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)', 'composition keeps committed pencil lettering visible');
    await textarea.dispatchEvent('compositionend');
    await ready(textarea);
    const input = page.getByRole('textbox', { name: 'Title', exact: true });
    await ready(input);
    await input.evaluate(node => { node.focus(); node.setSelectionRange(0, 6); });
    await input.pressSequentially('New');
    assert.equal(await input.inputValue(), 'New 文字');
    const source = page.locator('#textarea-fixture td .inkra-pencil-text__source');
    await source.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    assert.equal(await page.evaluate(() => getSelection().toString()), 'value / defaultValue');
    assert.equal(await source.evaluate(node => getComputedStyle(node, '::selection').color), 'rgba(0, 0, 0, 0)');
    await page.screenshot({ path: `/tmp/inkra-table-selected-${theme}.png` });
    await page.emulateMedia({ forcedColors: 'active' });
    assert.notEqual(await source.evaluate(node => getComputedStyle(node, '::selection').color), 'rgba(0, 0, 0, 0)');
    assert.notEqual(await textarea.evaluate(node => getComputedStyle(node, '::selection').color), 'rgba(0, 0, 0, 0)');
    await page.emulateMedia({ forcedColors: 'none' });
    await page.evaluate(() => window.mountTextarea({ maxLength: 0 }));
    assert.equal(await count.textContent(), '0 remaining');
    await page.evaluate(() => window.mountTextarea({ maxLength: 3, value: '12345', readOnly: true }));
    assert.equal(await count.textContent(), '2 over limit');
    await page.evaluate(() => window.mountTextarea({ countMode: 'none', resize: 'vertical', disabled: true }));
    assert.equal(await count.count(), 0);
    assert(await handle.isDisabled());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS selection, counts, reset, composition, custom resize and forced colors: ${width} ${theme}`);
  }
} finally { await browser.close(); }
