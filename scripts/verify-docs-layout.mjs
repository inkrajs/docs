import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1543, 1024, 800, 768, 430, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(base + '/docs/components/layout#preview');
    await page.locator('.page-heading h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.docs-shell.inkra-layout').count(), 1);
    assert.equal(await page.locator('.docs-shell > .inkra-layout__header[data-shared-sidebar]').count(), 1);
    assert.equal(await page.locator('.docs-layout.inkra-layout__body > .docs-resizable > [data-panel] > .docs-content-panel > main.inkra-layout__content').count(), 1);
    assert.equal(await page.locator('main#main-content').count(), 1);
    assert.equal(await page.locator('.app-header .header-brand-divider').count(), 0, 'no duplicate hand-positioned brand divider');
    assert.equal(await page.locator('.header-action-group > .inkra-pencil-surface').count(), 0, 'header actions have no shared outline');
    assert.equal(await page.locator('.header-customize').getAttribute('data-variant'), 'ghost');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no page overflow at ' + width);
    if (width > 768) {
      assert.equal(await page.locator('.app-header .brand').isVisible(), true);
      const aligned = async () => {
        const geometry = await page.locator('.docs-shell').evaluate(root => {
          const brand = root.querySelector('.inkra-layout__header-sidebar').getBoundingClientRect();
          const headerLine = root.querySelector('.inkra-layout__header-sidebar-divider').getBoundingClientRect();
          const sidebar = root.querySelector('.desktop-sidebar').getBoundingClientRect();
          const sidebarLine = root.querySelector('.desktop-sidebar > .inkra-layout__sidebar-divider').getBoundingClientRect();
          return { brand: brand.right, sidebar: sidebar.right, head: headerLine.x + headerLine.width / 2, side: sidebarLine.x + sidebarLine.width / 2 };
        });
        assert(Math.max(...Object.values(geometry)) - Math.min(...Object.values(geometry)) < 1, 'shared boundary ' + JSON.stringify(geometry));
      };
      await aligned();
      if (width === 1543) {
        const handle = page.locator('.docs-sidebar-resize');
        const sidebarWidth = async () => (await page.locator('.desktop-sidebar').boundingBox()).width;
        const drag = async delta => {
          const box = await handle.boundingBox();
          await page.mouse.move(box.x, box.y + 180);
          await page.mouse.down();
          await page.mouse.move(box.x + delta, box.y + 180, { steps: 12 });
          await page.mouse.up();
          await page.waitForTimeout(100);
          await aligned();
        };
        const initial = await sidebarWidth();
        await drag(60);
        assert(Math.abs(await sidebarWidth() - initial - 60) < 2, 'pointer resizes navigation and brand together');
        await handle.focus();
        const beforeKey = await sidebarWidth();
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(100);
        assert(await sidebarWidth() < beforeKey, 'keyboard adjusts sidebar');
        await aligned();
        await drag(1000);
        assert(Math.abs(await sidebarWidth() - 360) < 2, 'maximum width');
        await drag(-1000);
        assert(Math.abs(await sidebarWidth() - 200) < 2, 'minimum width');
        await drag(80);
        await page.setViewportSize({ width: 390, height: 954 });
        await page.waitForTimeout(150);
        assert.equal(await handle.isVisible(), false, 'no desktop resize handle on mobile');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.setViewportSize({ width, height: 954 });
        await page.waitForTimeout(150);
        assert(Math.abs(await sidebarWidth() - 280) < 2, 'desktop width survives a mobile round trip');
        await aligned();
        await drag(20);
      }
      await page.evaluate(() => scrollTo(0, 600));
      await page.waitForTimeout(100);
      const sticky = await page.locator('.desktop-sidebar').boundingBox();
      const header = await page.locator('.app-header').boundingBox();
      assert(Math.abs(header.y) < 1 && Math.abs(sticky.y - header.height) < 1, 'header and sidebar stay sticky without overlap');
      const resizeBox = await page.locator('.docs-sidebar-resize').boundingBox();
      assert(Math.abs(resizeBox.y - header.height) < 1 && Math.abs(resizeBox.height - sticky.height) < 1, 'resize target stays alongside the visible sticky sidebar');
      await page.evaluate(() => scrollTo(0, 0));
    } else {
      assert.equal(await page.locator('.app-header .brand').isVisible(), false, 'mobile header replaces the brand with navigation');
      const menuBox = await page.locator('.menu-button').boundingBox();
      const navBox = await page.locator('.site-navigation').boundingBox();
      const actionsBox = await page.locator('.header-action-group').boundingBox();
      assert(Math.abs(menuBox.y - navBox.y) < 1 && Math.abs(actionsBox.y - navBox.y) < 1, 'menu, tabs and actions share the first row');
      assert(menuBox.x + menuBox.width <= navBox.x && navBox.x + navBox.width <= actionsBox.x, 'header controls do not overlap');
      assert.equal(await page.locator('.header-search').isVisible(), false, 'mobile search does not occupy a header row');
      assert((await page.locator('.app-header').boundingBox()).height < 80, 'mobile header has only one row');
      assert.equal(await page.locator('.desktop-sidebar').isVisible(), false);
      assert.equal(await page.locator('.inkra-layout__header-sidebar-divider').first().isVisible(), false);
      await page.getByRole('button', { name: '打开文档目录', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '文档目录', exact: true });
      await dialog.waitFor();
      assert(await dialog.evaluate(node => !node.closest('[inert]')), 'drawer is outside inert layout');
      const box = await dialog.boundingBox();
      assert(Math.abs(box.y) < 1 && Math.abs(box.height - 954) < 1, 'drawer is viewport-fixed, not rooted in Layout containment');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.classList.contains('menu-button'));
      assert.equal(await page.getByRole('button', { name: '打开文档目录', exact: true }).evaluate(node => node === document.activeElement), true);
    }
    if (width <= 768) await page.locator('.mobile-search-trigger').click();
    const search = page.getByRole('combobox', { name: '搜索文档', exact: true });
    await search.fill('Button');
    await page.getByRole('option').first().waitFor();
    await search.fill('');
    await search.press('Escape');
    if (width <= 768) {
      await page.getByRole('dialog', { name: '搜索文档', exact: true }).waitFor({ state: 'hidden' });
      assert(await page.locator('.mobile-search-trigger').evaluate(node => node === document.activeElement));
    }
    await page.locator('.header-customize').click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.screenshot({ path: '/tmp/inkra-docs-layout-' + width + '.png', animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS actual Layout shell, alignment, scrolling and controls at ' + width);
    await page.close();
  }
} finally {
  await browser.close();
}
