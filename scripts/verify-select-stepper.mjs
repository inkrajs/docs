import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const expectedHeights = { sm: 36, md: 44, lg: 48 };
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const fixtureEvents = () => page.evaluate(() => window.selectStepperFixture.events);
const visibleValue = testId => page.getByTestId(testId).getByRole('spinbutton').getAttribute('aria-valuetext');
const nativeValue = testId => page.getByTestId(testId).locator('.inkra-select-stepper__native').inputValue();
const action = (container, name) => container.locator(`.inkra-select-stepper__button[aria-label="${name}"]`);
const waitForAttribute = async (locator, name, expected) => {
  await locator.waitFor();
  await locator.evaluate((node, condition) => new Promise((resolve, reject) => {
    const matches = () => node.getAttribute(condition.name) === condition.expected;
    if (matches()) { resolve(undefined); return; }
    const observer = new MutationObserver(() => {
      if (!matches()) return;
      observer.disconnect();
      clearTimeout(timeout);
      resolve(undefined);
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timed out waiting for ${condition.name}=${condition.expected}`));
    }, 3000);
    observer.observe(node, { attributes: true, attributeFilter: [condition.name] });
  }), { name, expected });
};
const waitForVisibleValue = (testId, expected) => waitForAttribute(page.getByTestId(testId).getByRole('spinbutton'), 'aria-valuetext', expected);
const waitForInputValue = async (locator, expected) => {
  await page.waitForFunction(({ selector, expectedValue }) => document.querySelector(selector)?.value === expectedValue, {
    selector: `#select-stepper-fixture [data-testid="${await locator.getAttribute('data-testid')}"] .inkra-select-stepper__native`,
    expectedValue: expected,
  });
};
const waitForFormValue = async (form, name, expected) => {
  await page.waitForFunction(({ formId, fieldName, expectedValue }) => {
    const node = document.querySelector(`[data-testid="${formId}"]`);
    return node instanceof HTMLFormElement && new FormData(node).get(fieldName) === expectedValue;
  }, { formId: await form.getAttribute('data-testid'), fieldName: name, expectedValue: expected });
};
const assertNoPopover = async () => {
  assert.equal(await page.locator('.inkra-select__content, .inkra-search-select__popup, [data-radix-popper-content-wrapper]').count(), 0);
};

try {
  await page.goto(`${base}/docs/components/select#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'select-stepper-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/select-stepper.tsx');
    window.selectStepperFixture = mount(container);
  });
  await page.getByTestId('controlled-case').waitFor();
  await settle();

  const controlled = page.getByTestId('controlled-case');
  const controlledValue = controlled.getByRole('spinbutton');
  assert.equal(await controlledValue.getAttribute('aria-valuetext'), 'Private');
  assert.equal(await action(controlled, 'Previous controlled option').isDisabled(), true);
  await action(controlled, 'Next controlled option').click();
  await waitForAttribute(controlledValue, 'aria-valuetext', 'Public');
  assert.equal(await action(controlled, 'Next controlled option').isDisabled(), true);
  assert.deepEqual((await fixtureEvents()).controlled, ['public']);
  await action(controlled, 'Previous controlled option').click();
  await waitForAttribute(controlledValue, 'aria-valuetext', 'Private');

  const loop = page.getByTestId('loop-case');
  await action(loop, 'Previous loop option').click();
  await waitForVisibleValue('loop-case', 'Public');
  await action(loop, 'Next loop option').click();
  await waitForVisibleValue('loop-case', 'Private');

  const keyboard = page.getByTestId('keyboard-case').getByRole('spinbutton');
  await keyboard.focus();
  await page.keyboard.press('ArrowRight');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Public');
  await page.keyboard.press('Home');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Private');
  await page.keyboard.press('End');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Public');
  await page.keyboard.press('ArrowLeft');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Private');
  await page.keyboard.press('ArrowDown');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Public');
  await page.keyboard.press('ArrowUp');
  await waitForAttribute(keyboard, 'aria-valuetext', 'Private');

  const rtlCase = page.getByTestId('rtl-case');
  const rtl = rtlCase.getByRole('spinbutton');
  await rtl.focus();
  await page.keyboard.press('ArrowRight');
  await waitForAttribute(rtl, 'aria-valuetext', 'Private');
  await page.keyboard.press('ArrowLeft');
  await waitForAttribute(rtl, 'aria-valuetext', 'Public');
  const rtlTransform = await action(rtlCase, 'Previous RTL option').locator('.inkra-pencil-icon')
    .evaluate(node => getComputedStyle(node).transform);
  assert.notEqual(rtlTransform, 'none', 'RTL mirrors the horizontal arrow glyph');

  const normalForm = page.getByTestId('normal-reset-form');
  await action(normalForm, 'Previous normal reset option').click();
  await waitForVisibleValue('normal-reset-form', 'Private');
  await waitForFormValue(normalForm, 'normalVisibility', 'private');
  await normalForm.getByRole('button', { name: 'Reset normal selection' }).click();
  await waitForVisibleValue('normal-reset-form', 'Public');
  await waitForFormValue(normalForm, 'normalVisibility', 'public');
  assert.equal((await fixtureEvents()).normalResets, 1);

  const pristineForm = page.getByTestId('pristine-reset-form');
  assert.equal(await visibleValue('pristine-reset-form'), 'B');
  assert.equal((await pristineForm.evaluate(form => Object.fromEntries(new FormData(form)))).pristineVisibility, 'b');
  await pristineForm.getByRole('button', { name: 'Reset pristine selection' }).click();
  await waitForVisibleValue('pristine-reset-form', 'B');
  await waitForFormValue(pristineForm, 'pristineVisibility', 'b');

  const canceledForm = page.getByTestId('canceled-reset-form');
  await action(canceledForm, 'Previous canceled reset option').click();
  await waitForVisibleValue('canceled-reset-form', 'Private');
  await canceledForm.getByRole('button', { name: 'Reset canceled selection' }).click();
  await waitForVisibleValue('canceled-reset-form', 'Private');
  await waitForFormValue(canceledForm, 'canceledVisibility', 'private');
  assert.equal((await fixtureEvents()).canceledResets, 1);

  const requiredForm = page.getByTestId('required-form');
  const requiredControl = requiredForm.getByRole('spinbutton');
  assert.equal(await requiredForm.evaluate(form => form.checkValidity()), false);
  await requiredForm.getByRole('button', { name: 'Submit required selection' }).click();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role')), 'spinbutton');
  assert.deepEqual((await fixtureEvents()).requiredSubmissions, []);
  await action(requiredForm, 'Next required option').click();
  await waitForAttribute(requiredControl, 'aria-valuetext', 'Private');
  await waitForFormValue(requiredForm, 'requiredVisibility', 'private');
  assert.equal(await requiredForm.evaluate(form => form.checkValidity()), true);
  await requiredForm.getByRole('button', { name: 'Submit required selection' }).click();
  assert.deepEqual((await fixtureEvents()).requiredSubmissions, [{ requiredVisibility: 'private' }]);

  const readonlyForm = page.getByTestId('readonly-required-form');
  assert.equal(await readonlyForm.evaluate(form => form.checkValidity()), true, 'readonly empty control cannot trap the form in required validation');
  assert.equal(await readonlyForm.locator('.inkra-select-stepper__native').getAttribute('required'), null);
  await readonlyForm.getByRole('button', { name: 'Submit readonly selection' }).click();
  assert.deepEqual((await fixtureEvents()).readonlySubmissions, [{ readonlyVisibility: '' }]);

  const emptyCase = page.getByTestId('empty-case');
  assert.equal(await visibleValue('empty-case'), 'No options');
  assert.equal(await action(emptyCase, 'Previous empty option').isDisabled(), true);
  assert.equal(await action(emptyCase, 'Next empty option').isDisabled(), true);
  assert.equal(await nativeValue('empty-case'), '');

  const disabledCase = page.getByTestId('disabled-items-case');
  assert.equal(await action(disabledCase, 'Previous disabled option').isDisabled(), true);
  assert.equal(await action(disabledCase, 'Next disabled option').isDisabled(), true);

  const missingCase = page.getByTestId('missing-case');
  assert.equal(await visibleValue('missing-case'), 'Missing option');
  assert.equal(await nativeValue('missing-case'), '', 'unknown values do not select the first real option');
  await page.evaluate(() => window.selectStepperFixture.setMissingAvailable(true));
  await waitForVisibleValue('missing-case', 'Restored');
  await waitForInputValue(missingCase, 'removed');
  await page.evaluate(() => window.selectStepperFixture.setMissingAvailable(false));
  await waitForVisibleValue('missing-case', 'Missing option');
  await waitForInputValue(missingCase, '');
  await action(missingCase, 'Next missing option').click();
  await waitForVisibleValue('missing-case', 'Private');

  for (const [size, expected] of Object.entries(expectedHeights)) {
    const sizeCase = page.locator(`[data-stepper-size="${size}"]`);
    const visual = await sizeCase.locator('.inkra-select-stepper__control').boundingBox();
    const hit = await sizeCase.locator('.inkra-select-stepper').boundingBox();
    assert(visual && Math.abs(visual.height - expected) <= 1, `${size} visual height is ${visual?.height}px, expected ${expected}px`);
    assert(hit && hit.height >= 43, `${size} control keeps a 44px hit height`);
    for (const button of await sizeCase.locator('.inkra-select-stepper__button').all()) {
      const box = await button.boundingBox();
      assert(box && box.height >= 43 && box.width >= 43, `${size} arrow target remains at least 44px`);
    }
  }

  await assertNoPopover();
  assert.deepEqual(pageErrors, []);
  console.log('PASS Select.Stepper click, loop, disabled skipping, keyboard/RTL, forms, edge cases, sizes and no-popover behavior');
} finally {
  await page.evaluate(() => {
    window.selectStepperFixture?.unmount();
    document.getElementById('select-stepper-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
