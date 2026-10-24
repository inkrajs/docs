import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const events = () => page.evaluate(() => window.ratingRefinementFixture.events);
const value = rating => rating.getAttribute('aria-valuenow').then(Number);
const formValues = form => form.evaluate(node => Object.fromEntries(new FormData(node)));
const symbols = rating => rating.locator('.inkra-rating__symbols');
const waitForValue = (rating, expected) => page.waitForFunction(
  ({ node, expected }) => Number(node.getAttribute('aria-valuenow')) === expected,
  { node: rating, expected },
);

async function assertPencilFocus(rating) {
  await rating.hover();
  await page.keyboard.press('Tab');
  await rating.focus();
  const ring = rating.locator('.inkra-rating__focus-ring');
  assert.equal(await ring.count(), 1);
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await ring.elementHandle());
  await ring.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let index = 0; index < 100; index += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, pixelIndex) => pixelIndex % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Rating pencil focus ring has no visible pixels');
  });
}

async function clickSymbol(rating, index, fraction = 0.75) {
  const target = rating.locator('.inkra-rating__symbol-target').nth(index - 1);
  const box = await target.boundingBox();
  assert(box);
  await page.mouse.click(box.x + Math.min(box.width - 0.5, box.width * fraction), box.y + box.height / 2);
}

try {
  await page.goto(`${base}/docs/components/rating#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'rating-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/RatingRefinementFixture.tsx');
    window.ratingRefinementFixture = mount(container);
  });
  await page.getByTestId('reset-form').waitFor();

  const resetForm = page.getByTestId('reset-form');
  const resetRating = resetForm.getByRole('slider', { name: 'Reset rating', exact: true });
  await clickSymbol(resetRating, 4, 0.5);
  await waitForValue(await resetRating.elementHandle(), 3.5);
  assert(await resetRating.evaluate(node => node === document.activeElement), 'pointer selection focuses the slider');
  await resetRating.press('ArrowRight');
  await waitForValue(await resetRating.elementHandle(), 4);
  assert.deepEqual((await events()).values, [3.5, 4], 'keyboard continues from the pointer-committed value');
  assert.deepEqual(await formValues(resetForm), { resetRating: '4' });
  const resetButton = resetForm.getByRole('button', { name: 'Reset rating value', exact: true });
  await resetButton.click();
  await waitForValue(await resetRating.elementHandle(), 2.5);
  assert.deepEqual(await formValues(resetForm), { resetRating: '2.5' });
  assert.deepEqual((await events()).values, [3.5, 4], 'native reset emits no value callback');
  assert(await resetButton.evaluate(node => node === document.activeElement), 'native reset does not steal focus');

  const canceledForm = page.getByTestId('canceled-reset-form');
  const canceledRating = canceledForm.getByRole('slider', { name: 'Canceled rating', exact: true });
  await canceledRating.press('End');
  await waitForValue(await canceledRating.elementHandle(), 5);
  const canceledResetButton = canceledForm.getByRole('button', { name: 'Cancel rating reset', exact: true });
  await canceledResetButton.click();
  await page.waitForTimeout(0);
  assert.equal(await value(canceledRating), 5, 'preventDefault preserves current rating');
  assert.deepEqual((await events()).canceledValues, [5]);
  assert(await canceledResetButton.evaluate(node => node === document.activeElement), 'canceled reset keeps button focus');

  const externalForm = page.getByTestId('external-form');
  const externalRating = page.getByTestId('external-case').getByRole('slider', { name: 'External rating', exact: true });
  await externalRating.press('Home');
  await waitForValue(await externalRating.elementHandle(), 0);
  assert.deepEqual(await formValues(externalForm), { externalRating: '0' });
  const externalResetButton = externalForm.getByRole('button', { name: 'Reset external rating', exact: true });
  await externalResetButton.click();
  await waitForValue(await externalRating.elementHandle(), 3);
  assert.deepEqual(await formValues(externalForm), { externalRating: '3' });
  assert.deepEqual((await events()).externalValues, [0]);
  assert(await externalResetButton.evaluate(node => node === document.activeElement), 'external reset keeps button focus');

  const accepted = page.getByTestId('controlled-form').getByRole('slider', { name: 'Accepted controlled rating', exact: true });
  await accepted.press('End');
  await waitForValue(await accepted.elementHandle(), 8);
  assert((await symbols(accepted).evaluate(node => node.scrollLeft)) !== 0, 'accepted controlled value scrolls internal symbols');
  const controlledResetButton = page.getByTestId('controlled-form').getByRole('button', { name: 'Reset accepted controlled rating', exact: true });
  await controlledResetButton.click();
  await page.waitForTimeout(0);
  assert.equal(await value(accepted), 8, 'controlled reset retains caller value');
  assert.deepEqual((await events()).controlledAccepted, [8]);
  assert(await controlledResetButton.evaluate(node => node === document.activeElement), 'controlled reset keeps button focus');

  const rejected = page.getByTestId('rejected-controlled-case').getByRole('slider', { name: 'Rejected controlled rating', exact: true });
  await rejected.focus();
  const rejectedScroll = await symbols(rejected).evaluate(node => node.scrollLeft);
  const rejectedPageScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await rejected.press('End');
  await page.waitForTimeout(120);
  assert.equal(await value(rejected), 1, 'rejected controlled proposal remains uncommitted');
  assert.equal(await symbols(rejected).evaluate(node => node.scrollLeft), rejectedScroll, 'rejected proposal does not scroll');
  assert.deepEqual(await page.evaluate(() => ({ x: scrollX, y: scrollY })), rejectedPageScroll, 'rating reveal never scrolls the page');
  assert.deepEqual((await events()).controlledRejected, [8]);

  const narrow = page.getByTestId('narrow-case').getByRole('slider', { name: 'Narrow rating', exact: true });
  await narrow.focus();
  const narrowRootBox = await narrow.boundingBox();
  assert(narrowRootBox && narrowRootBox.width <= 133);
  assert.equal(await symbols(narrow).evaluate(node => node.scrollLeft), 0);
  const narrowPageScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await narrow.press('End');
  await waitForValue(await narrow.elementHandle(), 8);
  const narrowScroll = await symbols(narrow).evaluate(node => node.scrollLeft);
  assert(narrowScroll > 0, 'keyboard endpoint remains visible by scrolling only the symbol strip');
  assert.deepEqual(await page.evaluate(() => ({ x: scrollX, y: scrollY })), narrowPageScroll);
  const ringBox = await narrow.locator('.inkra-rating__focus-ring').boundingBox();
  const currentRootBox = await narrow.boundingBox();
  assert(ringBox && currentRootBox && Math.abs(ringBox.width - (currentRootBox.width - 2)) <= 1,
    'focus ring remains anchored to the visible rating viewport');

  const endpoint = page.getByTestId('endpoint-case').getByRole('slider', { name: 'Endpoint rating', exact: true });
  await endpoint.press('End');
  await waitForValue(await endpoint.elementHandle(), 5);
  assert.equal(await endpoint.getAttribute('aria-valuemax'), '5');
  await endpoint.press('ArrowDown');
  await waitForValue(await endpoint.elementHandle(), 4.5);
  await endpoint.press('ArrowDown');
  await waitForValue(await endpoint.elementHandle(), 3);
  await endpoint.press('ArrowUp');
  await waitForValue(await endpoint.elementHandle(), 4.5);
  await endpoint.press('ArrowUp');
  await waitForValue(await endpoint.elementHandle(), 5);
  await endpoint.press('ArrowLeft');
  await waitForValue(await endpoint.elementHandle(), 4.5);
  await endpoint.press('ArrowRight');
  await waitForValue(await endpoint.elementHandle(), 5);
  await clickSymbol(endpoint, 5, 1);
  await waitForValue(await endpoint.elementHandle(), 5);

  const integerEndpoint = page.getByTestId('integer-endpoint-case').getByRole('slider', { name: 'Integer endpoint rating', exact: true });
  await integerEndpoint.press('End');
  await waitForValue(await integerEndpoint.elementHandle(), 5);
  await integerEndpoint.press('ArrowDown');
  await waitForValue(await integerEndpoint.elementHandle(), 4);
  await integerEndpoint.press('End');
  await integerEndpoint.press('ArrowLeft');
  await waitForValue(await integerEndpoint.elementHandle(), 4);

  const rtlEndpoint = page.getByTestId('rtl-endpoint-case').getByRole('slider', { name: 'RTL endpoint rating', exact: true });
  await rtlEndpoint.press('End');
  await waitForValue(await rtlEndpoint.elementHandle(), 5);
  await rtlEndpoint.press('ArrowRight');
  await waitForValue(await rtlEndpoint.elementHandle(), 4.5);
  await rtlEndpoint.press('ArrowLeft');
  await waitForValue(await rtlEndpoint.elementHandle(), 5);

  const rtl = page.getByTestId('rtl-case').getByRole('slider', { name: 'RTL rating', exact: true });
  await rtl.press('End');
  await waitForValue(await rtl.elementHandle(), 8);
  assert((await symbols(rtl).evaluate(node => node.scrollLeft)) < 0, 'RTL reveal uses the internal negative scroll direction');
  await rtl.press('ArrowRight');
  await waitForValue(await rtl.elementHandle(), 7);

  const readonly = page.getByTestId('readonly-case').getByRole('slider', { name: 'Readonly rating', exact: true });
  await readonly.focus();
  await readonly.press('End');
  assert.equal(await value(readonly), 2);
  assert.equal(await readonly.getAttribute('aria-readonly'), 'true');
  const disabled = page.getByTestId('disabled-case').getByRole('slider', { name: 'Disabled rating', exact: true });
  assert.equal(await disabled.getAttribute('tabindex'), null);
  await disabled.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'End' })));
  assert.equal(await value(disabled), 2);

  const fifth = resetRating.locator('.inkra-rating__symbol-target').nth(4);
  await fifth.hover({ position: { x: 40, y: 20 } });
  assert.equal(await value(resetRating), 2.5, 'hover preview does not change committed value');
  assert.deepEqual(await formValues(resetForm), { resetRating: '2.5' });
  assert.equal(await resetRating.getAttribute('data-previewing'), 'true');
  await page.mouse.move(1, 1);
  assert.equal(await resetRating.getAttribute('data-previewing'), null);

  await assertPencilFocus(narrow);
  for (const target of await page.locator('#rating-refinement-fixture .inkra-rating__symbol-target').all()) {
    const box = await target.boundingBox();
    assert(box && box.width >= 44 && box.height >= 44, 'rating symbol keeps a 44px target');
  }

  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fixture overflow`);
    await page.getByTestId('narrow-case').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-rating-refinement-${width}.png`, animations: 'disabled' });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await assertPencilFocus(narrow);
  assert(await narrow.locator('.inkra-rating__focus-ring').evaluate(node =>
    getComputedStyle(node).transitionDuration.split(',').every(duration => parseFloat(duration) <= 0.00001)),
  'reduced motion permits only the docs shell 0.01ms completion tick, not a visible focus transition');
  await page.emulateMedia({ forcedColors: 'active' });
  await narrow.focus();
  await narrow.press('Home');
  assert.equal(await narrow.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  assert.equal(await narrow.locator('.inkra-rating__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS Rating pencil focus, pointer-keyboard continuity, internal reveal, endpoints, forms and states');
} finally {
  await page.evaluate(() => {
    window.ratingRefinementFixture?.unmount();
    document.getElementById('rating-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
