import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.tabsRefinementFixture.events);

try {
  await page.goto(`${base}/docs/components/tabs#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'tabs-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/TabsRefinementFixture.tsx');
    window.tabsRefinementFixture = mount(container);
  });
  await page.getByTestId('rejected-controlled').waitFor();

  const rejected = page.getByTestId('rejected-controlled');
  const rejectedTwo = rejected.getByRole('tab', { name: 'Two' });
  await rejectedTwo.click();
  assert.deepEqual((await events()).rejected, ['two'], 'one pointer interaction emits once when rejected');
  assert.equal(await rejected.getByRole('tab', { name: 'One' }).getAttribute('aria-selected'), 'true');
  await rejectedTwo.click();
  assert.deepEqual((await events()).rejected, ['two', 'two'], 'a later pointer interaction can retry the rejected value');

  const accepted = page.getByTestId('accepted-controlled');
  await accepted.getByRole('tab', { name: 'Two' }).click();
  assert.deepEqual((await events()).accepted, ['two'], 'accepted pointer interaction emits once');
  assert.equal(await accepted.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected'), 'true');

  const automatic = page.getByTestId('automatic-case');
  const automaticOne = automatic.getByRole('tab', { name: 'One' });
  await automaticOne.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(node => node.getAttribute('aria-selected') === 'true',
    await automatic.getByRole('tab', { name: 'Three' }).elementHandle());
  assert.equal(await automatic.getByRole('tab', { name: 'Three' }).getAttribute('aria-selected'), 'true');
  assert.deepEqual((await events()).automatic, ['three']);

  const manual = page.getByTestId('manual-case');
  const manualOne = manual.getByRole('tab', { name: 'One' });
  await manualOne.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(node => node === document.activeElement,
    await manual.getByRole('tab', { name: 'Two' }).elementHandle());
  assert.equal(await manual.getByRole('tab', { name: 'One' }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Two');
  await page.keyboard.press('Enter');
  assert.equal(await manual.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected'), 'true');
  assert.deepEqual((await events()).manual, ['two']);

  const rtl = page.getByTestId('rtl-case');
  await rtl.getByRole('tab', { name: 'One' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(node => node === document.activeElement,
    await rtl.getByRole('tab', { name: 'Two' }).elementHandle());
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Two');

  const forceMount = page.getByTestId('force-mount-case');
  assert.equal(await forceMount.locator('.inkra-tabs__content[data-state="inactive"]').getAttribute('hidden'), '');
  assert.equal(await forceMount.getByRole('button', { name: 'Hidden action', includeHidden: true }).isVisible(), false);
  await forceMount.getByRole('tab', { name: 'One' }).focus();
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => document.activeElement?.textContent), 'Hidden action');
  await forceMount.getByRole('button', { name: 'Hidden action', includeHidden: true }).evaluate(node => node.focus());
  assert.notEqual(await page.evaluate(() => document.activeElement?.textContent), 'Hidden action');

  const overflow = page.getByTestId('overflow-case');
  const overflowList = overflow.getByRole('tablist', { name: 'Overflow tabs' });
  const last = overflow.getByRole('tab', { name: 'Very long five tab' });
  await last.focus();
  await page.waitForFunction(node => node.scrollLeft !== 0, await overflowList.elementHandle());
  const geometry = await last.evaluate(node => {
    const trigger = node.getBoundingClientRect();
    const ring = node.querySelector('.inkra-tabs__focus-ring').getBoundingClientRect();
    const list = node.parentElement.getBoundingClientRect();
    return { trigger, ring, list };
  });
  assert(geometry.ring.left >= geometry.trigger.left && geometry.ring.right <= geometry.trigger.right,
    'focus ring stays within trigger geometry and cannot be clipped vertically');
  assert(geometry.trigger.left >= geometry.list.left - 1 && geometry.trigger.right <= geometry.list.right + 1,
    'focused overflow tab scrolls fully into view');
  await page.waitForFunction(node => {
    const canvas = node.querySelector('.inkra-tabs__focus-ring canvas');
    return canvas?.width && canvas?.height && canvas.getContext('2d')
      .getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
  }, await last.elementHandle());
  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    await last.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-tabs-round6-focus-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }

  await page.emulateMedia({ forcedColors: 'active' });
  const forcedTab = overflow.getByRole('tab', { name: 'Very long five tab' });
  assert.equal(await forcedTab.locator('.inkra-tabs__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await forcedTab.locator('.inkra-tabs__selection').evaluate(node => getComputedStyle(node).display), 'none');
  assert.notEqual(await forcedTab.evaluate(node => getComputedStyle(node).outlineStyle), 'none');

  assert.deepEqual(errors, []);
  console.log('PASS Tabs controlled retry, pointer dedup, Radix keyboard modes, forceMount and overflow focus');
} finally {
  await page.evaluate(() => {
    window.tabsRefinementFixture?.unmount();
    document.getElementById('tabs-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
