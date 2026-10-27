import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const headerGeometry = page => page.evaluate(() => Object.fromEntries([
  '.app-header', '.header-customize', '.header-github',
  ...(innerWidth > 768 ? ['.inkra-layout__header-sidebar', '.site-navigation'] : []),
].map(selector => {
  const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
  return [selector, { x, y, width, height }];
})));
const assertSameHeader = (actual, expected, label) => {
  for (const selector of Object.keys(expected)) {
    for (const key of ['x', 'y', 'width', 'height']) {
      assert(Math.abs(actual[selector][key] - expected[selector][key]) < 1,
        `${label}: ${selector}.${key}: ${actual[selector][key]} vs ${expected[selector][key]}`);
    }
  }
};
const assertLanguagePosition = async page => {
  const group = page.locator('.header-action-group');
  const language = group.locator('.header-language');
  assert.equal(await language.count(), 1, 'language belongs to the right-side actions');
  assert.equal(await page.locator('.header-brand .header-language').count(), 0);
  const a = await language.boundingBox();
  const b = await group.locator('.header-customize').boundingBox();
  const nav = await page.locator('.site-navigation').boundingBox();
  const actions = await group.boundingBox();
  assert(Math.abs(a.x + a.width - b.x) < 1 && Math.abs(a.y - b.y) < 1, 'language is immediately left of theme');
  assert(nav.x + nav.width <= actions.x + 1, 'navigation and actions do not overlap');
};
try {
  for (const width of [1305, 800, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    const group = page.locator('.header-action-group');
    const language = page.locator('.app-header').getByRole('button', { name: '语言', exact: true });
    await language.waitFor();
    const actions = group.locator(':scope > .inkra-button:visible');
    assert.equal(await actions.count(), width <= 768 ? 4 : 3);
    await assertLanguagePosition(page);
    const boxes = await actions.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    boxes.forEach((box, index) => {
      assert(box.width >= 44 && box.height >= 44);
      if (index) assert(Math.abs(box.x - boxes[index - 1].x - boxes[index - 1].width) < 1, 'group has no gaps');
      assert.equal(box.y, boxes[0].y);
    });
    assert.equal(await group.locator('.inkra-button-group__divider').count(), 0);
    assert(await actions.evaluateAll(nodes => nodes.every(node => node.dataset.variant === 'ghost')), 'all routes use unframed header actions');
    assert.equal(await language.locator('.inkra-pencil-icon').count(), 1, 'one language icon, no extra arrow');
    await language.click();
    assert.equal(await page.getByRole('menuitemradio', { name: '中文', exact: true }).getAttribute('aria-checked'), 'true');
    await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-locale')), 'en');
    await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
    await assertLanguagePosition(page);
    await page.reload();
    const englishLanguage = page.locator('.header-language');
    assert.equal(await englishLanguage.getAttribute('aria-label'), 'Language');
    await englishLanguage.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menu').waitFor();
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('header-language'));
    assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-locale')), 'zh-CN');
    await page.locator('.header-customize').click();
    const drawer = page.getByRole('dialog', { name: '主题定制', exact: true });
    await drawer.waitFor();
    assert.equal(await drawer.locator('.inkra-button-group__divider').count(), 0, 'group context does not leak into drawer buttons');
    const cancel = drawer.getByRole('button', { name: '取消', exact: true });
    assert.equal(await cancel.getAttribute('data-variant'), 'outline');
    assert.equal(await cancel.locator('.inkra-button__surface.inkra-pencil-surface--clipped').count(), 0);
    await page.waitForFunction(canvas => {
      if (!canvas?.width || !canvas.height) return false;
      return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
        .some((value, index) => index % 4 === 3 && value > 0);
    }, await cancel.locator('.inkra-button__surface > .inkra-pencil-surface__ink').elementHandle());
    assert(await cancel.locator('.inkra-button__surface > .inkra-pencil-surface__ink').evaluate(canvas =>
      canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)), 'cancel retains its own painted outline');
    await cancel.click();
    await drawer.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('header-customize'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await group.locator('.header-github').getAttribute('target'), '_blank');
    if (width <= 768) {
      await page.locator('.mobile-search-trigger').click();
      const search = page.getByRole('dialog', { name: '搜索文档', exact: true });
      await search.getByRole('combobox').fill('Button');
      assert(await search.getByRole('option').count() > 0, 'home shares the mobile search screen');
      await page.keyboard.press('Escape');
      await search.waitFor({ state: 'hidden' });
    }
    await page.evaluate(() => document.fonts.ready);
    const homeHeader = await headerGeometry(page);
    assert.equal(homeHeader['.app-header'].width, width);
    await page.screenshot({ path: `/tmp/inkra-home-header-${width}.png` });
    await page.goto(`${base}/docs/getting-started`);
    await page.locator('.page-heading').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assertSameHeader(await headerGeometry(page), homeHeader, 'home to docs');
    assert.equal(await page.locator('.app-header .header-language').count(), 0, 'docs keeps language selection in the sidebar');
    assert.equal(await group.count(), 1, 'docs also groups header actions');
    const docsActions = group.locator(':scope > .inkra-button:visible');
    assert.equal(await docsActions.count(), width <= 768 ? 3 : 2, 'mobile adds search before theme and GitHub');
    assert.equal(await group.locator('.inkra-button-group__divider').count(), 0, 'ghost actions do not use outlined group dividers');
    assert(await docsActions.evaluateAll(nodes => nodes.every(node => node.dataset.variant === 'ghost')));
    const docsBoxes = await docsActions.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    assert(Math.abs(docsBoxes[1].x - docsBoxes[0].x - docsBoxes[0].width) < 1, 'docs actions have no gap');
    assert.equal(docsBoxes[0].y, docsBoxes[1].y);
    assert(docsBoxes.every(box => box.width >= 44 && box.height >= 44));
    assert(await docsActions.locator('.inkra-button__surface > .inkra-pencil-surface__border').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).display === 'none')));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-docs-header-${width}.png` });
    assert.equal(await page.locator('.header-customize').count(), 1);
    assert.equal(await page.locator('.header-github').count(), 1);
    if (width === 1305) {
      const handle = await page.locator('.docs-sidebar-resize').boundingBox();
      await page.mouse.move(handle.x, handle.y + 100);
      await page.mouse.down();
      await page.mouse.move(handle.x + 60, handle.y + 100, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.desktop-sidebar').getBoundingClientRect().width > 290);
    }
    const shared = await headerGeometry(page);
    for (const path of ['/blog', '/ecosystem']) {
      await page.locator(`.site-navigation a[href="${path}"]`).click();
      await page.waitForURL(`**${path}`);
      assertSameHeader(await headerGeometry(page), shared, path);
      assert.equal(await language.count(), 1, 'non-docs routes retain language access');
      await assertLanguagePosition(page);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.locator('.site-navigation a[href="/docs/getting-started"]').click();
    await page.locator('.page-heading').waitFor();
    assertSameHeader(await headerGeometry(page), shared, 'return to docs');
    if (width > 768) {
      const sidebar = await page.locator('.desktop-sidebar').boundingBox();
      assert(Math.abs(sidebar.width - shared['.inkra-layout__header-sidebar'].width) < 1, 'resized column survives route changes');
      await page.locator('.app-header .brand').click();
      await page.waitForURL(base + '/');
      assertSameHeader(await headerGeometry(page), shared, 'return to home');
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS home language menu, persistence, keyboard, isolated drawer and grouped home/docs actions: ${width}px`);
  }
} finally { await browser.close(); }
