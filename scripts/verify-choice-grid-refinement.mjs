import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.choiceGridRefinementFixture.events);
const formValues = form => form.evaluate(node => {
  const result = {};
  for (const [key, value] of new FormData(node)) {
    if (key in result) result[key] = [...(Array.isArray(result[key]) ? result[key] : [result[key]]), value];
    else result[key] = value;
  }
  return result;
});
const checkedValue = scope => scope.locator('input:checked').evaluateAll(inputs => inputs.map(input => input.value));
const flushReset = () => page.waitForTimeout(20);

async function assertPencilFocus(option, input) {
  await page.keyboard.press('Tab');
  await input.focus();
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await option.locator('.inkra-choice-grid__focus').elementHandle());
  const focus = option.locator('.inkra-choice-grid__focus');
  assert.equal(await focus.count(), 1);
  await focus.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let index = 0; index < 100; index += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, pixelIndex) => pixelIndex % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('ChoiceGrid pencil focus has no visible pixels');
  });
}

try {
  await page.goto(`${base}/docs/components/choice-grid#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'choice-grid-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/ChoiceGridRefinementFixture.tsx');
    window.choiceGridRefinementFixture = mount(container);
  });
  await page.getByTestId('label-case').waitFor();

  const labelCase = page.getByTestId('label-case');
  const stringOption = labelCase.locator('.inkra-choice-grid__option').first();
  const nodeOption = labelCase.locator('.inkra-choice-grid__option').nth(1);
  assert.equal(await stringOption.locator('.inkra-choice-grid__option-label .inkra-pencil-text').count(), 1);
  assert.match(await stringOption.locator('.inkra-pencil-text__source').innerText(), /String label/);
  assert.equal(await nodeOption.locator('.inkra-choice-grid__option-label .inkra-pencil-text').count(), 0);
  assert.equal(await page.getByTestId('custom-label').innerText(), 'Custom node label');

  const singleForm = page.getByTestId('single-reset-form');
  const singleInputs = singleForm.locator('input[type="radio"]');
  assert.deepEqual(await checkedValue(singleForm), ['balanced']);
  await singleInputs.nth(0).focus();
  await singleInputs.nth(0).press('ArrowRight');
  assert.deepEqual(await checkedValue(singleForm), ['balanced']);
  await singleInputs.nth(1).press('ArrowRight');
  assert.deepEqual(await checkedValue(singleForm), ['spacious']);
  assert.deepEqual(await formValues(singleForm), { singleChoice: 'spacious' });
  const singleEventsBeforeReset = (await events()).single.length;
  const singleReset = singleForm.getByRole('button', { name: 'Reset single choice', exact: true });
  await singleReset.click();
  await flushReset();
  assert.deepEqual(await checkedValue(singleForm), ['balanced']);
  assert.deepEqual(await formValues(singleForm), { singleChoice: 'balanced' });
  assert.equal((await events()).single.length, singleEventsBeforeReset, 'native reset emits no single callback');
  assert(await singleReset.evaluate(node => node === document.activeElement), 'native reset keeps button focus');

  const multipleForm = page.getByTestId('multiple-reset-form');
  const metadata = multipleForm.locator('input[value="metadata"]');
  await metadata.focus();
  await metadata.press('Space');
  assert.deepEqual((await checkedValue(multipleForm)).sort(), ['history', 'metadata', 'notes']);
  assert.deepEqual(await formValues(multipleForm), { multipleChoice: ['notes', 'metadata', 'history'] });
  const multipleEventsBeforeReset = (await events()).multiple.length;
  const multipleReset = multipleForm.getByRole('button', { name: 'Reset multiple choice', exact: true });
  await multipleReset.click();
  await flushReset();
  assert.deepEqual((await checkedValue(multipleForm)).sort(), ['history', 'notes']);
  assert.deepEqual(await formValues(multipleForm), { multipleChoice: ['notes', 'history'] });
  assert.equal((await events()).multiple.length, multipleEventsBeforeReset, 'native reset emits no multiple callback');

  const canceledForm = page.getByTestId('canceled-reset-form');
  await canceledForm.locator('input[value="spacious"]').check();
  const canceledReset = canceledForm.getByRole('button', { name: 'Cancel choice reset', exact: true });
  await canceledReset.click();
  await flushReset();
  assert.deepEqual(await checkedValue(canceledForm), ['spacious']);
  assert.deepEqual(await formValues(canceledForm), { canceledChoice: 'spacious' });
  assert.deepEqual((await events()).canceled, ['spacious']);
  assert(await canceledReset.evaluate(node => node === document.activeElement));

  const externalForm = page.getByTestId('external-form');
  const externalCase = page.getByTestId('external-case');
  await externalCase.locator('input[value="spacious"]').check();
  assert.deepEqual(await formValues(externalForm), { externalChoice: 'spacious' });
  const externalReset = externalForm.getByRole('button', { name: 'Reset external choice', exact: true });
  await externalReset.click();
  await flushReset();
  assert.deepEqual(await checkedValue(externalCase), ['compact']);
  assert.deepEqual(await formValues(externalForm), { externalChoice: 'compact' });
  assert.deepEqual((await events()).external, ['spacious']);

  const controlledSingleForm = page.getByTestId('controlled-single-form');
  await controlledSingleForm.locator('input[value="balanced"]').check();
  assert.deepEqual(await checkedValue(controlledSingleForm), ['balanced']);
  const controlledSingleReset = controlledSingleForm.getByRole('button', { name: 'Reset controlled single', exact: true });
  await controlledSingleReset.click();
  await flushReset();
  assert.deepEqual(await checkedValue(controlledSingleForm), ['balanced']);
  assert.deepEqual(await formValues(controlledSingleForm), { controlledSingle: 'balanced' });
  assert.deepEqual((await events()).controlledSingle, ['balanced']);

  const controlledMultipleForm = page.getByTestId('controlled-multiple-form');
  await controlledMultipleForm.locator('input[value="metadata"]').check();
  assert.deepEqual((await checkedValue(controlledMultipleForm)).sort(), ['metadata', 'notes']);
  const controlledMultipleReset = controlledMultipleForm.getByRole('button', { name: 'Reset controlled multiple', exact: true });
  await controlledMultipleReset.click();
  await flushReset();
  assert.deepEqual((await checkedValue(controlledMultipleForm)).sort(), ['metadata', 'notes']);
  assert.deepEqual(await formValues(controlledMultipleForm), { controlledMultiple: ['notes', 'metadata'] });
  assert.deepEqual((await events()).controlledMultiple, [['notes', 'metadata']]);

  const selectedOption = singleForm.locator('.inkra-choice-grid__option').nth(1);
  const selectedInput = selectedOption.locator('input');
  await assertPencilFocus(selectedOption, selectedInput);
  assert.equal(await selectedOption.locator('.inkra-choice-grid__selection').evaluate(node => getComputedStyle(node).opacity), '1',
    'selection remains distinct from focus');
  assert.equal(await selectedOption.locator('.inkra-choice-grid__focus').evaluate(node => getComputedStyle(node).opacity), '1');
  assert.equal(await selectedOption.locator('.inkra-selection-control__focus-ring')
    .evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length), 0,
  'ChoiceGrid suppresses the nested selection focus ring');

  const narrow = page.getByTestId('narrow-case');
  assert.equal(await narrow.locator('.inkra-choice-grid__option').count(), 3);
  const narrowGrid = narrow.locator('.inkra-radio-group__items');
  assert.equal((await narrowGrid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)), 1);
  const longLabel = narrow.locator('.inkra-choice-grid__option-label').first();
  assert.equal(await longLabel.innerText(), await page.evaluate(() => window.choiceGridRefinementFixture.longLabel));
  assert(await longLabel.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node.querySelector('.inkra-pencil-text__source'));
    const bounds = node.getBoundingClientRect();
    const option = node.closest('.inkra-choice-grid__option');
    const focusOffset = parseFloat(getComputedStyle(option).getPropertyValue('--inkra-focus-offset'));
    return [...range.getClientRects()].every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1)
      && option.scrollWidth <= option.clientWidth + focusOffset;
  }), 'actual text stays inside the label; only the intentional focus offset extends the option');
  assert.equal(await narrow.locator('.inkra-choice-grid__error').innerText(), 'Choose a supported layout.');
  assert(await narrow.locator('input[value="disabled"]').isDisabled());
  const wideGrid = page.getByTestId('wide-columns-case').locator('.inkra-radio-group__items');
  assert.equal((await wideGrid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)), 3,
    'wide containers retain explicit columns');
  for (const input of await page.locator('#choice-grid-refinement-fixture .inkra-selection-control__input').all()) {
    const box = await input.locator('..').boundingBox();
    assert(box && box.height >= 44, 'native option label keeps a 44px target');
  }

  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fixture overflow`);
    await narrow.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-choice-grid-refinement-${width}.png`, animations: 'disabled' });
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await page.keyboard.press('Tab');
  await selectedInput.focus();
  assert.equal(await selectedOption.locator('.inkra-choice-grid__focus').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await selectedInput.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
  assert.equal(await selectedOption.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  assert.equal(await selectedInput.evaluate(node => getComputedStyle(node).opacity), '1');
  assert.deepEqual(errors, []);
  console.log('PASS ChoiceGrid pencil labels/focus, native keyboard/forms/resets, controlled values and narrow layout');
} finally {
  await page.evaluate(() => {
    window.choiceGridRefinementFixture?.unmount();
    document.getElementById('choice-grid-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
