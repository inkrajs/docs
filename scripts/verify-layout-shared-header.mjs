import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readCode, setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const viewport of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width: viewport, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(base + '/docs/components/layout#preview');
    const playground = page.locator('.component-playground');
    await setControls(playground, true);
    await playground.locator('.property-tabs').getByRole('tab', { name: '布局', exact: true }).click();
    await playground.getByRole('radio', { name: '品牌与导航分栏', exact: true }).check();
    await showPreview(playground);
    const frame = page.frameLocator('.layout-viewport__canvas');
    const root = frame.locator('.layout-notebook');
    const geometry = () => root.evaluate(node => {
      const brand = node.querySelector('.inkra-layout__header-sidebar').getBoundingClientRect();
      const sidebar = node.querySelector('.layout-notebook__sidebar').getBoundingClientRect();
      const handle = node.querySelector('.layout-notebook__resize').getBoundingClientRect();
      const rtl = getComputedStyle(node).direction === 'rtl';
      return { width: brand.width, sidebarWidth: sidebar.width, boundary: rtl ? brand.left : brand.right,
        sidebarBoundary: rtl ? sidebar.left : sidebar.right, handle: handle.x + handle.width / 2 };
    });
    for (const width of ['768', '1024', '1920']) {
      await playground.getByRole('radio', { name: width, exact: true }).check();
      await page.waitForTimeout(180);
      for (const dir of ['ltr', 'rtl']) {
        await frame.locator('html').evaluate((node, value) => { node.dir = value; }, dir);
        await page.waitForTimeout(100);
        const before = await geometry();
        assert(before.width > 100, JSON.stringify(before));
        assert(Math.abs(before.boundary - before.sidebarBoundary) < 1, 'brand and sidebar share boundary');
        assert(Math.abs(before.boundary - before.handle) < 1, 'divider matches handle');
        const divider = await root.locator('.inkra-layout__header-sidebar-divider').evaluate(node => {
          const box = node.getBoundingClientRect();
          const parent = node.parentElement.getBoundingClientRect();
          const style = getComputedStyle(node);
          const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
          return { center: box.x + box.width / 2, height: box.height, top: box.top - parent.top,
            bottom: parent.bottom - box.bottom, opacity: style.opacity, color: style.color,
            muted: style.getPropertyValue('--inkra-ink-muted').trim(), renderer: node.dataset.renderer,
            painted: pixels.some((value, index) => index % 4 === 3 && value > 0) };
        });
        assert(divider.height <= 32 && divider.top > 0 && Math.abs(divider.top - divider.bottom) < 1, 'header divider is short and vertically centered');
        assert.equal(divider.opacity, '0.56', 'uses Tabs divider opacity');
        assert.equal(divider.renderer, 'inkra-pressure-pencil');
        assert(divider.painted, 'divider contains actual pencil pixels');
        assert(Math.abs(divider.center - before.boundary) < 1, 'inset divider remains on shared boundary');
        const handle = frame.getByRole('separator', { name: '调整侧栏宽度' });
        await handle.focus();
        await handle.press(dir === 'ltr' ? 'ArrowRight' : 'ArrowLeft');
        await page.waitForTimeout(150);
        const after = await geometry();
        assert(Math.abs(after.width - before.width) > 1, 'keyboard resizing changes width');
        assert(Math.abs(after.boundary - after.sidebarBoundary) < 1, 'shared width follows resize');
        await frame.locator('[data-sidebar-toggle]').click();
        await page.waitForTimeout(100);
        assert.equal(await root.getAttribute('data-navigation-open'), 'false');
        assert.equal(await frame.locator('.inkra-layout__header-sidebar').evaluate(node => node.getBoundingClientRect().width), 0);
        assert.equal(await frame.locator('.inkra-layout__header-sidebar').getAttribute('aria-hidden'), 'true');
        await frame.locator('[data-sidebar-toggle]').click();
        await page.waitForTimeout(100);
        assert(Math.abs((await geometry()).width - after.width) < 1, 'expansion restores resized width');
      }
      await frame.locator('html').evaluate(node => { node.dir = 'ltr'; });
    }
    await playground.getByRole('radio', { name: '1024', exact: true }).check();
    await page.waitForTimeout(120);
    const beforeDrag = await geometry();
    const separator = await frame.getByRole('separator', { name: '调整侧栏宽度' }).boundingBox();
    await page.mouse.move(separator.x, separator.y + 80);
    await page.mouse.down();
    await page.mouse.move(separator.x + 35, separator.y + 80, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(120);
    const afterDrag = await geometry();
    assert(Math.abs(afterDrag.width - beforeDrag.width) > 10, 'pointer drag resizes the shared column');
    assert(Math.abs(afterDrag.boundary - afterDrag.sidebarBoundary) < 1, 'pointer drag preserves shared boundary');
    const tabs = frame.locator('.layout-notebook__header-tabs');
    await tabs.getByRole('tab', { name: '草稿', exact: true }).click();
    assert.equal(await frame.locator('.layout-notebook__note').count(), 2, 'tabs update actual content');
    assert.equal(await tabs.getByRole('tab', { name: '草稿', exact: true }).getAttribute('aria-controls'), await frame.locator('.layout-notebook__content [role="tabpanel"]').getAttribute('id'), 'tab and actual panel are associated');
    await tabs.getByRole('tab', { name: '工作区', exact: true }).click();
    assert.equal(await frame.locator('.layout-notebook__note').count(), 3);
    const source = await readCode(playground);
    assert(source.includes('sidebarWidth=') && source.includes('sidebarDivided=') && source.includes('setSharedWidth(size.inPixels)'), 'copyable code uses shared API');
    const themeSamples = [];
    for (const theme of ['dark', 'light']) {
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value;
        document.documentElement.dataset.inkraTheme = value;
      }, theme);
      await page.waitForTimeout(180);
      const ink = await root.locator('.inkra-layout__header-sidebar-divider').evaluate(node => {
        const style = getComputedStyle(node);
        const token = node.ownerDocument.createElement('span');
        token.style.color = 'var(--inkra-ink-muted)';
        node.parentElement.append(token);
        const matchesToken = getComputedStyle(token).color === style.color;
        token.remove();
        const reference = document.createElement('canvas').getContext('2d');
        reference.fillStyle = style.color;
        reference.fillRect(0, 0, 1, 1);
        const expected = [...reference.getImageData(0, 0, 1, 1).data].slice(0, 3);
        const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
        const sums = [0, 0, 0];
        let weight = 0;
        let peakAlpha = 0;
        for (let offset = 3; offset < pixels.length; offset += 4) peakAlpha = Math.max(peakAlpha, pixels[offset]);
        for (let offset = 0; offset < pixels.length; offset += 4) {
          // Near-transparent grain loses RGB precision during canvas compositing.
          if (pixels[offset + 3] < peakAlpha / 2) continue;
          weight += pixels[offset + 3];
          for (let channel = 0; channel < 3; channel++) sums[channel] += pixels[offset + channel] * pixels[offset + 3];
        }
        return { expected, actual: sums.map(sum => sum / weight), weight, peakAlpha, matchesToken };
      });
      assert(ink.matchesToken && ink.weight > 0, theme + ': uses the standard token and paints pencil pixels');
      themeSamples.push(ink.actual.reduce((sum, value) => sum + value, 0) / 3);
    }
    assert(themeSamples[0] > themeSamples[1] + 50, 'theme switching repaints actual ink, not only CSS');
    await page.emulateMedia({ forcedColors: 'active' });
    for (const dir of ['ltr', 'rtl']) {
      await frame.locator('html').evaluate((node, value) => { node.dir = value; }, dir);
      const fallback = await root.locator('.inkra-layout__header-sidebar-divider').evaluate(node => {
        const box = node.getBoundingClientRect();
        return { width: box.width, center: box.x + box.width / 2, opacity: getComputedStyle(node).opacity };
      });
      assert.equal(fallback.width, 1);
      assert.equal(fallback.opacity, '1');
      assert(Math.abs(fallback.center - (await geometry()).boundary) < 1, 'system-color fallback stays centered');
    }
    await frame.locator('html').evaluate(node => { node.dir = 'ltr'; });
    await page.emulateMedia({ forcedColors: 'none' });
    await playground.getByRole('radio', { name: '390', exact: true }).check();
    await page.waitForTimeout(160);
    assert.equal(await frame.locator('.inkra-layout__header-sidebar').count(), 0, 'compact preview keeps accessible drawer navigation');
    await frame.locator('[data-sidebar-toggle]').click();
    assert.equal(await root.getAttribute('data-navigation-open'), 'true');
    await frame.getByRole('button', { name: '收藏', exact: true }).click();
    assert.equal(await root.getAttribute('data-navigation-open'), 'false');
    assert(await root.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'compact root stays bounded');
    await playground.getByRole('radio', { name: viewport === 390 ? '390' : '1024', exact: true }).check();
    await playground.screenshot({ path: '/tmp/inkra-shared-header-' + viewport + '.png', animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS shared header resize, collapse, Tabs, RTL and compact navigation at ' + viewport);
    await page.close();
  }
} finally {
  await browser.close();
}
