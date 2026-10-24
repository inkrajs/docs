import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function mount(page, key, id) {
  await page.goto(`${base}/docs/components/command#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async ({ key, id }) => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = id;
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/CommandRefinementFixture.tsx');
    window[key] = fixture.mount(container);
  }, { key, id });
}

async function waitForCanvasPixels(locator) {
  await locator.evaluate(async node => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const canvas = node instanceof HTMLCanvasElement ? node : node.querySelector('canvas');
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, index) => index % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Expected visible pencil pixels');
  });
}

const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await mount(page, 'commandRefinementFixture', 'command-refinement-fixture');
  const events = () => page.evaluate(() => window.commandRefinementFixture.events);
  const controlled = page.getByTestId('controlled-case');
  await controlled.waitFor();
  const input = controlled.getByRole('combobox', { name: 'Controlled commands' });

  await page.getByTestId('focus-controlled').click();
  assert(await input.evaluate(node => node === document.activeElement), 'forwarded input ref receives the native cmdk input');
  const inputWrap = controlled.locator('.inkra-command__input-wrap');
  for (const direction of ['ltr', 'rtl']) {
    await inputWrap.evaluate((node, dir) => { node.dir = dir; }, direction);
    const lines = await inputWrap.locator(':scope > .inkra-pencil-line').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      const parent = node.parentElement.getBoundingClientRect();
      return { start: box.left - parent.left, end: parent.right - box.right };
    }));
    assert.equal(lines.length, 2);
    assert(lines.every(line => Math.abs(line.start - 12) < 1 && Math.abs(line.end - 12) < 1),
      `both ${direction} search lines keep equal insets: ${JSON.stringify(lines)}`);
  }
  await inputWrap.evaluate(node => node.removeAttribute('dir'));
  await page.waitForFunction(node => node.dataset.pencilEditableReady === 'true', await inputWrap.elementHandle());
  assert.equal(await input.evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
  assert.notEqual(await input.evaluate(node => getComputedStyle(node).caretColor), 'rgba(0, 0, 0, 0)', 'native caret stays visible over pencil lettering');
  await waitForCanvasPixels(inputWrap.locator('.inkra-editable-text'));
  await waitForCanvasPixels(inputWrap.locator('.inkra-command__input-focus-line'));
  assert.equal(await inputWrap.locator('.inkra-command__input-focus-line').evaluate(node => getComputedStyle(node).opacity), '1');

  await input.fill('beta');
  await controlled.getByRole('option', { name: 'Beta action' }).waitFor();
  assert.equal(await controlled.getByRole('option', { name: 'Alpha action' }).count(), 0, 'cmdk filtering hides nonmatches');
  assert.equal((await events()).controlledSearch.at(-1), 'beta', 'controlled search reports the accepted query');
  assert.match(await page.getByTestId('controlled-values').textContent(), /^beta:/);

  await input.dispatchEvent('compositionstart', { data: '贝' });
  await input.press('Enter');
  assert.deepEqual((await events()).selected, [], 'IME Enter does not select during composition');
  assert.equal(await inputWrap.getAttribute('data-composing'), 'true');
  await input.dispatchEvent('compositionend', { data: '贝' });
  await input.press('Enter');
  assert.deepEqual((await events()).selected, ['beta']);
  assert.equal(await inputWrap.getAttribute('data-composing'), null);

  const uncontrolled = page.getByTestId('uncontrolled-case');
  const uncontrolledInput = uncontrolled.getByRole('combobox', { name: 'Uncontrolled commands' });
  await uncontrolledInput.focus();
  await uncontrolledInput.fill('');
  await uncontrolledInput.press('End');
  let activeId = await uncontrolledInput.getAttribute('aria-activedescendant');
  assert.equal(await uncontrolled.locator(`[id="${activeId}"]`).getAttribute('data-value'), 'omega', 'End skips the disabled item');
  await uncontrolledInput.press('ArrowDown');
  activeId = await uncontrolledInput.getAttribute('aria-activedescendant');
  assert.equal(await uncontrolled.locator(`[id="${activeId}"]`).getAttribute('data-value'), 'alpha', 'loop wraps to the first item');
  await uncontrolledInput.press('End');
  await uncontrolledInput.press('Home');
  activeId = await uncontrolledInput.getAttribute('aria-activedescendant');
  assert.equal(await uncontrolled.locator(`[id="${activeId}"]`).getAttribute('data-value'), 'alpha', 'Home returns to the first item');

  const narrow = page.getByTestId('narrow-case');
  assert.equal(await narrow.locator('.inkra-command__paper').count(), 0, 'embedded Command does not add a second paper surface');
  assert.equal(await narrow.getByTestId('host-surface').count(), 1);
  const longItem = narrow.getByRole('option', { name: /very long command label/i });
  const geometry = await longItem.evaluate(node => {
    const item = node.getBoundingClientRect();
    const label = node.querySelector('.inkra-command__label').getBoundingClientRect();
    const shortcut = node.querySelector('.inkra-command__shortcut').getBoundingClientRect();
    const source = node.querySelector('.inkra-command__label .inkra-pencil-text__source');
    const range = document.createRange();
    range.selectNodeContents(source);
    return {
      item: { left: item.left, right: item.right, width: item.width },
      label: { left: label.left, right: label.right, width: label.width },
      shortcut: { left: shortcut.left, right: shortcut.right, width: shortcut.width },
      lines: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right })),
    };
  });
  assert(geometry.label.width > 0 && geometry.shortcut.width > 0, JSON.stringify(geometry));
  assert(geometry.label.left >= geometry.item.left - 1 && geometry.shortcut.right <= geometry.item.right + 1, JSON.stringify(geometry));
  assert(geometry.lines.length > 1 && geometry.lines.every(line => line.left >= geometry.label.left - 1 && line.right <= geometry.label.right + 1),
    `long no-icon label wraps inside its flexible label cell: ${JSON.stringify(geometry)}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'narrow Command does not overflow the page');

  const forced = await browser.newPage({ viewport: { width: 390, height: 800 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    const forcedErrors = [];
    forced.on('pageerror', error => forcedErrors.push(error.message));
    await mount(forced, 'commandRefinementForced', 'command-refinement-forced');
    const forcedInput = forced.getByRole('combobox', { name: 'Controlled commands', exact: true });
    await forcedInput.focus();
    const forcedWrap = forced.getByTestId('controlled-case').locator('.inkra-command__input-wrap');
    assert.equal(await forcedWrap.locator('.inkra-command__input-focus-line').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedInput.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert.notEqual(await forcedInput.evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)', 'forced colors restores native input text');
    assert.equal(await forcedInput.evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await forcedInput.evaluate(node => getComputedStyle(node).transitionDuration), '0s');
    assert.deepEqual(forcedErrors, []);
  } finally {
    await forced.close();
  }

  assert.deepEqual(errors, []);
  console.log('PASS Command cmdk search/ref/IME/keyboard, pencil input, narrow layout and platform fallbacks');
} finally {
  await page.evaluate(() => {
    window.commandRefinementFixture?.unmount();
    document.getElementById('command-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
