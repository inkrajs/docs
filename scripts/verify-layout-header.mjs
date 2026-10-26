import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const [width, locale, theme] of [[1543, 'zh-CN', 'light'], [390, 'en', 'dark'], [320, 'zh-CN', 'light']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    await page.goto(base + '/docs/components/layout#preview');
    const zh = locale === 'zh-CN';
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const header = frame.locator('.layout-notebook__header');
    await header.waitFor();
    const path = async option => {
      await setControls(playground, true);
      await playground.locator('.property-tabs').getByRole('tab', { name: zh ? '内容' : 'Content', exact: true }).click();
      await chooseDocsOption(playground, zh ? '页头路径' : 'Header path', option, { exact: true, optionExact: true });
      await showPreview(playground);
    };
    const metrics = () => header.evaluate(node => {
      const rect = element => {
        const { x, y, width, height, right } = element.getBoundingClientRect();
        return { x, y, width, height, right };
      };
      const items = [...node.querySelectorAll('.inkra-breadcrumb__item')];
      return {
        header: rect(node), icon: rect(node.querySelector('.layout-notebook__header-title > canvas')),
        actions: rect(node.querySelector('.layout-notebook__header-actions')),
        location: rect(node.querySelector('.layout-notebook__header-location')),
        labels: items.map(item => {
          const source = item.querySelector('.inkra-pencil-text__source');
          const range = node.ownerDocument.createRange();
          range.selectNodeContents(source);
          return { ...rect(range), font: getComputedStyle(source).fontSize, line: getComputedStyle(source).lineHeight };
        }),
      };
    });
    const equalPosition = (a, b, label) => {
      for (const key of ['x', 'y', 'height']) assert(Math.abs(a[key] - b[key]) < 1, label + ': ' + key + ' ' + JSON.stringify({ a, b }));
      assert.equal(a.font, b.font, label + ': font');
      assert.equal(a.line, b.line, label + ': line height');
    };
    await page.evaluate(() => document.fonts.ready);
    const simple = await metrics();
    await path(zh ? '二级页面' : 'Section page');
    const section = await metrics();
    equalPosition(simple.labels[0], section.labels[0], 'first-level page/link has stable metrics');
    await path(zh ? '长路径' : 'Long path');
    const long = await metrics();
    equalPosition(section.labels[0], long.labels[0], 'first-level stays fixed for long paths');
    equalPosition(section.labels[1], long.labels[1], 'second-level page/link has stable metrics');
    assert.deepEqual(long.actions, simple.actions, 'long paths do not move header actions');
    assert.deepEqual(long.icon, simple.icon, 'long paths do not move the title icon');
    assert(long.location.right <= long.actions.x, 'title overflow is isolated from actions');
    const overflow = await frame.locator('.layout-notebook__header-location').evaluate(node => ({
      width: node.clientWidth, scroll: node.scrollWidth,
      overflow: getComputedStyle(node).overflowX,
    }));
    assert(overflow.width > 0 && overflow.overflow === 'auto', 'long path remains available in a local scroll region ' + JSON.stringify(overflow));
    await playground.screenshot({ path: '/tmp/inkra-layout-long-path-' + width + '.png', animations: 'disabled' });
    const firstLink = header.locator('.inkra-breadcrumb__link').first();
    await firstLink.hover();
    const hovered = await metrics();
    equalPosition(long.labels[0], hovered.labels[0], 'hover does not lift the breadcrumb label');
    await firstLink.click();
    assert.equal(await header.locator('.inkra-breadcrumb__item').count(), 1, 'ancestor link changes the header path');
    const action = header.getByRole('button', { name: zh ? '新建笔记' : 'New note', exact: true });
    assert.equal(await action.getAttribute('data-variant'), 'ghost');
    await page.mouse.move(0, 0);
    const ink = action.locator('.inkra-button__surface > .inkra-pencil-surface__ink');
    assert.equal(await ink.evaluate(node => getComputedStyle(node).opacity), '0', 'header action is unframed at rest');
    await action.hover();
    assert.equal(await ink.evaluate(node => getComputedStyle(node).opacity), '1', 'header action gains pencil feedback on hover');
    const count = await frame.locator('.layout-notebook__note').count();
    await action.click();
    assert.equal(await frame.locator('.layout-notebook__note').count(), count + 1);

    await playground.getByRole('radio', { name: '1024', exact: true }).check();
    await setControls(playground, true);
    await playground.locator('.property-tabs').getByRole('tab', { name: zh ? '布局' : 'Layout', exact: true }).click();
    await playground.getByRole('radio', { name: zh ? '侧栏通高' : 'Full-height sidebar', exact: true }).check();
    await showPreview(playground);
    const sidebar = frame.locator('.layout-notebook__sidebar');
    await sidebar.waitFor({ state: 'visible' });
    const geometry = await sidebar.evaluate(node => {
      const headingIcon = node.querySelector('.layout-notebook__sidebar-brand > canvas').getBoundingClientRect();
      return [...node.querySelectorAll('.layout-notebook__navigation-list > button')].map(button => {
        const surface = button.querySelector('.inkra-button__surface');
        const style = getComputedStyle(surface);
        const rect = surface.getBoundingClientRect();
        const icon = button.querySelector('.inkra-button__icon').getBoundingClientRect();
        return {
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat),
          iconOffset: icon.x - headingIcon.x, iconWidth: icon.width,
          leftInset: icon.x - rect.x, topInset: icon.y - rect.y, height: rect.height,
          hitHeight: button.getBoundingClientRect().height,
        };
      });
    });
    assert.equal(geometry.length, 3);
    for (const item of geometry) {
      assert(item.padding.every(value => value === item.padding[0] && value > 0), 'navigation has equal nonzero padding on all sides');
      assert(Math.abs(item.iconOffset) < 1, 'navigation and sidebar heading icons align');
      assert.equal(item.iconWidth, 26);
      assert(Math.abs(item.leftInset - item.topInset) < 1, 'actual icon clearance matches on both axes');
      assert(item.hitHeight >= 44, 'navigation keeps a full touch target');
    }
    assert.equal(await sidebar.locator('[data-sidebar-toggle]').getAttribute('data-variant'), 'ghost');
    assert.equal(await frame.locator('.layout-notebook__content h3').count(), 0, 'content has no duplicate section title');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await playground.screenshot({ path: '/tmp/inkra-layout-header-' + width + '.png', animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS Layout header paths, ghost actions and equal navigation insets at ' + width);
    await page.close();
  }
} finally {
  await browser.close();
}
