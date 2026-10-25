import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(base + '/docs/components/layout#preview');
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const root = frame.locator('.layout-notebook');
    await root.waitFor();
    assert.equal(await playground.locator('.layout-viewport__toolbar > button').count(), 0, 'actual-size toggle is removed');
    assert.equal(await playground.locator('.layout-viewport__dimensions').count(), 0, 'zoom metadata is removed');
    const sizes = await playground.locator('.layout-viewport__toolbar').evaluate(node => {
      const box = node.getBoundingClientRect();
      const frame = node.querySelector('.inkra-radio-group__frame').getBoundingClientRect();
      return { width: box.width, frameWidth: frame.width, items: [...node.querySelectorAll('.inkra-radio-group__item')].map(item => item.getBoundingClientRect().width) };
    });
    assert(Math.abs(sizes.width - sizes.frameWidth) < 1, 'size selector fills toolbar width');
    assert.equal(sizes.items.length, 4);
    assert(Math.max(...sizes.items) - Math.min(...sizes.items) < 1, 'four equal-width segments');
    for (const value of ['390', '768', '1024', '1920']) {
      await playground.getByRole('radio', { name: value, exact: true }).check();
      await page.waitForTimeout(120);
      const fit = await playground.locator('.layout-viewport__scroll').evaluate(node => ({
        width: node.clientWidth, scroll: node.scrollWidth,
        height: node.getBoundingClientRect().height,
        frameHeight: node.querySelector('iframe').getBoundingClientRect().height,
      }));
      assert(fit.scroll <= fit.width + 1, 'all widths stay automatically fitted');
      assert(Math.abs(fit.height - fit.frameHeight) < 1, 'preview fills available height');
    }
    for (const layout of ['顶部通栏', '侧栏通高', '右侧通高']) {
      await setControls(playground, true);
      await playground.locator('.property-tabs').getByRole('tab', { name: '布局', exact: true }).click();
      await playground.getByRole('radio', { name: layout, exact: true }).check();
      await showPreview(playground);
      for (const previewWidth of ['1024', '390']) {
        await playground.getByRole('radio', { name: previewWidth, exact: true }).check();
        if (await root.getAttribute('data-navigation-open') === 'true') await frame.locator('[data-sidebar-toggle]').click();
        for (const dir of ['ltr', 'rtl']) {
          await frame.locator('html').evaluate((node, dir) => { node.dir = dir; }, dir);
          const geometry = await root.evaluate(node => {
            const header = node.querySelector('.layout-notebook__header');
            const content = node.querySelector('.layout-notebook__content');
            const box = content.getBoundingClientRect();
            const style = getComputedStyle(content);
            const start = header.querySelector('.layout-notebook__header-leading .docs-pencil-icon').getBoundingClientRect();
            const actions = [...header.querySelectorAll('.layout-notebook__header-actions > button')];
            const end = actions.at(-1).querySelector('.inkra-button__content').getBoundingClientRect();
            const rtl = style.direction === 'rtl';
            const buttons = [...header.querySelectorAll('button')].map(button => {
              const bounds = button.getBoundingClientRect();
              return { width: bounds.width, height: bounds.height, left: bounds.left, right: bounds.right };
            });
            return {
              start: rtl ? start.right : start.left, end: rtl ? end.left : end.right,
              expectedStart: rtl ? box.right - parseFloat(style.paddingRight) : box.left + parseFloat(style.paddingLeft),
              expectedEnd: rtl ? box.left + parseFloat(style.paddingLeft) : box.right - parseFloat(style.paddingRight),
              buttons, root: node.getBoundingClientRect().toJSON(),
            };
          });
          assert(Math.abs(geometry.start - geometry.expectedStart) < 1, layout + ': leading glyph aligns with content ' + JSON.stringify(geometry));
          assert(Math.abs(geometry.end - geometry.expectedEnd) < 1, layout + ': trailing label/glyph aligns with content');
          assert(geometry.buttons.every(button => button.width >= 44 && button.height >= 44 && button.left >= geometry.root.left && button.right <= geometry.root.right + 1), 'touch targets remain inside the page');
          const action = frame.locator('.layout-notebook__header-actions > button').first();
          await action.hover();
          const surface = action.locator('.inkra-button__surface');
          assert.equal(await surface.locator(':scope > .inkra-pencil-surface__border').evaluate(node => getComputedStyle(node).display), 'none');
          await page.waitForFunction(node => node.ownerDocument.defaultView.getComputedStyle(node).opacity === '1', await surface.locator(':scope > .inkra-pencil-surface__ink').elementHandle());
          await action.focus();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          assert.equal(await action.locator('.inkra-button__focus-ring').evaluate(node => getComputedStyle(node).opacity), '1', 'keyboard focus stays visible');
        }
        await frame.locator('html').evaluate(node => { node.dir = 'ltr'; });
      }
    }
    await playground.screenshot({ path: '/tmp/inkra-layout-toolbar-' + width + '.png', animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS toolbar edges, touch bounds, ghost feedback and RTL at ' + width);
    await page.close();
  }
} finally {
  await browser.close();
}
