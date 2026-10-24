import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.sliderRefinementFixture.events);
const value = async slider => Number(await slider.getAttribute('aria-valuenow'));
const waitValue = (slider, expected) => page.waitForFunction(({ node, expectedValue }) =>
  Number(node.getAttribute('aria-valuenow')) === expectedValue,
{ node: slider, expectedValue: expected });
const formValues = form => form.evaluate(node => Object.fromEntries(new FormData(node)));

try {
  await page.goto(`${base}/docs/components/slider#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'slider-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/SliderRefinementFixture.tsx');
    window.sliderRefinementFixture = mount(container);
  });
  await page.getByTestId('normal-form').waitFor();

  const normalForm = page.getByTestId('normal-form');
  const normal = normalForm.getByRole('slider', { name: 'Normal slider' });
  await normal.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await normal.elementHandle(), 26);
  assert.deepEqual(await formValues(normalForm), { normalLevel: '26' });
  assert.equal((await events()).inputNames.at(-1), 'normalLevel', 'Radix BubbleInput preserves input target.name');
  const normalEventCounts = await events();
  await normalForm.getByRole('button', { name: 'Reset normal slider' }).click();
  await waitValue(await normal.elementHandle(), 25);
  assert.deepEqual(await formValues(normalForm), { normalLevel: '25' });
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Reset normal slider');
  assert.deepEqual((await events()).normalChanges, normalEventCounts.normalChanges);
  assert.deepEqual((await events()).normalCommits, normalEventCounts.normalCommits);

  const canceledForm = page.getByTestId('canceled-form');
  const canceled = canceledForm.getByRole('slider', { name: 'Canceled slider' });
  await canceled.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await canceled.elementHandle(), 26);
  const canceledCounts = await events();
  await canceledForm.getByRole('button', { name: 'Cancel slider reset' }).click();
  await page.waitForTimeout(20);
  assert.equal(await value(canceled), 26);
  assert.deepEqual(await formValues(canceledForm), { canceledLevel: '26' });
  assert.deepEqual((await events()).canceledChanges, canceledCounts.canceledChanges);
  assert.deepEqual((await events()).canceledCommits, canceledCounts.canceledCommits);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Cancel slider reset');

  const externalForm = page.getByTestId('external-form');
  const external = page.getByTestId('external-case').getByRole('slider', { name: 'External slider' });
  await external.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await external.elementHandle(), 31);
  assert.deepEqual(await formValues(externalForm), { externalLevel: '31' });
  const externalCounts = await events();
  await externalForm.getByRole('button', { name: 'Reset external slider' }).click();
  await waitValue(await external.elementHandle(), 30);
  assert.deepEqual(await formValues(externalForm), { externalLevel: '30' });
  assert.deepEqual((await events()).externalChanges, externalCounts.externalChanges);
  assert.deepEqual((await events()).externalCommits, externalCounts.externalCommits);

  const controlledForm = page.getByTestId('controlled-form');
  const controlled = controlledForm.getByRole('slider', { name: 'Controlled slider' });
  await controlledForm.getByRole('button', { name: 'Set controlled slider', exact: true }).click();
  await waitValue(await controlled.elementHandle(), 70);
  const controlledCounts = await events();
  await controlledForm.getByRole('button', { name: 'Reset controlled slider' }).click();
  await page.waitForTimeout(0);
  assert.equal(await value(controlled), 70);
  assert.deepEqual(await formValues(controlledForm), { controlledLevel: '70' });
  assert.deepEqual((await events()).controlledChanges, controlledCounts.controlledChanges);
  assert.deepEqual((await events()).controlledCommits, controlledCounts.controlledCommits);

  const rangeForm = page.getByTestId('range-form');
  const lower = rangeForm.getByRole('slider', { name: 'Budget minimum' });
  const upper = rangeForm.getByRole('slider', { name: 'Budget maximum' });
  await lower.focus();
  for (let index = 0; index < 70; index += 1) await page.keyboard.press('ArrowRight');
  assert.equal(await value(lower), 60, 'minimum spacing constrains the low thumb');
  assert.equal(await value(upper), 80);
  assert.deepEqual(await formValues(rangeForm), { 'budget[]': '80' });
  assert.deepEqual(await rangeForm.evaluate(node => new FormData(node).getAll('budget[]')), ['60', '80']);
  assert.equal((await events()).inputNames.at(-1), 'budget[]', 'range BubbleInput preserves repeated form names');
  assert.equal(await rangeForm.locator('.inkra-slider__range').getAttribute('style'), 'clip-path: inset(0px 20% 0px 60%);');
  const controlledRangeCounts = await events();
  await rangeForm.getByRole('button', { name: 'Reset controlled range' }).click();
  await page.waitForTimeout(20);
  assert.equal(await value(lower), 60);
  assert.equal(await value(upper), 80);
  assert.deepEqual(await rangeForm.evaluate(node => new FormData(node).getAll('budget[]')), ['60', '80']);
  assert.deepEqual((await events()).rangeChanges, controlledRangeCounts.rangeChanges);
  assert.deepEqual((await events()).rangeCommits, controlledRangeCounts.rangeCommits);

  const rangeDefaultForm = page.getByTestId('range-default-form');
  const defaultLower = rangeDefaultForm.getByRole('slider', { name: 'Default budget minimum' });
  const defaultUpper = rangeDefaultForm.getByRole('slider', { name: 'Default budget maximum' });
  await defaultLower.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await defaultLower.elementHandle(), 21);
  const defaultRangeCounts = await events();
  await rangeDefaultForm.getByRole('button', { name: 'Reset default range' }).click();
  await waitValue(await defaultLower.elementHandle(), 20);
  assert.equal(await value(defaultUpper), 80);
  assert.deepEqual(await rangeDefaultForm.evaluate(node => new FormData(node).getAll('defaultBudget[]')), ['20', '80']);
  assert.deepEqual((await events()).rangeDefaultChanges, defaultRangeCounts.rangeDefaultChanges);
  assert.deepEqual((await events()).rangeDefaultCommits, defaultRangeCounts.rangeDefaultCommits);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Reset default range');

  const rangeCanceledForm = page.getByTestId('range-canceled-form');
  const canceledLower = rangeCanceledForm.getByRole('slider', { name: 'Canceled budget minimum' });
  await canceledLower.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await canceledLower.elementHandle(), 21);
  const canceledRangeCounts = await events();
  await rangeCanceledForm.getByRole('button', { name: 'Cancel range reset' }).click();
  await page.waitForTimeout(20);
  assert.equal(await value(canceledLower), 21);
  assert.deepEqual(await rangeCanceledForm.evaluate(node => new FormData(node).getAll('canceledBudget[]')), ['21', '80']);
  assert.deepEqual((await events()).rangeCanceledChanges, canceledRangeCounts.rangeCanceledChanges);
  assert.deepEqual((await events()).rangeCanceledCommits, canceledRangeCounts.rangeCanceledCommits);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Cancel range reset');

  const crossing = page.getByTestId('crossing-case').getByRole('slider').first();
  await crossing.focus();
  const crossingThumbs = page.getByTestId('crossing-case').getByRole('slider');
  for (let next = 30; next <= 100; next += 10) {
    await page.keyboard.press('Shift+ArrowRight');
    await waitValue(await crossingThumbs.nth(0).elementHandle(), Math.min(next, 80));
    await waitValue(await crossingThumbs.nth(1).elementHandle(), Math.max(next, 80));
  }
  assert.equal(await crossingThumbs.count(), 2);
  await waitValue(await crossingThumbs.nth(0).elementHandle(), 80);
  await waitValue(await crossingThumbs.nth(1).elementHandle(), 100);

  const rtl = page.getByTestId('rtl-case').getByRole('slider', { name: 'RTL slider' });
  await rtl.focus();
  await page.keyboard.press('ArrowRight');
  await waitValue(await rtl.elementHandle(), 24);
  assert.equal(await value(rtl), 24);

  const vertical = page.getByTestId('vertical-case').getByRole('slider', { name: 'Vertical inverted slider' });
  await vertical.focus();
  await page.keyboard.press('ArrowUp');
  await waitValue(await vertical.elementHandle(), 24);
  assert.equal(await value(vertical), 24);
  assert.equal(await vertical.getAttribute('aria-orientation'), 'vertical');

  const disabledFormValue = await formValues(page.getByTestId('disabled-case'));
  assert.deepEqual(disabledFormValue, {});
  assert.equal(await page.getByTestId('disabled-case').getByRole('slider', { name: 'Disabled slider' }).getAttribute('tabindex'), null);

  assert.equal(await page.locator('#slider-refinement-fixture input[type="range"]').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS Slider and RangeSlider cancel-aware reset, form ownership, ARIA, fill and constraints');
} finally {
  await page.evaluate(() => {
    window.sliderRefinementFixture?.unmount();
    document.getElementById('slider-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
