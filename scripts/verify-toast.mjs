import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
page.setDefaultTimeout(6000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const positions = ['top-start', 'top-center', 'top-end', 'center-start', 'center', 'center-end', 'bottom-start', 'bottom-center', 'bottom-end'];
const root = id => page.locator(`.inkra-toast__root[data-toast-id="${id}"]`);
const add = options => page.evaluate(options => window.toastFixture.manager.add(options), options);
const clear = async () => {
  await page.evaluate(() => window.toastFixture.manager.closeAll());
  await page.waitForFunction(() => !document.querySelector('.inkra-toast__root'));
};
try {
  await page.goto(`${base}/docs/components/toast#preview`);
  await page.locator('.component-playground').waitFor();
  await page.evaluate(async () => {
    document.getElementById('root').style.display = 'none';
    const container = document.createElement('div');
    container.id = 'toast-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/toast.tsx');
    window.toastFixture = mount(container);
  });
  await page.getByRole('button', { name: 'Add notification' }).waitFor();
  await page.waitForTimeout(100);
  await root('mount-layout').waitFor();
  await root('mount-effect').waitFor();
  assert.equal(await page.locator('[data-placement="top-center"] [data-toast-id="mount-effect"]').count(), 1);
  await clear();
  for (const position of positions) await add({ id: position, title: position, placement: position, timeout: 0 });
  await page.waitForFunction(() => document.querySelectorAll('.inkra-toast__root').length === 9);
  await page.waitForTimeout(250);
  for (const position of positions) {
    assert.equal(await root(position).getAttribute('data-variant'), /^(top|bottom)-(start|end)$/.test(position) ? 'card' : 'compact');
    const box = await root(position).boundingBox();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1306 && box.y + box.height <= 955, `${position} stays in the viewport`);
    if (position.startsWith('top')) assert(box.y < 50);
    if (position.startsWith('bottom')) assert(box.y + box.height > 900);
    if (position.includes('center') && !position.startsWith('center-')) assert(Math.abs(box.x + box.width / 2 - 652.5) < 3);
  }
  assert.equal(await page.evaluate(() => window.toastFixture.getToasts().length), 9);
  await page.screenshot({ path: '/tmp/inkra-toast-nine-positions.png' });
  const trigger = page.getByRole('button', { name: 'Add notification' });
  await trigger.focus();
  await page.keyboard.press('F6');
  assert.equal(await root('top-start').evaluate(node => node === document.activeElement), true);
  await root('top-start').locator('.inkra-toast__focus').waitFor({ state: 'visible' });
  await page.keyboard.press('F6');
  assert.equal(await root('top-center').evaluate(node => node === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'return to the original page control');
  await page.keyboard.press('F6');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await root('top-start').waitFor({ state: 'detached' });
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'keyboard close restores page focus');
  await clear();

  for (let index = 0; index < 3; index++) await add({ id: `top-${index}`, title: `Top ${index}`, placement: 'top-center', timeout: 0 });
  await add({ id: 'bottom', title: 'Bottom', placement: 'bottom-end', timeout: 0 });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-placement="top-center"] .inkra-toast__root:not([data-limited])').count(), 2);
  assert.equal(await root('top-0').getAttribute('inert'), '');
  assert(await root('bottom').isVisible(), 'another queue is not limited');
  await page.evaluate(() => window.toastFixture.manager.closeAll('top-center'));
  await root('top-2').waitFor({ state: 'detached' });
  assert(await root('bottom').isVisible());
  await page.evaluate(() => window.toastFixture.update({ placement: 'top-start', variant: 'compact' }));
  await page.waitForTimeout(50);
  await add({ id: 'new-default', title: 'New default', timeout: 0 });
  assert.equal(await root('new-default').getAttribute('data-variant'), 'compact');
  await add({ id: 'bottom', title: 'Updated', placement: 'center', timeout: 0 });
  assert.equal(await page.locator('[data-placement="bottom-end"] [data-toast-id="bottom"]').count(), 1);
  await clear();
  await page.evaluate(() => window.toastFixture.update({ limits: { 'top-center': 1 } }));
  await page.waitForTimeout(50);
  await add({ id: 'override-1', title: 'First', placement: 'top-center', timeout: 0 });
  await add({ id: 'override-2', title: 'Second', placement: 'top-center', timeout: 0 });
  await page.waitForTimeout(50);
  assert.equal(await page.locator('[data-placement="top-center"] .inkra-toast__root:not([data-limited])').count(), 1);
  await clear();

  await page.mouse.move(650, 450);
  await add({ id: 'paused', title: 'Paused', placement: 'top-start', timeout: 900 });
  await root('paused').hover();
  await add({ id: 'independent', title: 'Independent', placement: 'bottom-end', timeout: 350 });
  await root('independent').waitFor({ state: 'detached', timeout: 4000 });
  assert(await root('paused').isVisible(), 'hover only pauses one queue');
  await page.mouse.move(650, 450);
  await root('paused').waitFor({ state: 'detached', timeout: 4000 });

  await add({ id: 'refresh', title: 'Original', placement: 'top-end', timeout: 650 });
  await page.waitForTimeout(350);
  await add({ id: 'refresh', title: 'Refreshed', placement: 'bottom-start', timeout: 650 });
  await page.waitForTimeout(350);
  assert(await root('refresh').isVisible(), 'upsert refreshes its own timer');
  assert.equal(await page.locator('[data-placement="top-end"] [data-toast-id="refresh"]').count(), 1);
  await root('refresh').waitFor({ state: 'detached', timeout: 4000 });

  await add({ id: 'swipe', title: 'Swipe', placement: 'bottom-end', timeout: 0 });
  await page.waitForTimeout(250);
  const swipeBox = await root('swipe').boundingBox();
  await page.mouse.move(swipeBox.x + 30, swipeBox.y + 25);
  await page.mouse.down();
  await page.mouse.move(swipeBox.x + 260, swipeBox.y + 25, { steps: 12 });
  await page.mouse.up();
  await root('swipe').waitFor({ state: 'detached' });

  await page.evaluate(async () => {
    await window.toastFixture.manager.promise(Promise.resolve('Complete'), { placement: 'center', variant: 'card', loading: 'Loading', success: title => ({ title, timeout: 0 }), error: 'Failed' });
  });
  await page.getByText('Complete', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-placement="center"] .inkra-toast__root').getAttribute('data-variant'), 'card');
  await clear();
  await page.evaluate(async () => {
    await window.toastFixture.manager.promise(Promise.reject(new Error('Rejected')), { placement: 'center-end', loading: 'Loading', success: 'Done', error: { title: 'Failed', timeout: 0 } }).catch(() => {});
  });
  await page.getByText('Failed', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-placement="center-end"] .inkra-toast__root').getAttribute('data-tone'), 'danger');
  await clear();

  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-inkra-theme', theme);
      }, theme);
      for (const variant of ['card', 'compact']) {
        await add({ id: 'visual', title: 'Changes saved', description: 'The updated document is available in your workspace.', placement: 'top-center', variant, timeout: 0, type: 'success' });
        await root('visual').waitFor();
        await page.waitForTimeout(250);
        const box = await root('visual').boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width + 1);
        assert.equal(await root('visual').evaluate(node => node.scrollWidth <= node.clientWidth), true);
        const close = root('visual').getByRole('button', { name: 'Close notification', includeHidden: true });
        const buttonBox = await close.boundingBox();
        assert(buttonBox.width >= 44 && buttonBox.height >= 44);
        await root('visual').screenshot({ path: `/tmp/inkra-toast-${variant}-${theme}-${width}.png` });
        await close.click();
        await root('visual').waitFor({ state: 'detached' });
      }
    }
  }
  await page.setViewportSize({ width: 1305, height: 954 });
  await page.evaluate(() => document.documentElement.dir = 'rtl');
  await add({ id: 'rtl', title: 'RTL start', placement: 'center-start', timeout: 0 });
  await page.waitForTimeout(250);
  assert((await root('rtl').boundingBox()).x > 900);
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  assert.equal(await root('rtl').evaluate(node => getComputedStyle(node).transitionDuration), '0s');
  assert.equal(await root('rtl').evaluate(node => getComputedStyle(node).borderTopWidth), '1px');
  await root('rtl').focus();
  await page.keyboard.press('Escape');
  await root('rtl').waitFor({ state: 'detached' });
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });
  await page.evaluate(() => document.documentElement.dir = 'ltr');
  await page.setViewportSize({ width: 320, height: 300 });
  await page.evaluate(() => window.toastFixture.manager.add({
    id: 'long', title: 'Long notification', placement: 'center', variant: 'card', timeout: 0,
    description: 'A long notification must remain readable in a short viewport. '.repeat(15),
    actionProps: { children: 'Open the complete saved document in the workspace', onClick: () => { window.toastActionClicked = true; } },
  }));
  const action = root('long').locator('.inkra-toast__action');
  await action.scrollIntoViewIfNeeded();
  await action.click();
  assert.equal(await page.evaluate(() => window.toastActionClicked), true);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const actionBox = await action.boundingBox();
  assert(actionBox.x >= 0 && actionBox.x + actionBox.width <= 321 && actionBox.y >= 0 && actionBox.y + actionBox.height <= 301);
  assert(await action.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node.querySelector('.inkra-pencil-text__source'));
    const box = node.getBoundingClientRect();
    return [...range.getClientRects()].every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1);
  }), 'the complete action label stays inside its button');
  await page.screenshot({ path: '/tmp/inkra-toast-short-long-content.png' });
  await clear();
  await page.evaluate(() => window.toastFixture.unmount());
  assert.deepEqual(errors, []);
  console.log('PASS Toast independent queues, timers, limits, updates, promises, nine placements, both styles, responsive/RTL, keyboard and system colors');
} catch (error) {
  console.error(await page.locator('.inkra-toast__viewport').evaluateAll(nodes => nodes.map(node => node.outerHTML)));
  await page.screenshot({ path: '/tmp/inkra-toast-failure.png' });
  throw error;
} finally { await browser.close(); }
