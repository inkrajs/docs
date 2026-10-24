import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.colorPickerRefinementFixture.events);
const valueInput = scope => scope.getByRole('textbox', { name: 'Test color value', exact: true });
const formValues = form => form.evaluate(node => Object.fromEntries(new FormData(node)));
const waitForValue = async (input, expected) => {
  await page.waitForFunction(({ node, expected }) => node.value === expected,
    { node: await input.elementHandle(), expected });
};

async function assertPencilFocus(scope, focusTarget) {
  await focusTarget.focus();
  const focusLayers = scope.locator('.inkra-color-picker__focus, .inkra-color-swatch > .inkra-button__focus-ring');
  const activeIndex = await focusLayers.evaluateAll(nodes => nodes.findIndex(node => getComputedStyle(node).opacity === '1'));
  assert(activeIndex >= 0, 'focused action exposes a pencil focus surface');
  assert.equal(await focusLayers.evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).opacity === '1').length), 1);
  const focus = focusLayers.nth(activeIndex);
  await focus.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let index = 0; index < 100; index += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, pixelIndex) => pixelIndex % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Focused ColorPicker pencil outline has no visible pixels');
  });
}

try {
  await page.goto(`${base}/docs/components/color-picker#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'color-picker-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/ColorPickerRefinementFixture.tsx');
    window.colorPickerRefinementFixture = mount(container);
  });
  await page.getByTestId('reset-form').waitFor();

  const resetForm = page.getByTestId('reset-form');
  const resetInput = valueInput(resetForm);
  assert.deepEqual(await formValues(resetForm), { resetColor: '#aabbccff' });
  await resetInput.fill('#123');
  await resetInput.press('Enter');
  await waitForValue(resetInput, '#112233ff');
  assert.deepEqual((await events()).changes, ['input:#112233ff']);
  await resetInput.blur();
  assert.deepEqual((await events()).changes, ['input:#112233ff'], 'Enter followed by blur commits once');
  await resetForm.getByRole('button', { name: 'Reset color', exact: true }).click();
  await waitForValue(resetInput, '#aabbccff');
  assert.deepEqual(await formValues(resetForm), { resetColor: '#aabbccff' });
  assert.deepEqual((await events()).changes, ['input:#112233ff'], 'native reset emits no value callback');

  const canceledForm = page.getByTestId('canceled-reset-form');
  const canceledInput = valueInput(canceledForm);
  await canceledInput.fill('#def');
  await canceledInput.press('Enter');
  await waitForValue(canceledInput, '#ddeeffff');
  const canceledChangesBeforeReset = (await events()).changes.length;
  await canceledForm.getByRole('button', { name: 'Cancel color reset', exact: true }).click();
  await page.waitForTimeout(0);
  assert.equal(await canceledInput.inputValue(), '#ddeeffff', 'preventDefault cancels reset restoration');
  assert.deepEqual(await formValues(canceledForm), { canceledColor: '#ddeeffff' });
  assert.equal((await events()).changes.length, canceledChangesBeforeReset, 'canceled reset emits no callback');

  const externalForm = page.getByTestId('external-form');
  const externalCase = page.getByTestId('external-case');
  const externalInput = valueInput(externalCase);
  assert.deepEqual(await formValues(externalForm), { externalColor: '#778899ff' });
  await externalInput.fill('#012');
  await externalInput.press('Enter');
  await waitForValue(externalInput, '#001122ff');
  assert.deepEqual(await formValues(externalForm), { externalColor: '#001122ff' });
  const externalChangesBeforeReset = (await events()).changes.length;
  await externalForm.getByRole('button', { name: 'Reset external color', exact: true }).click();
  await waitForValue(externalInput, '#778899ff');
  assert.deepEqual(await formValues(externalForm), { externalColor: '#778899ff' });
  assert.equal((await events()).changes.length, externalChangesBeforeReset, 'external reset emits no callback');

  const controlledForm = page.getByTestId('controlled-form');
  const controlledInput = valueInput(controlledForm);
  await controlledInput.fill('#fff');
  await controlledInput.press('Enter');
  await waitForValue(controlledInput, '#33669980');
  assert.deepEqual((await events()).controlledChanges, ['input:#ffffffff']);
  await controlledForm.getByRole('button', { name: 'Reset controlled color', exact: true }).click();
  await waitForValue(controlledInput, '#33669980');
  assert.deepEqual((await events()).controlledChanges, ['input:#ffffffff'], 'controlled reset emits no callback');
  await controlledForm.getByRole('button', { name: 'Set controlled color', exact: true }).click();
  await waitForValue(controlledInput, '#abcdef40');
  await controlledForm.getByRole('button', { name: 'Reset controlled color', exact: true }).click();
  await waitForValue(controlledInput, '#abcdef40');
  assert.deepEqual(await formValues(controlledForm), { controlledColor: '#abcdef40' });

  const equivalentCase = page.getByTestId('equivalent-case');
  const equivalentInput = valueInput(equivalentCase);
  await equivalentInput.fill(' #ABC ');
  await equivalentInput.press('Enter');
  await waitForValue(equivalentInput, '#aabbccff');
  assert.deepEqual((await events()).equivalentChanges, [], 'equivalent input canonicalizes without emitting change');
  await equivalentInput.blur();
  assert.deepEqual((await events()).equivalentChanges, []);

  const imeCase = page.getByTestId('ime-case');
  const imeInput = valueInput(imeCase);
  await imeInput.focus();
  await imeInput.evaluate(node => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '#135' }));
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor.set.call(node, '#135');
    node.dispatchEvent(new InputEvent('input', { bubbles: true, data: '#135', inputType: 'insertCompositionText', isComposing: true }));
    node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', isComposing: true }));
  });
  assert.deepEqual((await events()).imeChanges, [], 'IME Enter does not commit preedit text');
  await imeInput.evaluate(node => node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '#135' })));
  await imeInput.blur();
  await waitForValue(imeInput, '#113355ff');
  assert.deepEqual((await events()).imeChanges, ['input:#113355ff']);

  const disabledCase = page.getByTestId('disabled-case');
  const disabledInput = valueInput(disabledCase);
  assert(await disabledInput.isDisabled());
  assert(await disabledCase.getByRole('button', { name: 'Disabled preset', exact: true }).isDisabled());
  await disabledCase.locator('.inkra-color-picker__native').evaluate(node => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    descriptor.set.call(node, '#ffffff');
    node.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.deepEqual((await events()).disabledChanges, [], 'disabled palette cannot commit programmatic change events');
  assert.equal(await disabledCase.locator('input[type="hidden"]').inputValue(), '#113355ff');

  const focusCase = page.getByTestId('focus-case');
  await assertPencilFocus(focusCase, focusCase.locator('.inkra-color-picker__native'));
  await assertPencilFocus(focusCase, focusCase.getByRole('button', { name: 'Focus preset', exact: true }));

  await resetInput.fill('tomato');
  await resetInput.blur();
  assert.deepEqual((await events()).invalid, ['tomato']);
  assert.equal(await resetInput.getAttribute('aria-invalid'), 'true');

  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fixture overflow`);
    await page.getByTestId('focus-case').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-color-picker-refinement-${width}.png`, animations: 'disabled' });
  }
  assert.deepEqual(errors, []);
  console.log('PASS ColorPicker reset, external form, canonical draft, IME, disabled and pencil focus');
} finally {
  await page.evaluate(() => {
    window.colorPickerRefinementFixture?.unmount();
    document.getElementById('color-picker-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
