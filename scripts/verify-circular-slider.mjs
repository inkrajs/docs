import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1100, height: 1000 }, hasTouch: true, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.circularSliderFixture.events);
const root = id => page.getByTestId(id);
const value = async element => Number(await element.getAttribute('aria-valuenow'));
const formData = id => root(id).evaluate(form => Object.fromEntries(new FormData(form)));
async function valueIs(element, expected) {
  await page.waitForFunction(({ element, expected }) => Number(element.getAttribute('aria-valuenow')) === expected,
    { element: await element.elementHandle(), expected });
}
async function boxFor(element) {
  await element.scrollIntoViewIfNeeded();
  return element.boundingBox();
}
function point(box, angle, radius = Math.min(box.width, box.height) * .4) {
  const radians = angle * Math.PI / 180;
  return { x: box.x + box.width / 2 + Math.sin(radians) * radius, y: box.y + box.height / 2 - Math.cos(radians) * radius };
}
async function clickAt(element, angle) {
  const position = point(await boxFor(element), angle);
  await page.mouse.click(position.x, position.y);
}
async function dragAngles(element, angles) {
  const box = await boxFor(element);
  const thumb = await element.locator('.inkra-circular-slider__thumb').boundingBox();
  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
  await page.mouse.down();
  const observed = [];
  for (const angle of angles) {
    const position = point(box, angle);
    await page.mouse.move(position.x, position.y);
    observed.push(await value(element));
  }
  await page.mouse.up();
  return observed;
}

try {
  await page.goto(base + '/docs/components/slider#preview');
  const example = page.locator('#slider-circular');
  await example.getByRole('slider').first().waitFor();
  assert(await example.locator('.inkra-circular-slider').count() >= 2, 'docs expose both full-circle and partial-arc examples');
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await example.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'circular examples fit the page at ' + width);
    await page.waitForFunction(element => [...element.querySelectorAll('.inkra-circular-slider canvas.inkra-progress__ring-ink')].every(canvas => canvas.dataset.ready === 'true'), await example.elementHandle());
    const geometry = await example.locator('.inkra-circular-slider').evaluateAll(roots => roots.map(element => {
      const center = node => { const box = node.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; };
      const root = center(element);
      const track = element.querySelector('.inkra-circular-slider__track');
      const range = element.querySelector('.inkra-circular-slider__range');
      const circle = track.querySelector('circle');
      const svg = circle.ownerSVGElement;
      const thumb = center(element.querySelector('.inkra-circular-slider__thumb'));
      return {
        root, track: center(track), range: center(range),
        radius: Number(circle.getAttribute('r')) * svg.clientWidth / svg.viewBox.baseVal.width,
        thumbRadius: Math.hypot(thumb.x - root.x, thumb.y - root.y),
        rangeColor: getComputedStyle(range).color,
        ink: [...element.querySelectorAll('canvas.inkra-progress__ring-ink')].every(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)),
      };
    }));
    for (const state of geometry) {
      assert(Math.hypot(state.root.x - state.track.x, state.root.y - state.track.y) < 1, 'track and thumb share the root center');
      assert(Math.hypot(state.root.x - state.range.x, state.root.y - state.range.y) < 1, 'selected arc is concentric with the track');
      assert(Math.abs(state.radius - state.thumbRadius) < 1, 'thumb center follows the rendered circle radius');
      assert(state.ink, 'both track and selected arc have actual pencil pigment');
    }
    console.log('CircularSlider visual geometry', width, geometry.map(state => ({ radius: state.radius, thumbRadius: state.thumbRadius, rangeColor: state.rangeColor })));
    await example.screenshot({ path: '/tmp/inkra-circular-slider-' + width + '.png' });
  }
  const centerExample = page.locator('#slider-center');
  assert.equal(await centerExample.getByRole('slider').count(), 3, 'docs demonstrate all three center modes');
  await centerExample.scrollIntoViewIfNeeded();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'center examples fit mobile');
  await centerExample.screenshot({ path: '/tmp/inkra-circular-center-examples.png' });
  if (process.argv.includes('--visual-only')) {
    assert.deepEqual(errors, []);
    console.log('CircularSlider desktop/mobile drawing, concentric track/range/thumb and layout passed.');
  } else {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('section');
    container.id = 'circular-slider-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/CircularSliderFixture.tsx');
    window.circularSliderFixture = mount(container);
  });
  await root('center-104-sm').waitFor();
  for (const diameter of [96, 104, 112, 128]) for (const size of ['sm', 'md', 'lg']) {
    const control = root(`center-${diameter}-${size}`);
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.evaluate(element => {
      const center = element.querySelector('.inkra-circular-slider__center');
      const box = center.getBoundingClientRect();
      return { clipped: center.scrollHeight > center.clientHeight + 1 || center.scrollWidth > center.clientWidth + 1,
        valueFits: [...center.querySelectorAll('.inkra-circular-slider__value')].every(node => { const style = getComputedStyle(node); const ctx = document.createElement('canvas').getContext('2d'); ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`; return ctx.measureText(node.textContent).width <= node.clientWidth + .5; }),
        inside: [...center.querySelectorAll('.inkra-circular-slider__center-icon, .inkra-circular-slider__value')].every(node => {
          const child = node.getBoundingClientRect(); return child.top >= box.top - 1 && child.bottom <= box.bottom + 1 && child.left >= box.left - 1 && child.right <= box.right + 1;
        }), inert: center.inert, hidden: center.getAttribute('aria-hidden') };
    });
    if (bounds.clipped || !bounds.inside || !bounds.valueFits) console.log('center failure', diameter, size, bounds, await control.locator('.inkra-circular-slider__center').evaluate(node => ({ box: node.getBoundingClientRect().toJSON(), clientHeight: node.clientHeight, scrollHeight: node.scrollHeight, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, children: [...node.children].map(child => ({cls: child.className, box: child.getBoundingClientRect().toJSON(), scrollHeight: child.scrollHeight})) })));
    assert(!bounds.clipped && bounds.inside && bounds.valueFits, `center icon/value fits ${diameter}px ${size}`);
    assert(bounds.inert && bounds.hidden === 'true');
    assert.equal(await control.getAttribute('aria-valuetext'), '0.44');
  }
  assert.equal(await root('center-icon').locator('.inkra-circular-slider__value').count(), 0);
  assert.equal(await root('center-icon').locator('.inkra-circular-slider__center-icon').count(), 1);
  const dynamic = root('center-function');
  await dynamic.focus(); await page.keyboard.press('ArrowRight');
  await valueIs(dynamic, 41);
  assert.equal(await dynamic.locator('.inkra-circular-slider__value').textContent(), '41%');
  assert.equal(await dynamic.getAttribute('aria-valuetext'), '41 percent');
  const dynamicBox = await boxFor(dynamic);
  await page.mouse.click(dynamicBox.x + dynamicBox.width / 2, dynamicBox.y + dynamicBox.height / 2);
  await valueIs(dynamic, 41);
  await root('inert-center-button').evaluate(node => node.focus());
  assert.equal(await root('inert-center-button').evaluate(node => node === document.activeElement), false);
  await root('center-104-sm').screenshot({ path: '/tmp/inkra-circular-center-104.png' });
  console.log('Circular center modes, live formatter, accessible value, inert content and 96–128px layout passed.');
  const normal = root('normal');
  await normal.waitFor();
  assert.equal(await normal.getAttribute('role'), 'slider');
  assert.equal(await normal.getAttribute('aria-valuemin'), '0');
  assert.equal(await normal.getAttribute('aria-valuemax'), '100');
  assert.equal(await normal.getAttribute('aria-valuetext'), '25%');
  await normal.focus();
  for (const [key, expected] of [['ArrowRight', 30], ['ArrowUp', 35], ['ArrowLeft', 30], ['ArrowDown', 25], ['Home', 0], ['PageUp', 50], ['End', 100], ['PageDown', 50]]) {
    await page.keyboard.press(key);
    await valueIs(normal, expected);
    assert.equal((await events()).commits.normal.at(-1), expected, 'keyboard changes commit immediately');
  }
  assert.deepEqual(await formData('normal-form'), { volume: '50' });
  const beforeReset = await events();
  await root('normal-form').getByRole('button', { name: 'Reset normal' }).click();
  await valueIs(normal, 25);
  assert.deepEqual(await formData('normal-form'), { volume: '25' });
  assert.deepEqual(await events(), beforeReset, 'native reset restores uncontrolled value without change/commit callbacks');
  const center = await boxFor(normal);
  await page.mouse.click(center.x + center.width / 2, center.y + center.height / 2);
  assert.equal(await value(normal), 25, 'center content is not an invisible track target');
  assert.deepEqual((await events()).changes, beforeReset.changes);
  assert.deepEqual((await events()).commits, beforeReset.commits);

  const canceled = root('canceled');
  await canceled.focus();
  await page.keyboard.press('ArrowRight');
  await valueIs(canceled, 30);
  const beforeCanceledReset = await events();
  await root('canceled-form').getByRole('button').click();
  await page.waitForTimeout(20);
  assert.equal(await value(canceled), 30);
  assert.deepEqual(await formData('canceled-form'), { canceled: '30' });
  assert.deepEqual(await events(), beforeCanceledReset, 'preventDefault cancels a form reset');

  const external = root('external');
  await external.focus();
  await page.keyboard.press('ArrowRight');
  await valueIs(external, 35);
  assert.deepEqual(await formData('external-form'), { external: '35' });
  await root('external-form').getByRole('button').click();
  await valueIs(external, 30);
  assert.deepEqual(await formData('external-form'), { external: '30' });

  const controlled = root('controlled');
  await root('controlled-form').getByRole('button', { name: 'Set controlled', exact: true }).click();
  await valueIs(controlled, 70);
  const beforeControlledReset = await events();
  await root('controlled-form').getByRole('button', { name: 'Reset controlled', exact: true }).click();
  await page.waitForTimeout(20);
  assert.equal(await value(controlled), 70);
  assert.deepEqual(await formData('controlled-form'), { controlled: '70' });
  assert.deepEqual(await events(), beforeControlledReset, 'reset cannot override a controlled value');
  const commitsBeforeDrag = (await events()).commits.controlled?.length ?? 0;
  const controlledBox = await boxFor(controlled);
  const controlledThumb = await controlled.locator('.inkra-circular-slider__thumb').boundingBox();
  await page.mouse.move(controlledThumb.x + controlledThumb.width / 2, controlledThumb.y + controlledThumb.height / 2);
  await page.mouse.down();
  for (const angle of [270, 288]) {
    const position = point(controlledBox, angle);
    await page.mouse.move(position.x, position.y);
  }
  await valueIs(controlled, 80);
  assert.equal((await events()).commits.controlled?.length ?? 0, commitsBeforeDrag, 'pointer moves do not commit');
  await page.mouse.up();
  assert.equal((await events()).commits.controlled.length, commitsBeforeDrag + 1);
  assert.equal((await events()).commits.controlled.at(-1), 80);

  const frozen = root('frozen');
  await dragAngles(frozen, [180, 225, 270]);
  assert.equal(await value(frozen), 40, 'controlled value stays authoritative when the parent declines updates');
  assert.equal((await events()).changes.frozen.at(-1), 75);
  assert.deepEqual((await events()).commits.frozen, [75], 'commit reports the final proposed value, not the stale controlled prop');

  const high = await dragAngles(root('full-high'), [350, 359, 1, 10]);
  assert(high.every(number => number >= 95), 'clockwise motion across the 360-degree seam never jumps to minimum');
  assert.equal(high.at(-1), 100);
  const low = await dragAngles(root('full-low'), [10, 1, 359, 350]);
  assert(low.every(number => number <= 5), 'counterclockwise motion across the seam never jumps to maximum');
  assert.equal(low.at(-1), 0);
  await clickAt(root('full-high'), 90);
  await valueIs(root('full-high'), 25);
  await clickAt(root('full-low'), 270);
  await valueIs(root('full-low'), 75);
  const grabRoot = root('full-high');
  await grabRoot.scrollIntoViewIfNeeded();
  const edgeThumb = await grabRoot.locator('.inkra-circular-slider__thumb').boundingBox();
  const beforeGrab = await events();
  await page.mouse.move(edgeThumb.x + edgeThumb.width / 2, edgeThumb.y + edgeThumb.height / 2 + 18);
  await page.mouse.down();
  assert.equal(await value(grabRoot), 25, 'grabbing the edge of the thumb hit target does not jump to the pointer angle');
  await page.mouse.up();
  assert.deepEqual((await events()).changes['full-high'], beforeGrab.changes['full-high']);
  assert.deepEqual((await events()).commits['full-high'], beforeGrab.commits['full-high']);
  const gapHigh = await dragAngles(root('gap-high'), [125, 145, 175]);
  assert(gapHigh.every(number => number >= 90), 'moving from maximum into the 270-degree gap retains the high endpoint');
  assert.equal(gapHigh.at(-1), 100);
  const gapLow = await dragAngles(root('gap-low'), [235, 215, 185]);
  assert(gapLow.every(number => number <= 10));
  assert.equal(gapLow.at(-1), 0);
  await clickAt(root('gap-high'), 200);
  await valueIs(root('gap-high'), 0);
  await clickAt(root('gap-high'), 160);
  await valueIs(root('gap-high'), 100);

  const rtl = root('rtl');
  await rtl.focus();
  await page.keyboard.press('ArrowRight');
  await valueIs(rtl, 45);
  await clickAt(rtl, 90);
  await valueIs(rtl, 25);
  await clickAt(root('counterclockwise'), 90);
  await valueIs(root('counterclockwise'), 75);

  const disabled = root('disabled');
  const readonly = root('readonly');
  assert.equal(await disabled.getAttribute('aria-disabled'), 'true');
  assert.equal(await readonly.getAttribute('aria-readonly'), 'true');
  assert.notEqual(await disabled.getAttribute('tabindex'), '0');
  for (const element of [disabled, readonly]) {
    await clickAt(element, 45);
    await element.focus();
    await page.keyboard.press('End');
    assert.equal(await value(element), 40);
  }
  assert.deepEqual((await events()).changes.disabled ?? [], []);
  assert.deepEqual((await events()).changes.readonly ?? [], []);
  assert.deepEqual(await formData('disabled-form'), {});
  assert.deepEqual(await formData('readonly-form'), { readonly: '40' });

  const touch = root('touch');
  const touchBox = await boxFor(touch);
  const thumbBox = await touch.locator('.inkra-circular-slider__thumb').boundingBox();
  const cdp = await context.newCDPSession(page);
  const touchPoint = position => ({ x: position.x, y: position.y, id: 1, radiusX: 4, radiusY: 4, force: 1 });
  const initialScroll = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint({ x: thumbBox.x + thumbBox.width / 2, y: thumbBox.y + thumbBox.height / 2 })] });
  for (const angle of [135, 180, 225, 270]) {
    const position = point(touchBox, angle, angle === 270 ? touchBox.width : undefined);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(position)] });
  }
  await valueIs(touch, 75);
  assert.equal((await events()).commits.touch?.length ?? 0, 0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.deepEqual((await events()).commits.touch, [75]);
  assert((await events()).captures.some(event => event.type === 'got' && event.pointerType === 'touch'), 'real touch gestures acquire pointer capture');
  assert.equal(await page.evaluate(() => scrollY), initialScroll, 'touch dragging outside the ring does not scroll the page');
  const cancelBox = await boxFor(touch);
  const cancelThumb = await touch.locator('.inkra-circular-slider__thumb').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint({ x: cancelThumb.x + cancelThumb.width / 2, y: cancelThumb.y + cancelThumb.height / 2 })] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(point(cancelBox, 288))] });
  await valueIs(touch, 80);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  assert.equal(await value(touch), 80, 'cancel preserves accepted live changes');
  assert.deepEqual((await events()).commits.touch, [75], 'canceled touch does not emit a successful commit');
  assert.deepEqual(errors, []);
  console.log('CircularSlider: real docs responsive preview, keyboard/step, controlled commits, form/reset, center/gap/seam geometry, RTL/clockwise, readonly/disabled and native touch capture/cancel passed.');
  }
} finally {
  await page.evaluate(() => {
    window.circularSliderFixture?.unmount();
    document.getElementById('circular-slider-fixture')?.remove();
    const app = document.getElementById('root');
    if (app) app.hidden = false;
  }).catch(() => {});
  await browser.close();
}
