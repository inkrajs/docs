import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
async function hasValue(locator, expected) {
  await locator.page().waitForFunction(({ node, expected }) => node.value === expected, { node: await locator.elementHandle(), expected });
  assert.equal(await locator.inputValue(), expected);
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/components/input-number#preview`);
    const fixturePath = new URL('./fixtures/input-number.tsx', import.meta.url).pathname;
    await page.evaluate(async path => (await import(`/@fs${path}`)).mountInputNumberFixture(), fixturePath);
    const scope = page.locator('#input-number-fixture');
    const number = name => scope.getByRole('spinbutton', { name, exact: true });
    const button = name => scope.getByRole('button', { name, exact: true });
    const controlled = number('Controlled');
    await controlled.waitFor();
    assert.equal(await controlled.evaluate(node => node.closest('.inkra-input-root').dataset.variant), 'underline');
    assert.equal(await scope.locator('.inkra-input__clear').count(), 0, 'no clear buttons');
    assert.equal(await controlled.evaluate(node => getComputedStyle(node).textAlign), 'center');
    const decrementBox = await button('Decrement controlled').boundingBox();
    const inputBox = await controlled.boundingBox();
    const incrementBox = await button('Increment controlled').boundingBox();
    assert(decrementBox.x + decrementBox.width <= inputBox.x, 'decrease sits before input');
    assert(inputBox.x + inputBox.width <= incrementBox.x, 'increase sits after input');
    assert(Math.abs(inputBox.x + inputBox.width / 2 - (decrementBox.x + incrementBox.x + incrementBox.width) / 2) < 1, 'number is centered between actions');
    await button('Increment controlled').click();
    await hasValue(controlled, '2.25');
    await controlled.press('ArrowUp');
    await hasValue(controlled, '2.5');
    await controlled.press('ArrowDown');
    await hasValue(controlled, '2.25');
    await controlled.fill('');
    await hasValue(controlled, '');
    assert(await controlled.evaluate(node => node === document.activeElement));
    assert.equal(await scope.getByTestId('controlled-value').textContent(), 'null');
    await controlled.pressSequentially('-');
    assert(await controlled.evaluate(node => node.validity.badInput), 'incomplete negative remains a native draft');
    await controlled.pressSequentially('2');
    await hasValue(controlled, '-2');
    await controlled.fill('1');
    await controlled.pressSequentially('.5');
    await hasValue(controlled, '1.5');
    await controlled.fill('20');
    await hasValue(controlled, '20');
    assert(await controlled.evaluate(node => node.validity.rangeOverflow), 'typed out-of-range values retain native validation');
    await button('Focus controlled').click();
    assert(await controlled.evaluate(node => node === document.activeElement), 'native forwarded ref');
    await button('Set controlled externally').click();
    await hasValue(controlled, '5');
    await button('Empty controlled externally').click();
    await hasValue(controlled, '');
    await controlled.fill('7');
    await button('Reset controlled').click();
    await hasValue(controlled, '2');

    await button('Increment held').click();
    await hasValue(number('Held controlled'), '4');
    await number('Held controlled').fill('');
    await hasValue(number('Held controlled'), '4');
    await number('Held controlled').fill('8');
    await hasValue(number('Held controlled'), '4');
    const events = JSON.parse(await scope.getByTestId('events').textContent());
    assert(events.includes('increment:2.25'));
    assert(events.includes('input:null'));
    assert(events.includes('held:increment:5'));
    assert(events.includes('held:input:null'));

    assert(await button('Decrement tenths').isDisabled());
    for (let index = 1; index <= 10; index++) {
      await button('Increment tenths').click();
      await hasValue(number('Tenths'), String(index / 10));
    }
    assert(await button('Increment tenths').isDisabled());
    await button('Decrement tenths').click();
    await hasValue(number('Tenths'), '0.9');
    await button('Increment base').click();
    await hasValue(number('Decimal base'), '0.15');
    await button('Decrement base').click();
    await hasValue(number('Decimal base'), '0.05');
    assert(await button('Decrement base').isDisabled());

    const expectedEmptyStep = await page.evaluate(() => {
      const native = document.createElement('input');
      native.type = 'number'; native.min = '0'; native.max = '10'; native.step = '0.5';
      native.stepUp();
      return native.value;
    });
    await button('Increment empty').click();
    await hasValue(number('Empty'), expectedEmptyStep);
    await number('Empty').fill('');
    await hasValue(number('Empty'), '');
    assert(await button('Increment any').isDisabled());
    assert(await button('Decrement any').isDisabled());
    await number('Any').fill('1.234567');
    await hasValue(number('Any'), '1.234567');

    assert.equal(await number('Readonly').getAttribute('readonly'), '');
    assert(await button('Increment readonly').isDisabled());
    assert(await button('Decrement readonly').isDisabled());
    await number('Readonly').press('ArrowUp');
    await hasValue(number('Readonly'), '2');
    assert(await number('Disabled').isDisabled());
    assert(await button('Increment disabled').isDisabled());
    assert(await button('Decrement disabled').isDisabled());
    assert(await number('Fieldset disabled').isDisabled());
    assert(await button('Increment fieldset').isDisabled());

    await number('Uncontrolled').fill('4.5');
    await button('Reset uncontrolled').click();
    await hasValue(number('Uncontrolled'), '3');
    await number('Uncontrolled').fill('');
    await hasValue(number('Uncontrolled'), '');
    assert.equal(await number('Uncontrolled').evaluate(node => new FormData(node.form).get('quantity')), '');
    await button('Reset uncontrolled').click();
    await hasValue(number('Uncontrolled'), '3');
    assert.equal(await number('Uncontrolled').evaluate(node => new FormData(node.form).get('quantity')), '3');
    await number('Canceled').fill('8');
    await button('Canceled reset').click();
    await page.waitForTimeout(50);
    await hasValue(number('Canceled'), '8');
    await number('External').fill('9');
    await button('Reset external').click();
    await hasValue(number('External'), '6');
    const allSlots = number('All slots');
    assert((await allSlots.boundingBox()).width >= 40, 'affixes and controls leave a usable input');
    assert.equal(await number('RTL').evaluate(node => getComputedStyle(node).direction), 'rtl');
    assert.equal(await number('RTL').evaluate(node => getComputedStyle(node).textAlign), 'end');
    assert((await button('Decrement RTL').boundingBox()).x > (await number('RTL').boundingBox()).x, 'RTL reverses logical stepper positions');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'fixture has no page overflow');
    await page.screenshot({ path: `/tmp/inkra-input-number-fixture-${width}.png`, fullPage: true });
    await page.close();

    const docs = await browser.newPage({ viewport: { width, height: 954 } });
    docs.on('pageerror', error => errors.push(error.message));
    await docs.goto(`${baseUrl}/components/input-number#preview`);
    await docs.getByRole('heading', { name: 'InputNumber', exact: true }).waitFor();
    await docs.locator('.component-playground').waitFor();
    const demo = docs.locator('.component-playground .preview-stage');
    assert.equal(await docs.locator('.inkra-input-number .inkra-input__clear').count(), 0);
    assert.equal(await demo.getByRole('spinbutton').evaluate(node => getComputedStyle(node).textAlign), 'center');
    assert.equal(await docs.locator('.component-example').count(), 5);
    assert(await docs.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'docs have no page overflow');
    await docs.screenshot({ path: `/tmp/inkra-input-number-docs-${width}.png` });
    await docs.close();
    console.log(`PASS InputNumber split controls, centered value, no clear button, native stepping, keyboard deletion, Field states, reset, ref and docs at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
