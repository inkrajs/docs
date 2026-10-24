import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/color-picker#preview');
  await page.locator('.inkra-color-picker__gradient-preview').waitFor();
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    container.id = 'gradient-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/color-gradients.tsx');
    window.gradients = mount(container);
  });
  const configure = async props => {
    await page.evaluate(props => window.gradients.configure(props), props);
    await page.waitForTimeout(150);
  };
  const submitted = () => page.locator('#gradient-form').evaluate(form => new FormData(form).get('paint'));
  const count = () => page.locator('#gradient-fixture .inkra-color-picker__stops button').count();
  await page.getByRole('button', { name: 'Add stop', exact: true }).waitFor();
  assert.match(await submitted(), /^linear-gradient/);
  await page.getByRole('button', { name: 'Add stop', exact: true }).click();
  assert.equal(await count(), 3);
  assert(await page.getByRole('button', { name: 'Add stop', exact: true }).isDisabled());
  const position = page.getByRole('spinbutton', { name: 'Stop position', exact: true });
  await position.fill('25');
  await position.press('Tab');
  assert.match(await submitted(), /25%/);
  const hex = page.getByRole('textbox', { name: 'Color value', exact: true });
  await hex.fill('#1234');
  await hex.press('Enter');
  assert.match(await submitted(), /#11223344 25%/);
  await page.getByRole('button', { name: 'Reverse gradient', exact: true }).click();
  assert.match(await submitted(), /#11223344 75%/);
  await page.getByRole('button', { name: 'Remove stop', exact: true }).click();
  assert.equal(await count(), 2);
  assert(await page.getByRole('button', { name: 'Remove stop', exact: true }).isDisabled());
  for (const type of ['Radial', 'Conic', 'Linear']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    assert((await submitted()).startsWith(type.toLowerCase() + '-gradient'));
    assert(await page.locator('#gradient-fixture .inkra-color-picker__gradient-preview .inkra-color-picker__current').evaluate(node => getComputedStyle(node).backgroundImage !== 'none'));
  }
  await page.getByRole('switch', { name: 'Repeat gradient' }).click();
  assert.match(await submitted(), /^repeating-linear-gradient/);
  await page.getByRole('button', { name: 'Solid', exact: true }).click();
  assert.match(await submitted(), /^#[a-f0-9]{8}$/);
  await page.getByRole('button', { name: 'Linear', exact: true }).click();
  assert.match(await submitted(), /^repeating-linear-gradient/);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.waitForTimeout(50);
  assert.match(await submitted(), /^linear-gradient\(90deg, #4b96aaff 0%, #e6c17b99 100%\)$/);
  await page.getByRole('button', { name: 'Radial preset', exact: true }).click();
  assert.match(await submitted(), /^radial-gradient/);
  await page.locator('#gradient-form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.waitForTimeout(50);
  assert.match(await submitted(), /^radial-gradient/);
  await configure({ controlled: true, accept: false });
  for (let index = 0; index < 2; index++) await page.getByRole('button', { name: 'Radial', exact: true }).click();
  assert.match(await submitted(), /^linear-gradient/);
  assert.equal(await page.evaluate(() => window.gradients.changes.length), 2);
  await configure({ disabled: true });
  assert(await page.getByRole('button', { name: 'Add stop', exact: true }).isDisabled());
  assert.equal(await submitted(), null);
  await configure({ presentation: 'popover', controlled: true });
  const trigger = page.locator('#gradient-fixture .inkra-color-picker__trigger');
  await trigger.click();
  await page.getByRole('button', { name: 'Conic', exact: true }).click();
  assert.match(await submitted(), /^conic-gradient/);
  await page.keyboard.press('Escape');
  assert(await trigger.evaluate(node => node === document.activeElement));
  await configure({});
  await page.getByRole('button', { name: 'Radial', exact: true }).click();
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  const center = page.getByRole('spinbutton', { name: 'Center X', exact: true });
  await center.fill('25');
  await center.press('Tab');
  assert.match(await submitted(), /circle farthest-corner at 25% 50%/);
  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.waitForTimeout(200);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'gradient does not overflow');
    await page.screenshot({ path: `/tmp/inkra-gradients-${width}.png` });
  }
  await page.evaluate(() => document.documentElement.dir = 'rtl');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: '/tmp/inkra-gradients-rtl.png' });
  await page.goto('http://127.0.0.1:4180/docs/components/color-swatch#preview');
  assert.equal(await page.locator('.component-playground output').count(), 0, 'no demo-only status in swatch preview');
  assert.deepEqual(errors, []);
  console.log('PASS gradient types, geometry, stops, presets, controls, form reset, disabled, popover, narrow layouts and clean swatch preview');
} finally {
  await browser.close();
}
