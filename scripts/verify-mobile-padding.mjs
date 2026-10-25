import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readCode, setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const padding = locator => locator.evaluate(node => {
  const style = getComputedStyle(node);
  return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
});
const expectPadding = async (locator, size) => assert.deepEqual(await padding(locator), Array(4).fill(size + 'px'));
try {
  for (const width of [1543, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    for (const route of ['design-standard', 'components/button', 'components/grid', 'components/layout']) {
      await page.goto(base + '/docs/' + route + '#preview');
      const article = page.locator('.documentation');
      await article.waitFor();
      await expectPadding(article, width <= 480 ? 12 : 20);
      if (route === 'design-standard') continue;
      const playground = page.locator('.component-playground').first();
      await playground.waitFor();
      if (await playground.locator('.playground-config-toggle').count()) await showPreview(playground);
      if (width <= 480) {
        await expectPadding(playground.locator('.preview-stage'), 12);
        await expectPadding(playground.locator('.preview-controls'), 12);
        const example = page.locator('.component-example').first();
        await expectPadding(example.locator('.component-example__header'), 12);
        await expectPadding(example.locator('.component-example__preview'), 12);
      }
      if (route === 'components/layout') {
        const frame = page.frameLocator('.layout-viewport__canvas');
        const root = frame.locator('.layout-notebook');
        await root.waitFor();
        for (const previewWidth of ['1024', '390']) {
          await playground.getByRole('radio', { name: previewWidth, exact: true }).check();
          const inset = previewWidth === '390' ? 12 : 20;
          await expectPadding(frame.locator('.layout-notebook__header'), inset);
          await expectPadding(frame.locator('.layout-notebook__content'), inset);
          await expectPadding(root.locator('.inkra-layout__footer'), inset);
        }
        await setControls(playground, true);
        await playground.locator('.property-tabs').getByRole('tab', { name: '布局', exact: true }).click();
        await playground.getByRole('radio', { name: '侧栏通高', exact: true }).check();
        await showPreview(playground);
        await frame.locator('[data-sidebar-toggle]').click();
        await expectPadding(frame.locator('.layout-notebook__sidebar-heading'), 12);
        await expectPadding(frame.locator('.layout-notebook__navigation'), 12);
        const metrics = await root.evaluate(node => {
          const heading = node.querySelector('.layout-notebook__sidebar-heading');
          const icon = heading.querySelector('canvas').getBoundingClientRect();
          const buttons = [...node.querySelectorAll('.layout-notebook__navigation-list > button')];
          return {
            height: heading.getBoundingClientRect().height,
            rows: buttons.map(button => ({
              height: button.getBoundingClientRect().height,
              width: button.getBoundingClientRect().width,
              offset: button.querySelector('.inkra-button__icon').getBoundingClientRect().x - icon.x,
            })),
          };
        });
        assert(metrics.height >= 68);
        assert(metrics.rows.every(row => row.height >= 44 && row.width >= 44 && Math.abs(row.offset) < 1));
        await playground.screenshot({ path: '/tmp/inkra-mobile-padding-layout-' + width + '.png' });
        await frame.locator('[data-sidebar-toggle]').press('Escape');
        const code = await readCode(playground);
        assert(code.includes('padding={compact ? 3 : 5}'));
        assert(code.includes("padding={compact ? 'sm' : 'md'}"));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ': no page overflow');
    }
    assert.deepEqual(errors, []);
    console.log('PASS mobile padding, desktop preservation, compact alignment and touch targets at ' + width);
    await page.close();
  }
} finally {
  await browser.close();
}
