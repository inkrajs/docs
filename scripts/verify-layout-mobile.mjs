import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import ts from 'typescript';
import { readCode, setControls, showPreview } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const width of [1543, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/layout#preview`);
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const root = frame.locator('.layout-notebook');
    const sidebar = frame.locator('.layout-notebook__sidebar');
    const toggle = frame.locator('[data-sidebar-toggle]');
    const content = frame.locator('.layout-notebook__content');
    await root.waitFor();
    await playground.getByRole('radio', { name: '390', exact: true }).check();
    const settings = async group => {
      await setControls(playground, true);
      await playground.locator('.property-tabs').getByRole('tab', { name: group, exact: true }).click();
    };
    const geometry = () => root.evaluate(node => {
      const rect = selector => (selector ? node.querySelector(selector) : node).getBoundingClientRect().toJSON();
      return { root: rect(), sidebar: rect('.layout-notebook__sidebar'), content: rect('.layout-notebook__content'), header: rect('.layout-notebook__header') };
    });
    for (const layout of ['顶部通栏', '侧栏通高', '分区页头', '右侧通高']) {
      await settings('布局');
      await playground.getByRole('radio', { name: layout, exact: true }).check();
      for (const [mode, label] of [['drawer', '覆盖抽屉'], ['page', '全页面导航'], ['push', '推开页面'], ['push-full', '整页推开']]) {
        await settings('移动端');
        assert.equal(await playground.locator('.mobile-navigation-picker .mobile-navigation-diagram').count(), 4, 'each navigation mode has a diagram');
        await playground.getByRole('radio', { name: label, exact: true }).check();
        const backdrop = playground.getByRole('switch', { name: '内容遮罩', exact: true });
        assert.equal(await backdrop.isChecked(), mode === 'drawer', 'push modes have no dimming by default');
        assert.equal(await backdrop.isDisabled(), mode === 'page' || mode === 'push-full', 'full-screen navigation has no exposed backdrop');
        await showPreview(playground);
        if (await sidebar.isVisible()) await toggle.press('Escape');
        assert(await sidebar.isHidden());
        const before = await geometry();
        await toggle.click();
        const opened = await geometry();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert(await content.evaluate(node => node.inert));
        assert(await frame.locator('.layout-notebook__header').evaluate(node => node.inert));
        if (mode !== 'drawer' || layout !== '顶部通栏') {
          assert(Math.abs(opened.sidebar.y - opened.root.y) < 1, 'sectional or full-page navigation starts at the top');
          assert.equal(await sidebar.locator('.layout-notebook__sidebar-heading').count(), 1);
        }
        if (layout.includes('通高') || mode !== 'drawer') {
          assert(Math.abs(opened.sidebar.bottom - opened.root.bottom) < 1, 'full-height navigation reaches the bottom');
        }
        if (mode === 'page' || mode === 'push-full') assert(Math.abs(opened.sidebar.width - opened.root.width) < 1, 'full-page navigation uses all available width');
        if (mode.startsWith('push')) {
          const offset = (layout === '右侧通高' ? -1 : 1) * opened.sidebar.width;
          assert(Math.abs(opened.content.x - before.content.x - offset) < 1, 'push mode moves the content by the sidebar width');
          assert(Math.abs(opened.header.x - before.header.x - offset) < 1, 'push mode also moves the header');
        } else assert.deepEqual(opened.content, before.content, 'overlay modes leave the page geometry unchanged');
        const background = await frame.locator('.layout-notebook__dismiss').evaluate(node => getComputedStyle(node).backgroundColor);
        if (mode.startsWith('push')) assert.equal(background, 'rgba(0, 0, 0, 0)', 'no dark wash over pushed content');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (layout === '侧栏通高') await playground.screenshot({ path: `/tmp/inkra-mobile-${mode}-${width}.png` });
        await toggle.press('Escape');
        assert(await sidebar.isHidden());
        assert.deepEqual((await geometry()).content, before.content);
        assert(await toggle.evaluate(node => node === node.ownerDocument.activeElement));
        if (width === 1543 && layout === '顶部通栏') {
          const code = await readCode(playground);
          const parsed = ts.createSourceFile('mobile-layout.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
          assert.equal(parsed.parseDiagnostics.length, 0, `${mode}: copied code parses`);
          assert(code.includes(`data-mobile-navigation="${mode}"`), 'copied code follows the selected mode');
          assert(code.includes(`background: ${mode === 'drawer' ? 'var(--inkra-overlay)' : 'transparent'}; border: 0`), 'copied code follows the selected backdrop');
        }
      }
    }
    await settings('移动端');
    await playground.getByRole('radio', { name: '推开页面', exact: true }).check();
    await playground.getByRole('switch', { name: '内容遮罩', exact: true }).check();
    await page.screenshot({ path: `/tmp/inkra-mobile-navigation-picker-${width}.png` });
    await showPreview(playground);
    if (await sidebar.isVisible()) await toggle.press('Escape');
    await toggle.click();
    assert.notEqual(await frame.locator('.layout-notebook__dismiss').evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)', 'backdrop can be explicitly enabled');
    await frame.locator('.layout-notebook__dismiss').click();
    assert(await sidebar.isHidden(), 'clicking the exposed page closes navigation');
    await settings('移动端');
    await playground.getByRole('switch', { name: '内容遮罩', exact: true }).uncheck();
    await showPreview(playground);
    await frame.locator('html').evaluate(node => { node.dir = 'rtl'; });
    const beforeRtl = await geometry();
    await toggle.click();
    const afterRtl = await geometry();
    assert(Math.abs(afterRtl.content.x - beforeRtl.content.x - afterRtl.sidebar.width) < 1, 'right navigation pushes in the mirrored RTL direction');
    await toggle.press('Escape');
    assert.deepEqual(errors, []);
    console.log(`PASS mobile layout identity, overlay/full-page/push, focus, RTL and settings groups at ${width}px`);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1543, height: 954 }, reducedMotion: 'no-preference' });
  await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
  await page.goto(`${base}/docs/components/layout#preview`);
  const playground = page.locator('.component-playground');
  const frame = page.frameLocator('.layout-viewport__canvas');
  const root = frame.locator('.layout-notebook');
  await root.waitFor();
  await playground.getByRole('radio', { name: '390', exact: true }).check();
  await setControls(playground, true);
  await playground.locator('.property-tabs').getByRole('tab', { name: '移动端', exact: true }).click();
  await playground.getByRole('radio', { name: '推开页面', exact: true }).check();
  await showPreview(playground);
  const checkMotion = async open => root.evaluate(async (node, open) => {
    const x = () => node.querySelector('.layout-notebook__content').getBoundingClientRect().x;
    const before = x();
    node.querySelector('[data-sidebar-toggle]').click();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const animations = node.ownerDocument.getAnimations();
    for (const animation of animations) { animation.pause(); animation.currentTime = 90; }
    const middle = x();
    const sidebar = node.querySelector('.layout-notebook__sidebar:not(.layout-notebook__motion-copy)');
    const sidebarAnimated = sidebar.getAnimations().length > 0;
    for (const animation of animations) animation.finish();
    await new Promise(resolve => requestAnimationFrame(resolve));
    return { before, middle, after: x(), count: animations.length, sidebarAnimated, open,
      copies: node.querySelectorAll('.layout-notebook__motion-copy').length };
  }, open);
  for (const mode of ['推开页面', '整页推开']) {
    await setControls(playground, true);
    await playground.getByRole('radio', { name: mode, exact: true }).check();
    await showPreview(playground);
    if (await root.getAttribute('data-navigation-open') === 'true') await frame.locator('[data-sidebar-toggle]').press('Escape');
    for (const open of [true, false]) {
    const result = await checkMotion(open);
    assert(result.count > 0, 'push navigation creates an actual animation');
    assert(Math.abs(result.middle - result.before) > 1 && Math.abs(result.middle - result.after) > 1,
      'page passes through an intermediate position, without an end-frame jump');
    assert(!result.sidebarAnimated, 'push reveals a stationary sidebar rather than sliding an overlay');
    assert.equal(result.copies, 0, 'finished animations clean up sidebar snapshots');
    }
  }
  console.log('PASS mobile push animation intermediate positions and snapshot cleanup');
  await page.close();
} finally {
  await browser.close();
}
