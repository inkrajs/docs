import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale] of [[1305, 'zh-CN'], [390, 'zh-CN'], [320, 'en']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    for (const component of ['stack', 'flex', 'grid', 'container', 'layout']) {
      await page.goto(`${base}/docs/components/${component}#preview`);
      await page.locator('.component-playground').waitFor();
      assert.equal(await page.locator('.component-examples > .layout-examples > :first-child').getAttribute('class'), 'inkra-pencil-surface inkra-pencil-surface--paper playground component-playground');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${component} overflow at ${width}`);
      if (width > 1024) {
        const display = await page.locator('.component-playground .preview-display').boundingBox();
        const controls = await page.locator('.component-playground .preview-controls').boundingBox();
        assert(Math.abs(display.width - controls.width * 2) < 1, 'preview and controls use a 2:1 split');
      }
      const stage = page.locator('.component-playground .preview-stage');
      const startsInside = await stage.evaluate(node => {
        const content = node.firstElementChild.getBoundingClientRect();
        return content.top >= node.getBoundingClientRect().top;
      });
      assert(startsInside, `${component} preview starts within scrollable area at ${width}`);
      if (component === 'container') {
        const heading = await stage.locator('h3').boundingBox();
        const paragraph = await stage.locator('p').boundingBox();
        assert(paragraph.y >= heading.y + heading.height, 'container title and body occupy separate rows');
      }
      await page.screenshot({ path: `/tmp/inkra-layout-${component}-${width}.png` });
      await page.getByRole('tab', { name: 'API', exact: true }).click();
      assert.equal(await page.locator('.docs-api-table th').count(), 3);
      assert(await page.locator('.docs-api-table tbody tr').count() >= 5);
      assert.equal(await page.locator('.component-api h2').count(), 0, 'API tab does not repeat its title');
      await page.locator('.page-tabs [role="tab"]').last().click();
      assert.equal(await page.locator('.component-api h2').count(), 0, 'accessibility tab does not repeat its title');
      assert(await page.locator('.component-api p').textContent());
    }
    await page.goto(`${base}/docs/components/layout#preview`);
    const preview = page.locator('.component-playground .preview-stage');
    const notebook = page.frameLocator('.layout-viewport__canvas');
    await notebook.locator('.layout-notebook').waitFor();
    for (const preset of ['390', '768', '1024', '1920']) {
      await preview.getByRole('radio', { name: preset, exact: true }).check();
      const canvas = preview.locator('.layout-viewport__canvas');
      assert.equal(await canvas.evaluate(node => node.offsetWidth), Number(preset), 'preset sets actual container pixels');
      assert.equal(await notebook.locator('.layout-notebook > .inkra-layout__body').evaluate(node => getComputedStyle(node).flexDirection), preset === '390' ? 'column' : 'row');
      await page.waitForFunction(() => {
        const extent = document.querySelector('.layout-viewport__extent').getBoundingClientRect();
        const content = document.querySelector('.layout-viewport__canvas').getBoundingClientRect();
        return Math.abs(extent.height - content.height) < 2;
      });
      assert(await preview.locator('.layout-viewport__scroll').evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'fit mode has no horizontal overflow');
      await notebook.locator('.layout-notebook').evaluate(async node => { await node.ownerDocument.fonts.ready; });
      await page.screenshot({ path: `/tmp/inkra-layout-revised-${width}-${preset}.png`, animations: 'disabled' });
    }
    await preview.getByRole('button', { name: locale === 'en' ? 'Actual size' : '原尺寸查看', exact: true }).click();
    assert.match(await preview.locator('.layout-viewport__dimensions').textContent(), /100%/);
    await preview.getByRole('button', { name: locale === 'en' ? 'Fit to preview' : '适应窗口', exact: true }).click();
    await notebook.getByRole('button', { name: locale === 'en' ? 'New note' : '新建笔记', exact: true }).click();
    assert.equal(await notebook.locator('.layout-notebook__note').count(), 4);
    await notebook.getByRole('button', { name: locale === 'en' ? 'Favorites' : '收藏', exact: true }).click();
    assert.equal(await notebook.locator('.layout-notebook__content h3').count(), 0, 'content does not repeat the navigation title');
    assert.equal(await notebook.getByRole('button', { name: locale === 'en' ? 'Favorites' : '收藏', exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(await notebook.locator('.layout-notebook__note').count(), 1, 'favorites filters actual note content');
    await notebook.locator('.layout-notebook__note button').click();
    assert.equal(await notebook.locator('.layout-notebook__note').count(), 0);
    await page.evaluate(async () => {
      const { React: R, ReactDOM, ReactDOMClient, Container, Flex, Grid, Layout } = await import('/scripts/fixtures/layout.mjs');
      const host = document.createElement('div');
      host.id = 'layout-fixture';
      host.style.width = '100%';
      document.querySelector('#root').style.display = 'none';
      document.body.prepend(host);
      const h = R.createElement;
      const root = ReactDOMClient.createRoot(host);
      window.renderLayoutFixture = width => ReactDOM.flushSync(() => root.render(h('div', { style: { width, maxWidth: '100%' } },
        h(Container, { id: 'bounded', size: 'sm', padding: 5 }, 'Container'),
        h(Flex, { id: 'rtl', dir: 'rtl', gap: 2 }, h('span', null, 'One'), h('span', null, 'Two')),
        h(Grid, { id: 'grid', columns: { base: 1, sm: 2, lg: 3 }, gap: 2 }, ...Array.from({ length: 6 }, (_, i) => h('span', { key: i }, 'Cell ' + i))),
        h(Layout.Root, { id: 'layout', collapseAt: 'sm' }, h(Layout.Body, null,
          h(Layout.Sidebar, { width: 180, divided: true }, 'Sidebar'),
          h(Layout.Content, null, 'Content'))))));
      window.renderLayoutFixture(900);
    });
    const measure = () => page.evaluate(() => {
      const sidebar = document.querySelector('#layout .inkra-layout__sidebar').getBoundingClientRect();
      const content = document.querySelector('#layout .inkra-layout__content').getBoundingClientRect();
      const rtl = [...document.querySelectorAll('#rtl > span')].map(node => node.getBoundingClientRect().left);
      return { columns: getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.split(' ').length,
        containerWidth: document.querySelector('#bounded').getBoundingClientRect().width,
        sidebar: { x: sidebar.x, y: sidebar.y, width: sidebar.width, height: sidebar.height },
        content: { x: content.x, y: content.y }, rtl };
    });
    let result = await measure();
    assert.equal(result.columns, width >= 1024 ? 3 : 1);
    assert(result.containerWidth <= Math.min(640, width));
    assert(result.rtl[0] > result.rtl[1], 'logical direction follows RTL');
    if (width >= 1024) {
      assert.equal(result.sidebar.y, result.content.y, 'wide layout uses a sidebar row');
      assert.equal(result.sidebar.width, 180);
    }
    await page.evaluate(() => window.renderLayoutFixture(300));
    result = await measure();
    assert(result.content.y >= result.sidebar.y + result.sidebar.height, 'narrow container stacks without relying on viewport width');
    assert.equal(result.sidebar.width, 300);
    assert.deepEqual(errors, []);
    console.log(`PASS layout routes, API, composition, responsive grid/container and RTL at ${width}px`);
    await page.close();
  }
} finally { await browser.close(); }
