import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  for (const width of [1305, 1024, 800, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/button#preview');
    await page.waitForURL('**/docs/components/button#preview');
    await page.locator('.page-heading__actions').waitFor();
    const nav = page.getByRole('navigation', { name: '主导航', exact: true });
    assert.equal(await nav.getByRole('link', { name: '文档', exact: true }).getAttribute('data-state'), 'active');
    if (width > 768) {
      const line = page.locator('.header-brand-divider');
      const head = await line.boundingBox();
      const side = await page.locator('.desktop-sidebar > .sidebar-divider').boundingBox();
      assert(Math.abs(head.x - side.x) < 1, 'Brand divider and sidebar share an axis');
      assert(head.height === 32, 'Vertical header line has an explicit height');
      await page.waitForFunction(() => {
        const canvas = document.querySelector('.header-brand-divider');
        const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        const rows = new Set();
        data.forEach((alpha, index) => { if (index % 4 === 3 && alpha > 20) rows.add(Math.floor(index / 4 / canvas.width)); });
        return rows.size > 20;
      });
      assert(await page.locator('.desktop-sidebar .side-navigation__groups').evaluate(node => {
        node.scrollLeft = 100;
        return node.scrollWidth <= node.clientWidth && node.scrollLeft === 0;
      }), 'Sidebar never scrolls horizontally');
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
    await page.getByRole('button', { name: '更多页面操作', exact: true }).click();
    await page.getByRole('menuitem', { name: '查看 Markdown', exact: true }).click();
    const markdown = page.getByRole('dialog', { name: 'Button · Markdown', exact: true });
    await markdown.waitFor();
    assert.match(await markdown.locator('pre').textContent(), /# Button/);
    await markdown.getByRole('button', { name: '关闭', exact: true }).click();
    await markdown.waitFor({ state: 'hidden' });
    await page.locator('.brand').click();
    await page.waitForURL('http://127.0.0.1:4180/');
    assert.equal(await page.locator('.desktop-sidebar').count(), 0);
    assert.equal(await page.locator('#main-content h1').innerText(), 'Inkra');
    await page.getByRole('region', { name: '组件示例', exact: true }).waitFor();
    await nav.getByRole('link', { name: '博客', exact: true }).click();
    await page.waitForURL('**/blog');
    await nav.getByRole('link', { name: '生态', exact: true }).click();
    await page.waitForURL('**/ecosystem');
    await nav.getByRole('link', { name: '文档', exact: true }).click();
    await page.waitForURL('**/docs/getting-started');
    await page.goBack();
    await page.waitForURL('**/ecosystem');
    await page.goForward();
    await page.waitForURL('**/docs/getting-started');
    await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'en'));
    await page.reload();
    await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No English overflow at ${width}`);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `/tmp/inkra-docs-shell-${width}.png` });
    await page.close();
    console.log(`PASS shell ${width}px: routes, divider, navigation, overflow, Markdown and English`);
  }
} finally { await browser.close(); }
