import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/docs/components/textarea#preview');
    await page.evaluate(async theme => {
      const { React: R, ReactDOM, ReactDOMClient, Input, Textarea } = await import('/scripts/fixtures/textarea.mjs');
      document.querySelector('#root').style.display = 'none';
      document.documentElement.dataset.theme = theme;
      const host = document.createElement('main');
      host.id = 'composition-fixture';
      Object.assign(host.style, { padding: '24px', maxWidth: '600px' });
      document.body.prepend(host);
      const h = R.createElement;
      const root = ReactDOMClient.createRoot(host);
      function Example({ multiline, controlled }) {
        const [value, setValue] = R.useState('测试文字 ABC ');
        const Component = multiline ? Textarea : Input;
        return h('form', { onReset: () => setValue('测试文字 ABC ') },
          h(Component, {
            'aria-label': 'Editor', variant: 'outline', rows: 4,
            ...(controlled ? { value, onChange: event => setValue(event.target.value) } : { defaultValue: '测试文字 ABC ' }),
          }),
          h('button', { type: 'reset' }, 'Reset'));
      }
      window.mountEditor = (multiline, controlled) => ReactDOM.flushSync(() => root.render(h(Example, { key: `${multiline}-${controlled}`, multiline, controlled })));
    }, theme);
    const cdp = await page.context().newCDPSession(page);
    for (const multiline of [false, true]) {
      for (const controlled of [false, true]) {
        await page.evaluate(([multiline, controlled]) => window.mountEditor(multiline, controlled), [multiline, controlled]);
        const input = page.getByRole('textbox', { name: 'Editor', exact: true });
        await input.waitFor();
        await page.evaluate(async () => { await document.fonts.ready; });
        await input.focus();
        await input.press('End');
        await page.waitForFunction(() => {
          const node = document.querySelector('#composition-fixture input, #composition-fixture textarea');
          return !matchMedia('(forced-colors: active)').matches && getComputedStyle(node).color === 'rgba(0, 0, 0, 0)';
        });
        const pixelHash = () => input.evaluate(node => {
          const canvas = node.closest('.inkra-field-control-hit').querySelector('.inkra-editable-text');
          const dpr = canvas.width / node.clientWidth;
          const pixels = canvas.getContext('2d').getImageData(0, 0, Math.floor(45 * dpr), Math.min(canvas.height, Math.floor(44 * dpr))).data;
          return pixels.reduce((hash, byte) => Math.imul(hash ^ byte, 16777619) >>> 0, 2166136261);
        });
        const before = await pixelHash();
        await input.evaluate(node => {
          const root = node.closest('.inkra-field-control-hit');
          window.restoredFrames = 0;
          window.inputFrames = [];
          window.editorObserver?.disconnect();
          window.editorObserver = new MutationObserver(records => {
            for (const record of records) if (record.attributeName === 'data-pencil-editable-ready' && record.oldValue === null) window.restoredFrames++;
          });
          window.editorObserver.observe(root, { attributes: true, attributeOldValue: true, attributeFilter: ['data-pencil-editable-ready'] });
          node.addEventListener('input', () => window.inputFrames.push({
            ready: root.dataset.pencilEditableReady, color: getComputedStyle(node).color,
            forcedColors: matchMedia('(forced-colors: active)').matches,
          }));
        });
        await input.pressSequentially('xyz', { delay: 20 });
        assert.equal(await pixelHash(), before, 'typing preserves existing ink pixels');
        const original = await input.inputValue();
        for (const text of ["c", "ce", "ce's"]) {
          await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
          assert.equal(await input.inputValue(), original + text);
          assert.equal(await pixelHash(), before, 'IME preedit preserves committed ink');
          assert.equal(await input.evaluate(node => node.closest('.inkra-field-control-hit').dataset.composing), 'true');
        }
        await page.screenshot({ path: `/tmp/inkra-ime-${width}-${multiline ? 'textarea' : 'input'}-${controlled ? 'controlled' : 'uncontrolled'}.png` });
        await cdp.send('Input.insertText', { text: '测试' });
        assert.equal(await input.inputValue(), original + '测试');
        assert.equal(await pixelHash(), before, 'IME commit preserves existing ink');
        await cdp.send('Input.imeSetComposition', { text: 'zhong', selectionStart: 5, selectionEnd: 5 });
        await cdp.send('Input.imeSetComposition', { text: '', selectionStart: 0, selectionEnd: 0 });
        assert.equal(await input.inputValue(), original + '测试', 'composition cancel restores committed value');
        assert.equal(await page.evaluate(() => window.restoredFrames), 0, 'typing never drops and restores the ready layer');
        const frames = await page.evaluate(() => window.inputFrames);
        assert(frames.length > 0 && frames.every(frame => frame.ready === 'true' && frame.color === 'rgba(0, 0, 0, 0)'), 'each input event finishes with readable ink: ' + JSON.stringify(frames));
        await input.evaluate(node => node.setSelectionRange(2, 4));
        await cdp.send('Input.imeSetComposition', { text: 'ti', selectionStart: 2, selectionEnd: 2 });
        await cdp.send('Input.insertText', { text: '替换' });
        assert.equal(await input.inputValue(), '测试替换 ABC xyz测试', 'composition replaces a selection without losing the suffix');
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        assert.equal(await input.inputValue(), '测试文字 ABC ');
        assert.equal(await input.evaluate(node => node.closest('.inkra-field-control-hit').dataset.pencilEditableReady), 'true');
        await page.emulateMedia({ forcedColors: 'active' });
        assert.notEqual(await input.evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
        await page.emulateMedia({ forcedColors: 'none' });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        console.log(`PASS real Chromium IME, frame continuity, prefix pixels, selection replacement and reset: ${width} ${theme}, multiline=${multiline}, controlled=${controlled}`);
      }
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
