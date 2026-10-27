import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1000, height: 1000 }, hasTouch: true, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const root = id => page.getByTestId(id);
const input = id => root(id).getByRole('switch');
const events = () => page.evaluate(() => window.circularSwitchFixture.events);
const formData = id => root(id).evaluate(form => Object.fromEntries(new FormData(form)));
async function checked(id, expected) {
  await page.waitForFunction(({ id, expected }) => document.querySelector(`[data-testid="${id}"] input[role="switch"]`)?.checked === expected, { id, expected });
}
async function clickCenter(id) {
  const ring = root(id).locator('.inkra-switch__circular');
  await ring.scrollIntoViewIfNeeded();
  const box = await ring.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
function once(state, before, id, value) {
  assert.deepEqual(state.changes[id] ?? [], [...(before.changes[id] ?? []), value], id + ' emits one native change');
  assert.deepEqual(state.checked[id] ?? [], [...(before.checked[id] ?? []), value], id + ' emits one checked callback');
}
try {
  await page.goto(base + '/docs/design-standard');
  await page.locator('.header-customize').waitFor();
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('section');
    container.id = 'circular-switch-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/CircularSwitchFixture.tsx');
    window.circularSwitchFixture = mount(container);
  });
  await input('normal').waitFor({ state: 'attached' });
  assert.deepEqual(await input('normal').evaluate(node => ({ tag: node.tagName, type: node.type })), { tag: 'INPUT', type: 'checkbox' });
  assert(await page.evaluate(() => window.circularSwitchFixture.refs.normal === document.querySelector('[data-testid="normal"] input')), 'forwarded ref points to native input');
  await checked('normal', false);
  let before = await events();
  await clickCenter('normal');
  await checked('normal', true);
  once(await events(), before, 'normal', true);
  assert.deepEqual(await formData('normal-form'), { effect: 'enabled' });
  await input('normal').focus();
  before = await events();
  await page.keyboard.press('Space');
  await checked('normal', false);
  once(await events(), before, 'normal', false);
  assert.deepEqual(await formData('normal-form'), {});

  before = await events();
  await clickCenter('normal');
  await checked('normal', true);
  once(await events(), before, 'normal', true);
  before = await events();
  await root('normal-form').getByRole('button').click();
  await checked('normal', false);
  assert.deepEqual(await events(), before, 'native form reset does not emit change callbacks');
  assert.deepEqual(await formData('normal-form'), {});

  before = await events();
  await clickCenter('frozen');
  await checked('frozen', false);
  once(await events(), before, 'frozen', true);
  assert.equal(await root('frozen').locator('.inkra-switch').getAttribute('data-checked'), null, 'controlled rejection restores visual state');
  await clickCenter('controlled');
  await checked('controlled', true);
  before = await events();
  await root('controlled-form').getByRole('button').click();
  await checked('controlled', true);
  assert.deepEqual(await events(), before, 'native reset preserves controlled state');

  await clickCenter('canceled');
  await checked('canceled', false);
  before = await events();
  await root('canceled-form').getByRole('button').click();
  await checked('canceled', false);
  assert.deepEqual(await events(), before, 'preventDefault prevents reset');
  assert.equal(await root('required-form').evaluate(form => form.checkValidity()), false);
  await clickCenter('required');
  assert.equal(await root('required-form').evaluate(form => form.checkValidity()), true);
  await clickCenter('external');
  assert.deepEqual(await formData('external-form'), { external: 'on' });
  await root('external-form').getByRole('button').click();
  await checked('external', false);
  assert.deepEqual(await formData('external-form'), {});

  before = await events();
  for (const id of ['disabled', 'readonly']) {
    await clickCenter(id);
    await input(id).focus();
    if (await input(id).evaluate(node => node === document.activeElement)) await page.keyboard.press('Space');
    await checked(id, true);
  }
  assert.deepEqual(await events(), before, 'disabled and readonly reject click and keyboard');
  assert.deepEqual(await formData('disabled-form'), {});
  assert.deepEqual(await formData('readonly-form'), { readonly: 'on' });
  assert(await input('disabled').isDisabled());
  await root('inert-center-button').evaluate(node => node.focus());
  assert.equal(await root('inert-center-button').evaluate(node => node === document.activeElement), false, 'center decorations cannot receive focus');
  assert.equal(await root('normal').locator('.inkra-switch__circular-icon .inkra-pencil-icon').count(), 1);
  assert.equal(await root('normal').locator('.inkra-switch__circular-content').textContent(), 'Off');
  await clickCenter('normal');
  assert.equal(await root('normal').locator('.inkra-switch__circular-content').textContent(), 'On');
  before = await events();
  await root('plain').locator('label').click();
  await checked('plain', true);
  once(await events(), before, 'plain', true);
  await input('plain').focus();
  await page.keyboard.press('Space');
  await checked('plain', false);

  const cdp = await context.newCDPSession(page);
  await root('touch').scrollIntoViewIfNeeded();
  const touchBox = await root('touch').locator('.inkra-switch__circular').boundingBox();
  const touchPoint = { x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2, id: 1, radiusX: 4, radiusY: 4, force: 1 };
  before = await events();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await checked('touch', false);
  assert.deepEqual(await events(), before, 'canceled touch does not activate the switch');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await checked('touch', true);
  once(await events(), before, 'touch', true);

  for (const width of [1000, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await root('normal').scrollIntoViewIfNeeded();
    const switchBox = await root('normal').locator('.inkra-switch__circular').boundingBox();
    const sliderBox = await root('reference').getByRole('slider').boundingBox();
    assert.equal(Math.round(switchBox.width), 120);
    assert.equal(Math.round(switchBox.height), 120);
    assert.equal(Math.round(sliderBox.width), 120);
    assert.equal(Math.round(sliderBox.height), 120);
    assert.equal(await page.locator('.inkra-switch__circular-thumb, .inkra-switch__circular-thumb-surface').count(), 0, 'binary switches have no draggable thumb');
    assert.equal(await root('normal').locator('.inkra-switch__circular-track circle').getAttribute('stroke-dashoffset'), '25', 'persistent muted track covers 270 degrees');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fixture has no horizontal overflow at ' + width);
    await page.waitForFunction(() => {
      const canvases = [...document.querySelectorAll('[data-testid="normal"] .inkra-progress__ring-ink, [data-testid="normal"] .inkra-switch__circular-icon canvas')];
      return canvases.length === 3 && canvases.every(canvas => canvas.width > 0 && canvas.height > 0 && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0));
    });
    assert(await root('normal').locator('.inkra-switch__circular-range .inkra-progress__ring-ink').evaluate(canvas => getComputedStyle(canvas).clipPath.startsWith('polygon(')), 'on state draws an incomplete 270 degree arc');
    assert.equal(await root('normal').locator('.inkra-switch__circular-range circle').getAttribute('stroke-dashoffset'), '25', 'fallback arc covers exactly 75 percent of the ring');
    await root('normal').screenshot({ path: '/tmp/inkra-circular-switch-on-' + width + '.png' });
    await clickCenter('normal');
    await checked('normal', false);
    assert.equal(await root('normal').locator('.inkra-switch__circular-track circle').getAttribute('stroke-dashoffset'), '25', 'off retains the muted track');
    assert.equal(await root('normal').locator('.inkra-switch__circular-range circle').getAttribute('stroke-dashoffset'), '100', 'off has no emphasized progress');
    assert.equal(await root('normal').locator('.inkra-switch__circular-range canvas').evaluate(canvas => getComputedStyle(canvas).clipPath), 'inset(50%)', 'off emphasis is fully clipped');
    assert.equal(await root('normal').locator('.inkra-switch__circular-content').textContent(), 'Off');
    assert.equal(await root('normal').locator('.inkra-switch__circular-focus').evaluate(node => getComputedStyle(node).opacity), '0', 'off state has no idle outline');
    await root('normal').screenshot({ path: '/tmp/inkra-circular-switch-off-' + width + '.png' });
    await clickCenter('normal');
    await checked('normal', true);
  }
  // Observe real animation frames; only rendering animates, not native checked state.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await root('normal-form').getByRole('button').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="normal"] .inkra-switch__circular-range circle')?.getAttribute('stroke-dashoffset') === '100');
  const animation = await page.evaluate(async () => {
    const normal = document.querySelector('[data-testid="normal"]');
    const toggle = normal.querySelector('input');
    const read = () => 100 - Number(normal.querySelector('.inkra-switch__circular-range circle').getAttribute('stroke-dashoffset'));
    const events = () => structuredClone(window.circularSwitchFixture.events);
    // Read committed frames, after React has processed state scheduled by RAF.
    // Clicking inside the RAF microtask otherwise flushes an unseen pending frame.
    const frame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    const sample = async duration => {
      const start = performance.now();
      const rows = [{ ms: 0, value: read() }];
      do { await frame(); rows.push({ ms: performance.now() - start, value: read() }); } while (performance.now() - start < duration);
      return rows;
    };
    const before = events();
    toggle.click();
    const opening = await sample(350);
    const afterOpening = events();
    toggle.click();
    const closing = await sample(80);
    const reversal = { before: read(), immediate: 0 };
    toggle.click();
    await Promise.resolve();
    reversal.immediate = read();
    const reopening = await sample(350);
    const afterReversal = events();
    toggle.click();
    const finalClosing = await sample(350);
    return { before, opening, afterOpening, closing, reversal, reopening, afterReversal, finalClosing, afterClosing: events() };
  });
  assert(animation.opening.some(row => row.value > 0 && row.value < 75), 'opening has intermediate arc frames');
  assert.equal(animation.opening.at(-1).value, 75);
  once(animation.afterOpening, animation.before, 'normal', true);
  assert(animation.closing.some(row => row.value > 0 && row.value < 75), 'closing has intermediate arc frames');
  assert(animation.reversal.before > 0 && animation.reversal.before < 75, 'reverse before the close animation settles');
  assert(Math.abs(animation.reversal.immediate - animation.reversal.before) < .01, 'reversal starts at the currently displayed arc');
  assert.equal(animation.reopening.at(-1).value, 75);
  assert.deepEqual(animation.afterReversal.changes.normal, [...animation.afterOpening.changes.normal, false, true]);
  assert.deepEqual(animation.afterReversal.checked.normal, [...animation.afterOpening.checked.normal, false, true]);
  assert(animation.reopening.some(row => row.value > animation.reversal.before && row.value < 75), 'reversal expands continuously to the target');
  assert(animation.reopening.every(row => row.value >= animation.reversal.before - .01), 'reversal never restarts from the off endpoint');
  for (const [rows, direction] of [[animation.opening, 1], [animation.closing, -1], [animation.reopening, 1], [animation.finalClosing, -1]]) {
    assert(rows.every((row, index) => index === 0 || direction * (row.value - rows[index - 1].value) >= -.01), 'each transition advances consistently toward its target');
  }
  assert.equal(animation.finalClosing.at(-1).value, 0);
  once(animation.afterClosing, animation.afterReversal, 'normal', false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await page.evaluate(async () => {
    const normal = document.querySelector('[data-testid="normal"]');
    const toggle = normal.querySelector('input');
    const read = () => 100 - Number(normal.querySelector('.inkra-switch__circular-range circle').getAttribute('stroke-dashoffset'));
    const results = [];
    for (const target of [75, 0]) {
      toggle.click();
      for (let index = 0; index < 3; index += 1) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        results.push({ target, value: read() });
      }
    }
    return results;
  });
  assert(reduced.every(row => row.value === row.target), 'reduced motion goes straight to the target from the first frame');
  console.log(JSON.stringify({ animation, reduced }));
  assert.deepEqual(errors, []);
  console.log('Circular Switch: native input/ref/form/required/reset, click/Space/touch tap, controlled rejection, disabled/readonly, center content, muted track / animated emphasis without thumb, intermediate frames / continuous reversal / reduced motion, 120px sizing and 320px layout passed.');
} finally {
  await page.evaluate(() => {
    window.circularSwitchFixture?.unmount();
    document.getElementById('circular-switch-fixture')?.remove();
    const app = document.getElementById('root');
    if (app) app.hidden = false;
  }).catch(() => {});
  await browser.close();
}
