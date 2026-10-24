import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, reducedMotion: 'reduce' });
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const flush = () => page.waitForTimeout(150);
const fixture = name => page.getByTestId(name);
const assertNoClipping = async root => {
  const boxes = await root.evaluate(element => {
    const list = element.querySelector('[role="tablist"]');
    const bounds = list.getBoundingClientRect();
    return Array.from(list.querySelectorAll('[role="tab"]:not([data-overflow-hidden])')).map(node => {
      const box = node.getBoundingClientRect();
      return { label: node.textContent, left: box.left - bounds.left, right: box.right - bounds.right };
    });
  });
  for (const box of boxes) assert(box.left >= -1 && box.right <= 1, `complete visible tab ${JSON.stringify(box)}`);
};
try {
  await page.goto(`${base}/docs/components/tabs#preview`);
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/tabs-overflow.tsx');
    window.tabsOverflow = mount(container);
  });
  await fixture('menu').getByRole('button', { name: 'More tabs', exact: true }).waitFor();
  await flush();
  assert.equal(await fixture('native').getByRole('button').count(), 0);
  await fixture('native').getByRole('tab', { name: 'Preferences' }).focus();
  assert((await fixture('native').getByRole('tablist').evaluate(node => node.scrollLeft)) > 0);

  const buttons = fixture('buttons');
  const previous = buttons.getByRole('button', { name: 'Scroll to previous tabs', exact: true });
  const next = buttons.getByRole('button', { name: 'Scroll to next tabs', exact: true });
  assert(await previous.isDisabled());
  assert(await next.isEnabled());
  await next.click();
  await flush();
  assert((await buttons.getByRole('tablist').evaluate(node => node.scrollLeft)) > 0);
  assert(await previous.isEnabled());
  assert.equal(await buttons.getByRole('tab', { name: 'Alpha notes' }).getAttribute('aria-selected'), 'true');
  for (let i = 0; i < 10 && await next.isEnabled(); i++) { await next.click(); await flush(); }
  assert(await next.isDisabled());

  const menu = fixture('menu');
  await assertNoClipping(menu);
  assert.equal(await menu.locator('[data-overflow-hidden]:not([inert])').count(), 0);
  await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
  const settings = page.getByRole('menuitemradio', { name: 'Settings and preferences', exact: true });
  await settings.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="menu"] [data-tabs-value="5"]')?.getAttribute('aria-selected') === 'true');
  await flush();
  assert.equal(await menu.getByRole('tab', { name: 'Preferences', exact: true }).getAttribute('data-overflow-hidden'), null);
  assert.equal(await menu.locator('input:visible').inputValue(), 'Panel 5');
  assert.equal(await menu.getByRole('tab', { name: 'Preferences' }).evaluate(node => node === document.activeElement), true);
  await assertNoClipping(menu);
  assert.deepEqual(await page.evaluate(() => window.tabsOverflow.events), ['menu:5']);

  // Menu selection preserves controlled ownership, including repeated rejected requests.
  for (let i = 0; i < 2; i++) {
    await fixture('rejected').getByRole('button', { name: 'More tabs', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Settings and preferences', exact: true }).click();
    await flush();
  }
  assert.equal(await fixture('rejected').getByRole('tab', { name: 'Alpha notes' }).getAttribute('aria-selected'), 'true');
  assert.deepEqual((await page.evaluate(() => window.tabsOverflow.events)).filter(event => event.startsWith('rejected:')), ['rejected:5', 'rejected:5']);

  await page.evaluate(() => { window.tabsOverflow.setValue('0'); window.tabsOverflow.setWidth(220); });
  await flush();
  await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
  assert.equal(await page.getByRole('menuitemradio', { name: 'Draft ideas', exact: true }).getAttribute('aria-disabled'), 'true');
  await page.keyboard.press('Escape');
  await flush();
  assert(await menu.getByRole('button', { name: 'More tabs', exact: true }).evaluate(node => node === document.activeElement));
  await assertNoClipping(menu);

  for (const direction of ['ltr', 'rtl']) {
    await page.evaluate(direction => { window.tabsOverflow.setDirection(direction); window.tabsOverflow.setValue('0'); }, direction);
    await flush();
    await buttons.getByRole('tablist').evaluate(node => node.scrollLeft = 0);
    await flush();
    await next.click();
    await flush();
    const offset = await buttons.getByRole('tablist').evaluate(node => node.scrollLeft);
    assert(direction === 'rtl' ? offset < 0 : offset > 0);
    await assertNoClipping(menu);
    await assertNoClipping(fixture('full-width'));
    await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
    assert.equal(await page.getByRole('menu').getAttribute('dir'), direction);
    await page.keyboard.press('Escape');
    await flush();
  }
  await page.evaluate(() => { window.tabsOverflow.setDirection('ltr'); window.tabsOverflow.setWidth(1000); });
  await flush();
  assert.equal(await menu.getByRole('button').count(), 0, 'controls disappear after growing');
  assert.equal(await buttons.getByRole('button').count(), 0);
  assert.equal(await menu.locator('[data-overflow-hidden]').count(), 0);
  const manual = fixture('manual');
  await manual.getByRole('tab', { name: 'History notes' }).focus();
  assert.equal(await manual.getByRole('tab', { name: 'Alpha notes' }).getAttribute('aria-selected'), 'true');
  await page.evaluate(() => window.tabsOverflow.setWidth(220));
  await flush();
  assert(await manual.getByRole('button', { name: 'More tabs', exact: true }).evaluate(node => node === document.activeElement), 'resize moves hidden manual focus to more');
  await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
  await page.getByRole('menu').waitFor();
  await page.evaluate(() => window.tabsOverflow.setWidth(1000));
  await flush();
  assert.equal(await page.getByRole('menu').count(), 0);
  assert(await menu.getByRole('tab', { name: 'Alpha notes' }).evaluate(node => node === document.activeElement), 'growing out of an open menu preserves focus');
  await menu.getByRole('tab', { name: 'History notes' }).focus();
  await page.evaluate(() => window.tabsOverflow.setWidth(220));
  await flush();
  await assertNoClipping(menu);
  await page.evaluate(() => window.tabsOverflow.setLabel('An unexpectedly long translated heading'));
  await flush();
  await assertNoClipping(menu);
  await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'An unexpectedly long translated heading', exact: true }).waitFor();
  await page.keyboard.press('Escape');

  await page.evaluate(() => { window.tabsOverflow.setLabel('Alpha notes'); window.tabsOverflow.setCount(2); window.tabsOverflow.setValue('0'); });
  await flush();
  assert.equal(await menu.getByRole('button').count(), 0, 'removed items leave no stale overflow entry');
  await page.evaluate(() => window.tabsOverflow.setCount(6));
  await flush();
  for (const width of [1305, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.inkraTheme = theme; }, theme);
      await flush();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await assertNoClipping(menu);
      await page.screenshot({ path: `/tmp/inkra-tabs-overflow-${theme}-${width}.png` });
    }
  }
  await page.emulateMedia({ forcedColors: 'active' });
  assert(await menu.getByRole('button', { name: 'More tabs', exact: true }).isVisible());
  assert(await menu.locator('.inkra-tabs__overflow-icon svg').isVisible(), 'system colors retain the arrow shape');
  await menu.getByRole('button', { name: 'More tabs', exact: true }).click();
  await page.getByRole('menu').waitFor();
  await page.keyboard.press('Escape');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.evaluate(() => window.tabsOverflow.setMode('scroll'));
  await flush();
  assert.equal(await menu.locator('[data-overflow-hidden]').count(), 0, 'mode switch unhides every trigger');
  assert.equal(await menu.getByRole('button').count(), 0);
  await page.waitForTimeout(300);
  const idleReads = await page.evaluate(async () => {
    const original = window.getComputedStyle;
    let reads = 0;
    window.getComputedStyle = (...args) => {
      if (args[0].matches('.inkra-tabs__list, .inkra-tabs__trigger')) reads++;
      return original(...args);
    };
    await new Promise(resolve => setTimeout(resolve, 300));
    window.getComputedStyle = original;
    return reads;
  });
  assert(idleReads < 10, `no continuous idle measuring: ${idleReads}`);
  assert.deepEqual(errors, []);
  console.log('PASS Tabs native/menu/buttons: focus, selection, controlled retries, disabled items, resize, dynamic labels/items, RTL, narrow layout and themes');
} catch (error) {
  console.error(await fixture('menu').evaluate(root => ({ width: root.clientWidth, tabs: Array.from(root.querySelectorAll('[role="tab"]')).map(node => {
    const label = node.querySelector('.inkra-tabs__label');
    return { text: label.textContent, width: node.offsetWidth, labelWidth: label.offsetWidth, labelScrollWidth: label.scrollWidth, computedWidth: getComputedStyle(label).width, hidden: node.hasAttribute('data-overflow-hidden') };
  }) })));
  await page.screenshot({ path: '/tmp/inkra-tabs-overflow-failure.png' });
  throw error;
} finally { await browser.close(); }
