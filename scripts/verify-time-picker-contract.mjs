import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1305, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async () => {
      const { React: R, ReactDOM, ReactDOMClient, TimePicker, Field } = await import('/scripts/fixtures/time-picker.mjs');
      document.querySelector('#root').style.display = 'none';
      const host = document.createElement('main');
      host.id = 'time-contract';
      host.dataset.inkraTheme = 'dark';
      Object.assign(host.style, { padding: '20px', maxWidth: '600px', background: 'var(--inkra-paper)', color: 'var(--inkra-ink)' });
      document.body.prepend(host);
      const root = ReactDOMClient.createRoot(host);
      const h = R.createElement;
      window.timeChanges = [];
      window.mountTime = (props = {}) => ReactDOM.flushSync(() => root.render(
        h('form', { id: 'time-form', onSubmit: event => event.preventDefault() },
          h(Field, { label: 'Meeting time' }, h(TimePicker, {
            key: JSON.stringify(props), name: 'time', defaultValue: '09:30', locale: 'en-US',
            ref: node => { window.timeInput = node; },
            onValueChange: (value, details) => window.timeChanges.push({ value, reason: details.reason }),
            ...props,
          })),
          h('button', { type: 'reset' }, 'Reset'),
          h('button', { type: 'submit' }, 'Submit'))));
      window.mountTime();
    });
    const trigger = page.locator('#time-contract .inkra-time-picker__trigger');
    const native = page.locator('#time-contract input[type=time]');
    const popup = page.locator('.inkra-time-picker__popover');
    const select = async (label, value) => popup.getByRole('group', { name: label, exact: true })
      .getByRole('radio', { name: value, exact: true }).check();
    const apply = () => popup.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.evaluate(() => window.mountTime({ defaultValue: '23:45', min: '22:00', max: '02:00', step: 900 }));
    await trigger.click();
    await select('Hour', '01');
    await select('Minute', '15');
    await apply();
    assert.equal(await native.inputValue(), '01:15', 'overnight native range allows the next morning');
    assert(await native.evaluate(node => node.validity.valid));
    await trigger.click();
    await select('Hour', '12');
    assert(await popup.getByRole('button', { name: 'Apply', exact: true }).isDisabled());
    await page.keyboard.press('Escape');
    assert.equal(await native.inputValue(), '01:15');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForFunction(() => window.timeInput.value === '23:45');
    assert.equal(await page.locator('#time-form').evaluate(node => new FormData(node).get('time')), '23:45');

    await page.evaluate(() => window.mountTime({ defaultValue: '09:05', step: 900 }));
    await trigger.click();
    await select('Minute', '20');
    await apply();
    assert.equal(await native.inputValue(), '09:20');
    assert(await native.evaluate(node => node.validity.valid), 'step uses the initial value as its base');
    await trigger.click();
    await select('Minute', '21');
    assert(await popup.getByRole('button', { name: 'Apply', exact: true }).isDisabled(), 'base remains 09:05 after committing');
    await page.keyboard.press('Escape');

    await page.evaluate(() => window.mountTime({ defaultValue: '09:30:00.5', step: 0.5 }));
    await trigger.click();
    await select('Minute', '31');
    await apply();
    assert.equal(await native.inputValue(), '09:31:00.5', 'fractional seconds survive changes to other columns');
    assert(await native.evaluate(node => node.validity.valid));

    await page.evaluate(() => window.mountTime({ defaultValue: '00:00', hourCycle: 'h12' }));
    assert.match(await trigger.textContent(), /12:00.*AM/);
    await trigger.click();
    await select('Period', 'PM');
    await apply();
    assert.equal(await native.inputValue(), '12:00');
    assert.match(await trigger.textContent(), /12:00.*PM/);
    await trigger.click();
    await page.screenshot({ path: `/tmp/inkra-time-dark-${width}.png`, animations: 'disabled' });
    const color = await popup.evaluate(node => getComputedStyle(node).getPropertyValue('--inkra-paper'));
    assert(color.trim().length > 0, 'portal inherits theme');
    const surface = await popup.evaluate(node => {
      const style = getComputedStyle(node);
      return { color: style.backgroundColor, opacity: style.opacity };
    });
    assert.match(surface.color, /^rgb\(/, 'popup has an opaque background');
    assert.equal(surface.opacity, '1', 'screenshot captures the settled popup');
    await page.keyboard.press('Escape');

    await page.evaluate(() => window.mountTime({ defaultValue: undefined, required: true }));
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    assert(await trigger.evaluate(node => node === document.activeElement), 'invalid proxy redirects focus');
    assert.equal(await trigger.getAttribute('aria-invalid'), 'true');
    assert.equal(await native.inputValue(), '');
    await page.evaluate(() => window.timeInput.focus());
    assert(await trigger.evaluate(node => node === document.activeElement), 'forwarded ref focus is usable');
    await page.evaluate(() => window.mountTime({ value: '09:30', defaultValue: undefined }));
    await trigger.click();
    await select('Hour', '10');
    await apply();
    assert.equal(await native.inputValue(), '09:30', 'controlled parent owns acceptance');
    assert.deepEqual(await page.evaluate(() => window.timeChanges.at(-1)), { value: '10:30', reason: 'input' });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(50);
    assert.equal(await native.inputValue(), '09:30', 'controlled reset retains parent value');

    await page.emulateMedia({ forcedColors: 'active' });
    await trigger.click();
    assert(await popup.isVisible());
    assert.notEqual(await trigger.locator('.inkra-pencil-text__source').first().evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS time native constraints, step base, form reset, midnight/noon, controlled state, dark and forced colors: ${width}px`);
  }
} finally { await browser.close(); }
