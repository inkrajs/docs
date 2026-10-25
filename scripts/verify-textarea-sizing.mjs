import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let waitSequence = 0;

const editor = id => page.locator(`#sizing-${id}`);
const metrics = id => page.evaluate(id => window.textareaSizingFixture.read(id), id);

// Wait for measured conditions to remain unchanged across animation-frame polls.
// This includes the queued input measurement and React's controlled restoration.
async function waitForSize(id, expected) {
  const token = ++waitSequence;
  try {
    await page.waitForFunction(({ id, expected, token }) => {
      const fixture = window.textareaSizingFixture;
      const current = fixture.read(id);
      if (!current) return false;
      const height = expected.reference
        ? fixture.read(expected.reference)?.height
        : expected.rows !== undefined
          ? current.lineHeight * expected.rows + current.padding + current.border
          : expected.height;
      const matches = (height === undefined || Math.abs(current.height - height) <= 1)
        && (expected.value === undefined || current.value === expected.value)
        && (expected.overflowY === undefined || current.overflowY === expected.overflowY)
        && (expected.fontSize === undefined || current.fontSize === expected.fontSize)
        && (!expected.scrolls || current.scrollHeight > current.clientHeight + 1);
      const signature = JSON.stringify(current);
      const previous = fixture.waits[token];
      const consecutive = matches ? previous?.signature === signature ? previous.consecutive + 1 : 1 : 0;
      fixture.waits[token] = { signature, consecutive };
      return consecutive >= 2;
    }, { id, expected, token }, { polling: 'raf', timeout: 10000 });
  } catch (error) {
    assert.fail(`${id}: expected ${JSON.stringify(expected)}, measured ${JSON.stringify(await metrics(id))}; ${error.message}`);
  } finally {
    await page.evaluate(token => { delete window.textareaSizingFixture.waits[token]; }, token);
  }
  return metrics(id);
}

try {
  await page.goto(`${base}/docs/components/textarea#preview`);
  await page.evaluate(async () => {
    const { React: R, ReactDOM, ReactDOMClient, Textarea } = await import('/scripts/fixtures/textarea.mjs');
    const app = document.getElementById('root');
    const wasHidden = app?.hidden;
    if (app) app.hidden = true;
    const host = document.createElement('main');
    host.id = 'textarea-sizing-fixture';
    Object.assign(host.style, { padding: '24px', maxWidth: '680px', background: 'var(--inkra-paper)' });
    document.body.prepend(host);
    const h = R.createElement;
    const root = ReactDOMClient.createRoot(host);
    const events = { controlledChanges: [], controlledInputs: [] };
    const setters = {};
    const style = { fontFamily: 'monospace', fontSize: '16px', lineHeight: '20px', padding: '8px', boxSizing: 'border-box' };
    const normalStyle = { ...style, fontSize: '15.5px', lineHeight: 'normal' };
    const field = (id, props = {}, containerStyle = {}) => h('section', {
      key: id, 'data-sizing-case': id, style: { width: '480px', maxWidth: '100%', marginBlock: '12px', ...containerStyle },
    }, h(Textarea, { id: `sizing-${id}`, 'aria-label': id, ...props }));

    function Fixture() {
      const [controlledValue, setControlledValue] = R.useState('short');
      const [acceptEdits, setAcceptEdits] = R.useState(false);
      const [automatic, setAutomatic] = R.useState(true);
      Object.assign(setters, { setControlledValue, setAcceptEdits, setAutomatic });
      return h(R.Fragment, null,
        ...['sm', 'md', 'lg'].flatMap(size => [
          field(`legacy-${size}`, { size, style }),
          field(`static-${size}`, { size, rows: 1, style }),
        ]),
        field('static-five', { rows: 5, style }),
        field('automatic', { rows: 1, autoSize: automatic ? { minRows: 1, maxRows: 3 } : false, resize: 'vertical', style }),
        field('minimum-two', { autoSize: { minRows: 2, maxRows: 3 }, style }),
        field('controlled', {
          autoSize: { minRows: 1, maxRows: 3 }, value: controlledValue, style,
          onInput: event => events.controlledInputs.push(event.currentTarget.value),
          onChange: event => {
            events.controlledChanges.push(event.currentTarget.value);
            if (acceptEdits) setControlledValue(event.currentTarget.value);
          },
        }),
        field('responsive', {
          autoSize: { minRows: 1, maxRows: 3 }, defaultValue: 'wide '.repeat(8),
          style: { ...style, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' },
        }, { fontFamily: 'monospace', fontSize: '16px', lineHeight: '20px' }),
        field('counted', { autoSize: { minRows: 1, maxRows: 3 }, maxLength: 200, countMode: 'fraction', countDisplay: 'always', style }),
        field('content-box', { rows: 1, resize: 'vertical', style: { ...style, boxSizing: 'content-box', border: '1px solid transparent', width: '300px' } }),
        field('normal-one', { rows: 1, style: normalStyle }),
        field('normal-three', { rows: 3, style: normalStyle }),
        field('normal-auto', { autoSize: { minRows: 1, maxRows: 3 }, style: normalStyle }),
      );
    }

    let mounted = true;
    window.textareaSizingFixture = {
      events, waits: {},
      setControlled: value => ReactDOM.flushSync(() => setters.setControlledValue(value)),
      setAcceptEdits: value => ReactDOM.flushSync(() => setters.setAcceptEdits(value)),
      setAutomatic: value => ReactDOM.flushSync(() => setters.setAutomatic(value)),
      read(id) {
        const control = document.getElementById(`sizing-${id}`);
        if (!control) return null;
        const computed = getComputedStyle(control);
        const number = value => Number.parseFloat(value) || 0;
        const rectangle = control.getBoundingClientRect();
        return {
          value: control.value, height: rectangle.height, width: rectangle.width,
          lineHeight: number(computed.lineHeight), fontSize: number(computed.fontSize),
          padding: number(computed.paddingTop) + number(computed.paddingBottom),
          border: number(computed.borderTopWidth) + number(computed.borderBottomWidth),
          boxSizing: computed.boxSizing, overflowY: computed.overflowY,
          clientHeight: control.clientHeight, scrollHeight: control.scrollHeight,
        };
      },
      dispose() {
        if (!mounted) return;
        mounted = false;
        ReactDOM.flushSync(() => root.unmount());
        host.remove();
        if (app) app.hidden = wasHidden;
      },
    };
    ReactDOM.flushSync(() => root.render(h(Fixture)));
    await document.fonts.ready;
  });

  for (const [size, minimum] of [['sm', 80], ['md', 96], ['lg', 112]]) {
    await waitForSize(`legacy-${size}`, { height: minimum });
    const single = await waitForSize(`static-${size}`, { rows: 1 });
    const surfaceHeight = await editor(`static-${size}`).evaluate(node => node.closest('.inkra-field-control--textarea').getBoundingClientRect().height);
    assert(Math.abs(surfaceHeight - single.height) <= 1, `${size}: old surface minimum must not turn rows=1 into multiple lines`);
  }
  await waitForSize('static-five', { rows: 5 });
  await editor('static-md').fill('one\ntwo\nthree');
  await waitForSize('static-md', { rows: 1, scrolls: true });
  console.log('PASS Textarea explicit native rows and legacy default heights at sm/md/lg');

  const automaticCase = page.locator('[data-sizing-case="automatic"]');
  await waitForSize('automatic', { rows: 1, overflowY: 'hidden' });
  await waitForSize('minimum-two', { rows: 2, overflowY: 'hidden' });
  assert.equal(await automaticCase.locator('.inkra-textarea__resize, .inkra-textarea__footer').count(), 0,
    'autoSize suppresses the manual resize handle and its otherwise empty footer');
  await editor('automatic').fill('one\ntwo');
  await waitForSize('automatic', { rows: 2, overflowY: 'hidden' });
  const longValue = 'one\ntwo\nthree\nfour\nfive';
  await editor('automatic').fill(longValue);
  const capped = await waitForSize('automatic', { rows: 3, overflowY: 'auto', scrolls: true });
  assert.equal(await editor('automatic').evaluate(node => { node.scrollTop = node.scrollHeight; return node.scrollTop > 0; }), true,
    'overflow remains scrollable inside the native editor');
  await editor('automatic').fill('short');
  await waitForSize('automatic', { rows: 1, overflowY: 'hidden' });
  console.log('PASS Textarea autoSize minimum, content growth, maxRows cap, local scroll and shrink');

  await page.evaluate(value => window.textareaSizingFixture.setControlled(value), longValue);
  await waitForSize('controlled', { rows: 3, overflowY: 'auto', value: longValue });
  await page.evaluate(() => window.textareaSizingFixture.setControlled('short'));
  await waitForSize('controlled', { rows: 1, overflowY: 'hidden', value: 'short' });
  assert.deepEqual(await page.evaluate(() => window.textareaSizingFixture.events), { controlledChanges: [], controlledInputs: [] },
    'external controlled updates and layout measurements do not fabricate edit events');
  await editor('controlled').fill(longValue);
  await waitForSize('controlled', { rows: 1, overflowY: 'hidden', value: 'short' });
  assert.deepEqual(await page.evaluate(() => window.textareaSizingFixture.events.controlledChanges), [longValue]);
  await page.evaluate(() => window.textareaSizingFixture.setAcceptEdits(true));
  await editor('controlled').fill('one\ntwo');
  await waitForSize('controlled', { rows: 2, overflowY: 'hidden', value: 'one\ntwo' });
  await page.evaluate(() => window.textareaSizingFixture.setAcceptEdits(false));
  await editor('controlled').fill(longValue);
  await waitForSize('controlled', { rows: 2, overflowY: 'hidden', value: 'one\ntwo' });
  console.log('PASS Textarea controlled external updates, accepted input and rejected-value restoration');

  const responsive = page.locator('[data-sizing-case="responsive"]');
  await waitForSize('responsive', { rows: 1, overflowY: 'hidden' });
  await responsive.evaluate(node => { node.style.width = '160px'; });
  await waitForSize('responsive', { rows: 3, overflowY: 'auto', scrolls: true });
  await responsive.evaluate(node => { node.style.width = '480px'; });
  await waitForSize('responsive', { rows: 1, overflowY: 'hidden' });
  await responsive.evaluate(node => { node.style.fontSize = '32px'; node.style.lineHeight = '40px'; });
  await waitForSize('responsive', { rows: 2, overflowY: 'hidden', fontSize: 32 });
  await responsive.evaluate(node => { node.style.fontSize = '16px'; node.style.lineHeight = '20px'; });
  await waitForSize('responsive', { rows: 1, overflowY: 'hidden', fontSize: 16 });
  console.log('PASS Textarea soft wraps and inherited font metrics respond to real container changes');

  await editor('normal-auto').fill(longValue);
  await waitForSize('normal-auto', { reference: 'normal-three', overflowY: 'auto', scrolls: true });
  await editor('normal-auto').fill('short');
  await waitForSize('normal-auto', { reference: 'normal-one', overflowY: 'hidden' });
  console.log('PASS Textarea normal line height matches native rows at a fractional font size');

  await editor('counted').fill(longValue);
  const counted = await waitForSize('counted', { rows: 3, overflowY: 'auto', scrolls: true });
  assert(Math.abs(counted.height - capped.height) <= 1, 'the counter does not consume the maxRows text budget');
  const countLayout = await editor('counted').evaluate(node => {
    const surface = node.closest('.inkra-field-control--textarea');
    const footer = surface.querySelector('.inkra-textarea__footer');
    const textBox = node.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();
    const surfaceBox = surface.getBoundingClientRect();
    return { footerHeight: footerBox.height, footerTop: footerBox.top, textBottom: textBox.bottom,
      footerBottom: footerBox.bottom, surfaceBottom: surfaceBox.bottom, surfaceHeight: surfaceBox.height };
  });
  assert(countLayout.footerHeight >= 44 - 1 && countLayout.footerTop >= countLayout.textBottom - 1, JSON.stringify(countLayout));
  assert(countLayout.footerBottom <= countLayout.surfaceBottom + 1, JSON.stringify(countLayout));
  assert(countLayout.surfaceHeight >= counted.height + countLayout.footerHeight - 1, JSON.stringify(countLayout));
  assert.equal(await page.locator('[data-sizing-case="counted"] .inkra-textarea__count').textContent(), `${longValue.length} / 200`);
  console.log('PASS Textarea count footer remains outside the capped editable rows');

  const manual = page.locator('[data-sizing-case="content-box"]');
  const handle = manual.getByRole('slider', { name: 'Resize text area', exact: true });
  const manualInitial = await waitForSize('content-box', { rows: 1 });
  assert.equal(manualInitial.boxSizing, 'content-box');
  await page.waitForFunction(({ minimum }) => {
    const handle = document.querySelector('[data-sizing-case="content-box"] [role="slider"]');
    return Math.abs(Number(handle?.getAttribute('aria-valuemin')) - minimum) <= 1;
  }, { minimum: manualInitial.height });
  await handle.press('ArrowDown');
  await waitForSize('content-box', { height: manualInitial.height + 20 });
  await handle.press('ArrowUp');
  await waitForSize('content-box', { height: manualInitial.height });
  await handle.scrollIntoViewIfNeeded();
  const handleBox = await handle.boundingBox();
  assert(handleBox, 'the native resize handle is reachable');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 30, { steps: 3 });
  } finally { await page.mouse.up(); }
  const dragged = await waitForSize('content-box', { height: manualInitial.height + 30 });
  await page.waitForFunction(({ height }) => {
    const handle = document.querySelector('[data-sizing-case="content-box"] [role="slider"]');
    return Math.abs(Number(handle?.getAttribute('aria-valuenow')) - height) <= 1;
  }, { height: dragged.height });
  await handle.press('Home');
  await waitForSize('content-box', { height: manualInitial.height });
  console.log('PASS Textarea content-box manual resize uses visible-pixel keyboard, pointer and ARIA values');

  await page.evaluate(() => window.textareaSizingFixture.setAutomatic(false));
  const toggledHandle = automaticCase.getByRole('slider', { name: 'Resize text area', exact: true });
  await toggledHandle.press('ArrowDown');
  await waitForSize('automatic', { rows: 2 });
  await page.evaluate(() => window.textareaSizingFixture.setAutomatic(true));
  await waitForSize('automatic', { rows: 1, overflowY: 'hidden' });
  assert.equal(await automaticCase.locator('.inkra-textarea__resize, .inkra-textarea__footer').count(), 0);
  console.log('PASS Textarea autoSize takes ownership again after manual resizing');

  await page.evaluate(() => window.textareaSizingFixture.dispose());
  assert.deepEqual(errors, [], 'textarea sizing must not produce browser errors or observer loops');
} finally {
  await page.evaluate(() => window.textareaSizingFixture?.dispose()).catch(() => {});
  await browser.close();
}
