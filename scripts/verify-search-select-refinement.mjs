import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const expectedHeights = { sm: 36, md: 44, lg: 48 };
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.searchSelectRefinementFixture.events);
const frame = caseNode => caseNode.locator('.inkra-search-select__control');
const clear = caseNode => caseNode.locator('.inkra-search-select__clear');
const waitForClearVisibility = async (caseNode, visible) => {
  await page.waitForFunction(({ testId, expected }) => {
    const button = document.querySelector(`[data-testid="${testId}"] .inkra-search-select__clear`);
    return Boolean(button?.hasAttribute('data-visible')) === expected;
  }, { testId: await caseNode.getAttribute('data-testid'), expected: visible });
};
const formValues = form => form.evaluate(node => Object.fromEntries(new FormData(node)));
const waitForFocus = async label => page.waitForFunction(node => document.activeElement === node,
  await page.getByRole('combobox', { name: label, exact: true }).elementHandle());

try {
  await page.goto(`${base}/docs/components/select#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'search-select-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/search-select-refinement.tsx');
    window.searchSelectRefinementFixture = mount(container);
  });
  await page.getByTestId('trigger-case').waitFor();

  const triggerCase = page.getByTestId('trigger-case');
  const triggerFrameBefore = await frame(triggerCase).boundingBox();
  const triggerClearSlotBefore = await clear(triggerCase).locator('..').boundingBox();
  const triggerInput = triggerCase.getByRole('combobox', { name: 'Trigger search' });
  await triggerInput.fill('team');
  await page.getByRole('option', { name: 'Team workspace' }).click();
  await waitForClearVisibility(triggerCase, true);
  await page.locator('.inkra-search-select__popup:visible').waitFor({ state: 'hidden' });
  const triggerOpenEventsBeforeClear = (await events()).triggerOpen.filter(Boolean).length;
  await clear(triggerCase).click();
  await waitForClearVisibility(triggerCase, false);
  assert.equal((await events()).triggerOpen.filter(Boolean).length, triggerOpenEventsBeforeClear,
    'clearing trigger search does not open its popup');
  assert.equal((await events()).triggerValues.at(-1), null);
  await waitForFocus('Trigger search');
  const triggerFrameAfter = await frame(triggerCase).boundingBox();
  const triggerClearSlotAfter = await clear(triggerCase).locator('..').boundingBox();
  assert.equal(triggerFrameAfter.width, triggerFrameBefore.width, 'trigger frame width remains stable after clear');
  assert.equal(triggerClearSlotAfter.width, triggerClearSlotBefore.width, 'trigger clear slot remains reserved');
  assert.equal(await clear(triggerCase).getAttribute('tabindex'), '-1');

  const popupCase = page.getByTestId('popup-case');
  const popupTrigger = popupCase.getByRole('combobox', { name: 'Popup search' });
  assert.equal(await popupTrigger.locator('.inkra-pencil-text').evaluate(node => getComputedStyle(node).textAlign), 'start');
  const popupFrameBefore = await frame(popupCase).boundingBox();
  const popupClearSlotBefore = await clear(popupCase).locator('..').boundingBox();
  const popupClearBefore = await clear(popupCase).boundingBox();
  const popupTriggerBefore = await popupTrigger.boundingBox();
  assert(popupClearBefore.x >= popupTriggerBefore.x + popupTriggerBefore.width - 1,
    'long selected text leaves the clear action at the logical end');
  assert(popupClearBefore.x + popupClearBefore.width <= popupFrameBefore.x + popupFrameBefore.width + 1,
    'long selected text cannot push the clear action outside the shared frame');
  await popupTrigger.click();
  await page.getByRole('combobox', { name: 'Filter popup options' }).fill('team');
  await page.getByRole('option', { name: 'Team workspace' }).click();
  await waitForClearVisibility(popupCase, true);
  await page.locator('.inkra-search-select__popup:visible').waitFor({ state: 'hidden' });
  const popupOpenEventsBeforeClear = (await events()).popupOpen.filter(Boolean).length;
  await clear(popupCase).click();
  await waitForClearVisibility(popupCase, false);
  assert.equal((await events()).popupOpen.filter(Boolean).length, popupOpenEventsBeforeClear,
    'clearing popup search does not open its popup');
  assert.equal((await events()).popupValues.at(-1), null);
  await waitForFocus('Popup search');
  assert.equal((await frame(popupCase).boundingBox()).width, popupFrameBefore.width);
  assert.equal((await clear(popupCase).locator('..').boundingBox()).width, popupClearSlotBefore.width,
    'popup clear slot remains reserved');
  assert.equal(await popupTrigger.locator('button').count(), 0, 'popup trigger does not nest buttons');

  const multipleCase = page.getByTestId('multiple-case');
  await clear(multipleCase).click();
  await waitForClearVisibility(multipleCase, false);
  assert.deepEqual((await events()).multipleValues.at(-1), []);
  await waitForFocus('Multiple search');

  const resetForm = page.getByTestId('reset-form');
  assert.equal((await formValues(resetForm)).resetVisibility, 'team');
  await clear(resetForm).click();
  await waitForClearVisibility(resetForm, false);
  assert.deepEqual(await formValues(resetForm), { resetVisibility: '' });
  await resetForm.getByRole('button', { name: 'Reset searchable selection' }).click();
  await page.waitForFunction(() => new FormData(document.querySelector('[data-testid="reset-form"]')).get('resetVisibility') === 'team');
  assert.equal((await formValues(resetForm)).resetVisibility, 'team');
  assert.deepEqual((await events()).resetValues, [null], 'reset restoration does not emit a value callback');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Reset searchable selection');
  await resetForm.getByRole('combobox', { name: 'Reset search' }).click();
  const resetQuery = page.getByRole('combobox', { name: 'Search options' });
  assert.equal(await resetQuery.inputValue(), '', 'reset clears popup query state');
  assert.equal(await page.getByRole('option').count(), 4, 'reset restores the full option list');
  await page.keyboard.press('Escape');

  const canceledResetForm = page.getByTestId('canceled-reset-form');
  await clear(canceledResetForm).click();
  await waitForClearVisibility(canceledResetForm, false);
  assert.deepEqual(await formValues(canceledResetForm), { canceledResetVisibility: '' });
  await canceledResetForm.getByRole('button', { name: 'Cancel searchable reset' }).click();
  await page.waitForTimeout(0);
  assert.deepEqual(await formValues(canceledResetForm), { canceledResetVisibility: '' },
    'preventDefault cancels reset restoration');
  assert.deepEqual((await events()).canceledResetValues, [null]);

  const externalResetCase = page.getByTestId('external-reset-case');
  const externalResetForm = page.getByTestId('external-reset-form');
  await clear(externalResetCase).click();
  await waitForClearVisibility(externalResetCase, false);
  assert.deepEqual(await formValues(externalResetForm), { externalResetVisibility: '' });
  await externalResetForm.getByRole('button', { name: 'Reset external searchable selection' }).click();
  await page.waitForFunction(() => new FormData(document.querySelector('[data-testid="external-reset-form"]')).get('externalResetVisibility') === 'team');
  assert.equal((await formValues(externalResetForm)).externalResetVisibility, 'team');
  assert.deepEqual((await events()).externalResetValues, [null]);

  const controlledResetForm = page.getByTestId('controlled-reset-form');
  await controlledResetForm.getByRole('button', { name: 'Set controlled search to team' }).click();
  await page.waitForFunction(() => new FormData(document.querySelector('[data-testid="controlled-reset-form"]')).get('controlledResetVisibility') === 'team');
  await controlledResetForm.getByRole('combobox', { name: 'Controlled reset search' }).click();
  await page.getByRole('combobox', { name: 'Search options' }).fill('private');
  await controlledResetForm.getByRole('button', { name: 'Reset controlled searchable selection' }).click();
  await page.waitForFunction(() => new FormData(document.querySelector('[data-testid="controlled-reset-form"]')).get('controlledResetVisibility') === 'team');
  assert.equal((await formValues(controlledResetForm)).controlledResetVisibility, 'team',
    'controlled reset retains the current controlled value');
  assert.deepEqual((await events()).controlledResetValues, [], 'controlled reset does not emit a value callback');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Reset controlled searchable selection');

  const requiredForm = page.getByTestId('required-form');
  assert.equal(await requiredForm.evaluate(node => node.checkValidity()), false);
  await requiredForm.getByRole('button', { name: 'Submit required search' }).click();
  assert.deepEqual((await events()).requiredSubmissions, []);
  await requiredForm.getByRole('combobox', { name: 'Required search' }).click();
  await page.getByRole('option', { name: 'Private workspace' }).click();
  assert.equal(await requiredForm.evaluate(node => node.checkValidity()), true);
  await requiredForm.getByRole('button', { name: 'Submit required search' }).click();
  assert.deepEqual((await events()).requiredSubmissions, [{ requiredVisibility: 'private' }]);

  for (const testId of ['disabled-case', 'readonly-case']) {
    const caseNode = page.getByTestId(testId);
    assert.equal(await caseNode.locator('.inkra-search-select__open').isDisabled(), true);
    assert.equal(await clear(caseNode).isDisabled(), true);
  }

  const rtlCase = page.getByTestId('rtl-case');
  const inputBox = await rtlCase.locator('.inkra-input').boundingBox();
  const openBox = await rtlCase.locator('.inkra-search-select__open').boundingBox();
  assert(openBox.x < inputBox.x, 'RTL places actions on the logical end side');

  for (const [size, expected] of Object.entries(expectedHeights)) {
    for (const placement of ['trigger', 'popup']) {
      const sizeCase = page.locator(`[data-search-size="${size}"][data-search-placement="${placement}"]`);
      const frameBox = await frame(sizeCase).boundingBox();
      assert(frameBox && Math.abs(frameBox.height - expected) <= 1,
        `${size} ${placement} frame is ${frameBox?.height}px, expected ${expected}px`);
      for (const button of await sizeCase.locator('.inkra-search-select__control .inkra-button').all()) {
        const box = await button.boundingBox();
        assert(box && box.width >= 43 && box.height >= 43, `${size} ${placement} action keeps a 44px target`);
      }
    }
  }

  for (const caseNode of [triggerCase, popupCase]) {
    assert.equal(await caseNode.locator('.inkra-search-select__control > .inkra-pencil-surface__ink').count(), 1);
    assert.equal(await caseNode.locator('.inkra-search-select__control .inkra-button__surface > .inkra-pencil-surface__border:visible').count(), 0);
  }
  assert.equal(await page.locator('#search-select-refinement-fixture button button').count(), 0);
  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fixture overflow`);
    await page.getByTestId('popup-case').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-search-select-${width}.png`, animations: 'disabled' });
  }
  assert.deepEqual(errors, []);
  console.log('PASS Searchable Select shared frames, stable clear slots, forms, states, RTL and sizes');
} finally {
  await page.evaluate(() => {
    window.searchSelectRefinementFixture?.unmount();
    document.getElementById('search-select-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
