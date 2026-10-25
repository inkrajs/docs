import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const component of ['layout', 'grid', 'button', 'breadcrumb', 'card', 'tabs', 'resizable', 'drawer', 'command', 'tree']) {
    await page.goto(base + '/docs/components/' + component + '#api');
    const groups = page.locator('.component-api-group');
    await groups.first().waitFor();
    const ids = await groups.evaluateAll(nodes => nodes.map(node => node.id));
    assert(ids.length > 1 && new Set(ids).size === ids.length, component + ': distinct groups');
    if (component === 'layout') assert.equal(ids.length, 6);
    if (component === 'grid') assert.equal(ids.length, 3);
    const target = ids.at(-1);
    await groups.last().locator('h2 a').click();
    assert.equal(new URL(page.url()).hash, '#' + target);
    await page.reload();
    await page.locator('#' + target).waitFor();
    assert.equal(await page.locator('#' + target).isVisible(), true, 'deep link activates API on reload');
    await page.locator('#' + component + '-tab-preview').click();
    await page.waitForURL('**#preview');
    await page.goBack();
    await page.locator('#' + target).waitFor();
    assert.equal(new URL(page.url()).hash, '#' + target, 'history restores grouped API anchor');
    await page.goForward();
    await page.waitForURL('**#preview');
    await page.goBack();
    await page.locator('#' + target).waitFor();
    await page.setViewportSize({ width: 320, height: 900 });
    await page.waitForTimeout(100);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), component + ': no page overflow');
    await page.setViewportSize({ width: 1280, height: 900 });
    console.log('PASS grouped API anchors and narrow layout: ' + component);
  }
  await page.goto(base + '/docs/components/layout#layout-header');
  await page.locator('#layout-header').waitFor();
  assert.equal(await page.locator('.component-example[id^="layout-"]').count(), 6, 'six explicit component examples');
  assert.deepEqual(errors, []);
  await page.close();
} finally {
  await browser.close();
}
