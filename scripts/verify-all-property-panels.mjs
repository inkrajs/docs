import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const routes = ['button', 'icon', 'popover', 'overlay', 'tooltip', 'dropdown-menu', 'field', 'input', 'input-number', 'textarea', 'select', 'slider', 'checkbox', 'radio-group', 'switch', 'tabs', 'accordion', 'badge', 'separator', 'skeleton', 'progress', 'alert', 'avatar', 'card', 'table', 'calendar', 'day-agenda', 'journey-map'];
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    let panels = 0;
    for (const route of routes) {
      await page.goto(`http://127.0.0.1:4180/components/${route}#preview`);
      await page.locator('.preview-controls .property-tabs').first().waitFor();
      const workspaces = page.locator('.preview-workspace');
      for (const workspace of await workspaces.all()) {
        const controls = workspace.locator('.preview-controls');
        const groups = controls.locator('.property-tabs');
        assert.equal(await groups.count(), 1, `${route} grouped property panel`);
        assert.equal(await controls.locator('.controls-heading').count(), 0, `${route} no duplicate heading`);
        const tabs = groups.locator(':scope > [role="tablist"] > [role="tab"]');
        const count = await tabs.count();
        assert(count >= 2 && count <= 4, `${route} meaningful property categories`);
        assert.equal(await groups.locator(':scope > [role="tablist"] .inkra-tabs__icon canvas').count(), count);
        const display = await workspace.locator('.preview-display').boundingBox();
        const panel = await controls.boundingBox();
        if (width > 1024) {
          assert(Math.abs(display.width - panel.width) < 1, `${route} equal preview/control widths`);
          assert(Math.abs(display.height - panel.height) < 1, `${route} controls stretch to preview height`);
        } else assert(panel.y >= display.y + display.height, `${route} stacked compact layout`);
        for (const tab of await tabs.all()) {
          await tab.click();
          const active = groups.locator(':scope > [role="tabpanel"]:visible');
          assert.equal(await active.count(), 1, `${route} only current panel visible`);
          assert((await active.textContent()).trim().length > 0, `${route} no empty categories`);
          const bounds = await active.evaluate(node => ({ width: node.clientWidth, contentWidth: node.scrollWidth }));
          assert(bounds.contentWidth <= bounds.width + 2, `${route} no parameter panel horizontal overflow`);
        }
        await tabs.first().click();
        panels++;
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} no page overflow`);
      if (['input', 'select', 'card', 'journey-map'].includes(route)) {
        await workspaces.first().evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(250);
        await page.screenshot({ path: `/tmp/inkra-properties-${route}-${width}.png` });
      }
    }
    console.log(`PASS ${width}px: ${routes.length} component pages, ${panels} grouped property panels, equal split/stacking, icon tabs, nonempty categories`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
