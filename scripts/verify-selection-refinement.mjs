import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.selectionRefinementFixture.events);
const formValues = form => form.evaluate(node => Object.fromEntries(new FormData(node)));
const waitChecked = (input, expected) => page.waitForFunction(({ node, value }) => node.checked === value,
  { node: input, value: expected });

async function toggleAndReset({ formId, inputName, resetName, canceled = false }) {
  const form = page.getByTestId(formId);
  const input = form.getByRole(inputName.role, { name: inputName.name });
  await input.click();
  const changed = await input.isChecked();
  await form.getByRole('button', { name: resetName }).click();
  await page.waitForTimeout(20);
  assert.equal(await input.isChecked(), canceled ? changed : !changed);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), resetName);
  return { form, input };
}

try {
  await page.goto(`${base}/docs/components/checkbox#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'selection-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/SelectionRefinementFixture.tsx');
    window.selectionRefinementFixture = mount(container);
  });
  await page.getByTestId('checkbox-form').waitFor();

  const checkboxResult = await toggleAndReset({
    formId: 'checkbox-form', inputName: { role: 'checkbox', name: 'Uncontrolled checkbox' }, resetName: 'Reset checkbox',
  });
  assert.deepEqual(await formValues(checkboxResult.form), { uncontrolledCheckbox: 'yes' });
  assert.deepEqual((await events()).checkbox, [false]);
  await toggleAndReset({
    formId: 'checkbox-canceled-form', inputName: { role: 'checkbox', name: 'Canceled checkbox' },
    resetName: 'Cancel checkbox reset', canceled: true,
  });

  const controlledCheckboxForm = page.getByTestId('checkbox-controlled-form');
  const controlledCheckbox = controlledCheckboxForm.getByRole('checkbox', { name: 'Controlled checkbox' });
  await controlledCheckbox.click();
  await waitChecked(await controlledCheckbox.elementHandle(), false);
  const controlledCheckboxEvents = await events();
  await controlledCheckboxForm.getByRole('button', { name: 'Reset controlled checkbox' }).click();
  await page.waitForTimeout(20);
  assert.equal(await controlledCheckbox.isChecked(), false);
  assert.deepEqual((await events()).controlledCheckbox, controlledCheckboxEvents.controlledCheckbox);

  const switchResult = await toggleAndReset({
    formId: 'switch-form', inputName: { role: 'switch', name: 'Uncontrolled switch' }, resetName: 'Reset switch',
  });
  assert.deepEqual(await formValues(switchResult.form), { uncontrolledSwitch: 'yes' });
  assert.deepEqual((await events()).switch, [false]);
  await toggleAndReset({
    formId: 'switch-canceled-form', inputName: { role: 'switch', name: 'Canceled switch' },
    resetName: 'Cancel switch reset', canceled: true,
  });

  const controlledSwitchForm = page.getByTestId('switch-controlled-form');
  const controlledSwitch = controlledSwitchForm.getByRole('switch', { name: 'Controlled switch' });
  await controlledSwitch.click();
  await waitChecked(await controlledSwitch.elementHandle(), false);
  const controlledSwitchEvents = await events();
  await controlledSwitchForm.getByRole('button', { name: 'Reset controlled switch' }).click();
  await page.waitForTimeout(20);
  assert.equal(await controlledSwitch.isChecked(), false);
  assert.deepEqual((await events()).controlledSwitch, controlledSwitchEvents.controlledSwitch);

  const radioForm = page.getByTestId('radio-form');
  await radioForm.getByRole('radio', { name: 'Radio two' }).check();
  await radioForm.getByRole('button', { name: 'Reset radio' }).click();
  await waitChecked(await radioForm.getByRole('radio', { name: 'Radio one' }).elementHandle(), true);
  assert.deepEqual(await formValues(radioForm), { uncontrolledRadio: 'one' });
  assert.deepEqual((await events()).radio, ['two']);

  const canceledRadioForm = page.getByTestId('radio-canceled-form');
  await canceledRadioForm.getByRole('radio', { name: 'Canceled two' }).check();
  await canceledRadioForm.getByRole('button', { name: 'Cancel radio reset' }).click();
  await page.waitForTimeout(20);
  assert.equal(await canceledRadioForm.getByRole('radio', { name: 'Canceled two' }).isChecked(), true);

  const controlledRadioForm = page.getByTestId('radio-controlled-form');
  const controlledTwo = controlledRadioForm.getByRole('radio', { name: 'Controlled two' });
  await controlledRadioForm.getByRole('radio', { name: 'Controlled one' }).check();
  await waitChecked(await controlledTwo.elementHandle(), false);
  const controlledRadioEvents = await events();
  await controlledRadioForm.getByRole('button', { name: 'Reset controlled radio' }).click();
  await page.waitForTimeout(20);
  assert.equal(await controlledTwo.isChecked(), false);
  assert.deepEqual(await formValues(controlledRadioForm), { controlledRadio: 'one' });
  assert.deepEqual((await events()).controlledRadio, controlledRadioEvents.controlledRadio);

  const indeterminateCase = page.getByTestId('indeterminate-case');
  const mixed = indeterminateCase.getByRole('checkbox', { name: 'Indeterminate checkbox' });
  assert.equal(await mixed.getAttribute('aria-checked'), 'mixed');
  assert.equal(await mixed.evaluate(node => node.indeterminate), true);
  await indeterminateCase.getByRole('button', { name: 'Toggle indeterminate' }).click();
  assert.equal(await mixed.evaluate(node => node.indeterminate), false);

  const externalCase = page.getByTestId('external-case');
  const externalCheckbox = externalCase.getByRole('checkbox', { name: 'External checkbox' });
  const externalSwitch = externalCase.getByRole('switch', { name: 'External switch' });
  const externalRadioOne = externalCase.getByRole('radio', { name: 'External radio one' });
  const externalRadioTwo = externalCase.getByRole('radio', { name: 'External radio two' });
  await externalCheckbox.click();
  await externalSwitch.click();
  await externalRadioTwo.check();
  await externalCase.getByRole('button', { name: 'Reassociate external controls' }).click();
  await page.getByTestId('external-form-a').getByRole('button', { name: 'Reset external A' }).click();
  await page.waitForTimeout(20);
  assert.equal(await externalCheckbox.isChecked(), false, 'stale external form listener is removed');
  assert.equal(await externalSwitch.isChecked(), false, 'stale switch form listener is removed');
  assert.equal(await externalRadioTwo.isChecked(), true, 'stale radio form listener is removed');
  await page.getByTestId('external-form-b').getByRole('button', { name: 'Reset external B' }).click();
  await waitChecked(await externalCheckbox.elementHandle(), true);
  await waitChecked(await externalSwitch.elementHandle(), true);
  await waitChecked(await externalRadioOne.elementHandle(), true);
  await page.waitForFunction(node => [...node.querySelectorAll('input')].every(input =>
    (input.closest('.inkra-selection-control').dataset.checked === 'true') === input.checked), await externalCase.elementHandle());
  assert.deepEqual(await formValues(page.getByTestId('external-form-b')), {
    externalCheckbox: 'yes', externalSwitch: 'yes', externalRadio: 'one',
  });

  const splitOwner = page.getByTestId('radio-form-override-case');
  const splitTwo = splitOwner.getByRole('radio', { name: 'Split owner two' });
  await splitTwo.check();
  await page.getByTestId('external-form-a').getByRole('button', { name: 'Reset external A' }).click();
  await page.waitForTimeout(20);
  assert.equal(await splitTwo.isChecked(), true, 'group reset does not rewrite an item owned by another form');

  const rtlSwitch = page.getByTestId('rtl-case').getByRole('switch', { name: 'RTL switch' });
  const rtlThumbTransform = await page.getByTestId('rtl-case').locator('.inkra-switch__thumb').evaluate(node => getComputedStyle(node).transform);
  assert.match(rtlThumbTransform, /-20/);
  await page.keyboard.press('Tab');
  await rtlSwitch.focus();
  const focusRing = page.getByTestId('rtl-case').locator('.inkra-selection-control__focus-ring').first();
  assert.equal(await focusRing.evaluate(node => getComputedStyle(node).opacity), '1');
  assert.equal(await rtlSwitch.evaluate(node => node.getBoundingClientRect().height >= 44), true);
  assert.equal(await page.getByTestId('rtl-case').locator('.inkra-switch__track').evaluate(node => getComputedStyle(node).overflow), 'visible');
  const segment = page.getByTestId('rtl-case').locator('.inkra-radio-group__segment').first();
  assert(await segment.evaluate(node => {
    const outer = node.getBoundingClientRect();
    const ring = node.querySelector('.inkra-selection-control__focus-ring').getBoundingClientRect();
    return ring.left >= outer.left && ring.right <= outer.right && ring.top >= outer.top && ring.bottom <= outer.bottom;
  }), 'segmented focus remains inside the clipped scrolling area');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert(await focusRing.evaluate(node => getComputedStyle(node).transitionDuration.split(',').every(value => parseFloat(value) <= 0.00001)));
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await focusRing.evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await rtlSwitch.evaluate(node => getComputedStyle(node).opacity), '1');
  assert.equal(await page.getByTestId('rtl-case').locator('.inkra-switch__track').evaluate(node => getComputedStyle(node).display), 'none');

  for (const testId of ['disabled-case']) {
    const caseNode = page.getByTestId(testId);
    for (const input of await caseNode.locator('input').all()) assert.equal(await input.isDisabled(), true);
  }
  assert.deepEqual(errors, []);
  console.log('PASS Selection pencil focus, reset ownership, dynamic forms, indeterminate, RTL and fallbacks');
} finally {
  await page.evaluate(() => {
    window.selectionRefinementFixture?.unmount();
    document.getElementById('selection-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
