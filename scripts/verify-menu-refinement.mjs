import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 520 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const viewportContains = async locator => locator.evaluate(async node => {
  await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})));
  const box = node.getBoundingClientRect();
  return box.left >= 7 && box.top >= 7 && box.right <= innerWidth - 7 && box.bottom <= innerHeight - 7;
});

try {
  await page.goto(`${base}/docs/components/dropdown-menu#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'menu-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/MenuRefinementFixture.tsx');
    window.menuRefinementFixture = mount(container);
  });
  await page.getByTestId('dropdown-case').waitFor();

  await page.keyboard.press('Tab');
  const nativeFocus = await page.evaluate(() => {
    const button = document.createElement('button');
    button.textContent = 'Native focus fallback';
    document.body.append(button);
    button.focus();
    const result = { visible: button.matches(':focus-visible'), outline: getComputedStyle(button).outlineStyle };
    button.remove();
    return result;
  });
  assert.equal(nativeFocus.visible, true);
  assert.equal(nativeFocus.outline, 'solid', 'unstyled controls retain the global focus fallback');

  await page.getByRole('button', { name: 'Open dropdown refinement' }).click();
  const dropdown = page.getByRole('menu', { name: 'Open dropdown refinement' });
  await dropdown.waitFor();
  await page.waitForFunction(node => node.getBoundingClientRect().width > 0, await dropdown.elementHandle());
  assert.equal(await viewportContains(dropdown), true);
  const longItem = page.getByRole('menuitem', { name: /A very long menu action/ });
  const label = longItem.locator('.inkra-menu__label');
  assert.equal((await label.innerText()).trim(), 'A very long menu action label that must wrap readably without displacing its indicator');
  assert.equal(await label.evaluate(node => getComputedStyle(node).overflowWrap), 'anywhere');
  const labelBox = await label.boundingBox();
  const itemBox = await longItem.boundingBox();
  assert(labelBox.x + labelBox.width <= itemBox.x + itemBox.width + 1 && labelBox.x >= itemBox.x - 1,
    'wrapped label stays within the menu item');
  assert(labelBox.height > 24, 'long label wraps instead of clipping or truncating');
  const customLabel = page.locator('[data-custom-menu-label]');
  const customBox = await customLabel.boundingBox();
  const customItemBox = await customLabel.locator('..').boundingBox();
  assert(customBox.x + customBox.width <= customItemBox.x + customItemBox.width + 1 && customBox.x >= customItemBox.x - 1,
    'custom ReactNode labels keep their content and wrap inside the item');
  const paper = dropdown.locator('.inkra-menu__paper');
  assert(await paper.evaluate(node => node.scrollHeight > node.clientHeight), 'short viewport menu scrolls locally');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.keyboard.press('Home');
  await longItem.focus();
  assert.equal(await longItem.evaluate(node => getComputedStyle(node).outlineStyle), 'none', 'global fallback does not duplicate menu highlight');
  await page.screenshot({ path: '/tmp/inkra-menu-round7-narrow.png', animations: 'disabled' });

  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.includes('Disabled action')), false,
    'keyboard navigation skips disabled items');
  const checkbox = page.getByRole('menuitemcheckbox', { name: 'Receive updates' });
  await checkbox.focus();
  await page.keyboard.press('Enter');
  await dropdown.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Open dropdown refinement' }).click();
  const unchecked = page.getByRole('menuitemcheckbox', { name: 'Receive updates' });
  assert.equal(await unchecked.getAttribute('aria-checked'), 'false');
  await unchecked.click();
  await dropdown.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Open dropdown refinement' }).click();
  const grid = page.getByRole('menuitemradio', { name: 'Grid view' });
  await grid.click();
  await page.getByRole('button', { name: 'Open dropdown refinement' }).click();
  assert.equal(await page.getByRole('menuitemradio', { name: 'Grid view' }).getAttribute('aria-checked'), 'true');
  await page.keyboard.press('Escape');

  const ltrTarget = page.getByTestId('context-ltr-case').locator('[data-context-menu-trigger]');
  await ltrTarget.focus();
  await page.keyboard.press('Shift+F10');
  const ltrMenu = page.getByRole('menu', { name: 'LTR context actions' });
  await ltrMenu.waitFor();
  await page.waitForFunction(node => node.getBoundingClientRect().width > 0, await ltrMenu.elementHandle());
  assert.equal(await viewportContains(ltrMenu), true);
  const ltrSub = page.getByRole('menuitem', { name: /Move to a very long nested/ });
  await ltrSub.focus();
  await page.keyboard.press('ArrowRight');
  const ltrSubmenu = page.getByRole('menu', { name: 'Move to a very long nested destination label' });
  await ltrSubmenu.waitFor();
  assert.equal(await viewportContains(ltrSubmenu), true);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Move to'));
  await page.keyboard.press('Escape');
  await ltrMenu.waitFor({ state: 'hidden' });
  await page.waitForFunction(node => document.activeElement === node, await ltrTarget.elementHandle());

  const rtlTarget = page.getByTestId('context-rtl-case').locator('[data-context-menu-trigger]');
  await rtlTarget.focus();
  await page.keyboard.press('ContextMenu');
  const rtlMenu = page.getByRole('menu', { name: 'RTL context actions' });
  await rtlMenu.waitFor();
  const rtlSub = page.getByRole('menuitem', { name: 'RTL nested destination' });
  await rtlSub.focus();
  const indicatorTransform = await rtlSub.locator('.inkra-context-menu__sub-indicator').evaluate(node => getComputedStyle(node).transform);
  assert.notEqual(indicatorTransform, 'none');
  await page.keyboard.press('ArrowLeft');
  const rtlSubmenu = page.getByRole('menu', { name: 'RTL nested destination' });
  await rtlSubmenu.waitFor();
  assert.equal(await viewportContains(rtlSubmenu), true);
  await page.screenshot({ path: '/tmp/inkra-menu-round7-rtl.png', animations: 'disabled' });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await rtlMenu.waitFor({ state: 'hidden' });
  await page.waitForFunction(node => document.activeElement === node, await rtlTarget.elementHandle());

  await page.emulateMedia({ forcedColors: 'active' });
  await page.getByRole('button', { name: 'Open dropdown refinement' }).click();
  await dropdown.waitFor();
  const forcedItem = page.getByRole('menuitem', { name: /A very long menu action/ });
  await forcedItem.focus();
  assert.equal(await forcedItem.locator('.inkra-menu__highlight').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await forcedItem.evaluate(node => getComputedStyle(node).forcedColorAdjust), 'none');
  assert.notEqual(await forcedItem.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
  const forcedCheckbox = page.getByRole('menuitemcheckbox', { name: 'Receive updates' });
  assert.equal(await forcedCheckbox.getAttribute('aria-checked'), 'true');
  assert.equal(await forcedCheckbox.locator('.inkra-pencil-icon').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await forcedCheckbox.locator('.inkra-menu__icon').evaluate(node => getComputedStyle(node, '::after').content), '"✓"');
  const forcedSelected = page.getByRole('menuitemradio', { name: 'Grid view' });
  assert.equal(await forcedSelected.locator('.inkra-pencil-icon').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await forcedSelected.locator('.inkra-menu__icon').evaluate(node => getComputedStyle(node, '::after').content), '"✓"');

  assert.deepEqual(errors, []);
  console.log('PASS menu bounds, long labels, keyboard selection, nested RTL and forced colors');
} finally {
  await page.evaluate(() => {
    window.menuRefinementFixture?.unmount();
    document.getElementById('menu-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
