import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
try {
  for (const width of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/docs/components/layout#preview');
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const root = frame.locator('.layout-notebook');
    await root.waitFor();
    await root.evaluate(node => { node.dataset.pickerIdentity = 'preserved'; });
    for (const [mode, label] of [['page', '全页面导航'], ['drawer', '覆盖抽屉'], ['push', '推开页面'], ['push-full', '整页推开']]) {
      await showPreview(playground);
      await playground.getByRole('radio', { name: '1024', exact: true }).check();
      await setControls(playground, true);
      await playground.locator('.property-tabs').getByRole('tab', { name: '移动端', exact: true }).click();
      const option = playground.getByRole('radio', { name: label, exact: true });
      await option.focus();
      await option.press('Space');
      assert.equal(await playground.locator('.layout-viewport__canvas').getAttribute('data-preview-width'), '390');
      assert.equal(await root.getAttribute('data-navigation-open'), 'true');
      assert.equal(await root.getAttribute('data-mobile-navigation'), mode);
      assert.equal(await root.getAttribute('data-picker-identity'), 'preserved', 'preview is not remounted');
      assert(await option.evaluate(node => node === document.activeElement), 'selection does not steal keyboard focus');
      const diagram = playground.locator('.mobile-navigation-diagram[data-mode="' + mode + '"]');
      const motion = await diagram.evaluate(node => {
        const moving = node.querySelector(node.dataset.mode.startsWith('push') ? '.mobile-navigation-diagram__page' : '.mobile-navigation-diagram__sidebar');
        const stationary = node.querySelector(node.dataset.mode.startsWith('push') ? '.mobile-navigation-diagram__sidebar' : '.mobile-navigation-diagram__page');
        const animation = moving.getAnimations()[0];
        if (!animation) return null;
        animation.pause();
        animation.currentTime = 0;
        const start = moving.getBoundingClientRect().x;
        const fixed = stationary.getBoundingClientRect().x;
        animation.currentTime = 800;
        const middle = moving.getBoundingClientRect().x;
        animation.currentTime = 1800;
        return { start, middle, end: moving.getBoundingClientRect().x, fixed, fixedEnd: stationary.getBoundingClientRect().x };
      });
      assert(motion, 'selected option animates the relevant layer');
      assert(Math.abs(motion.start - motion.middle) > 2 && Math.abs(motion.middle - motion.end) > 2);
      assert.equal(motion.fixed, motion.fixedEnd, 'the other layer stays stationary');
    }
    await page.screenshot({ path: '/tmp/inkra-layout-picker-' + width + '.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await playground.locator('.mobile-navigation-diagram').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations({ subtree: true })).length), 0);
    await showPreview(playground);
    assert.equal(await root.getAttribute('data-navigation-open'), 'true');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log('PASS picker animation, reduced motion, mobile preview, focus and stable nodes at ' + width);
    await page.close();
  }
} finally {
  await browser.close();
}
