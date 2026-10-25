import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const comparisonKinds = ['appearance', 'size', 'icon-size', 'icons', 'state', 'link', 'group', 'rtl'];

async function assertAnchor(page, id) {
  await page.waitForFunction(id => {
    const target = document.getElementById(id);
    if (!target || decodeURIComponent(location.hash.slice(1)) !== id) return false;
    const heading = target.matches('h2') ? target : target.querySelector('h2');
    const rect = heading?.getBoundingClientRect();
    const header = document.querySelector('.app-header')?.getBoundingClientRect();
    return rect && rect.top >= (header?.bottom ?? 0) - 1 && rect.bottom < innerHeight;
  }, id);
  assert.equal(await page.locator(`#${id} .component-example__anchor`).getAttribute('href'), `#${id}`);
}

async function assertButtonAnchors(page, width) {
  await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
  await page.goto(`${base}/docs/components/button#preview`);
  await page.locator('.comparison-list .component-example__anchor').first().waitFor();
  assert.deepEqual(await page.locator('.comparison-list .component-example').evaluateAll(nodes => nodes.map(node => node.id)), comparisonKinds.map(kind => `comparison-${kind}`));
  const chineseTitles = await page.locator('.comparison-list .component-example__anchor').allTextContents();
  for (const kind of comparisonKinds) {
    const id = `comparison-${kind}`;
    const previousHash = new URL(page.url()).hash;
    const link = page.locator(`#${id} .component-example__anchor`);
    await link.click();
    await assertAnchor(page, id);
    await page.goBack();
    await page.waitForURL(url => url.hash === previousHash);
    await page.goForward();
    await assertAnchor(page, id);
    await page.reload();
    await assertAnchor(page, id);
    await link.focus();
    await page.keyboard.press('Enter');
    await assertAnchor(page, id);
    const section = page.locator(`#${id}`);
    const disclosure = section.locator('.component-example__disclosure');
    const panelId = await disclosure.getAttribute('aria-controls');
    assert(panelId, `${id}: disclosure controls a named code panel`);
    await disclosure.click();
    await page.locator(`#${panelId}`).waitFor({ state: 'visible' });
    assert.equal(await disclosure.getAttribute('aria-expanded'), 'true');
    const copy = section.getByRole('button', { name: '复制代码', exact: true });
    await copy.waitFor();
    if (kind === 'appearance') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
      await copy.click();
      await section.getByRole('button', { name: '已复制代码', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await section.getAttribute('data-doc-code'));
    }
    await disclosure.click();
    assert.equal(await disclosure.getAttribute('aria-expanded'), 'false');
    await page.locator(`#${panelId}`).waitFor({ state: 'hidden' });
  }
  await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'en'));
  for (const kind of comparisonKinds) {
    const id = `comparison-${kind}`;
    await page.goto(`${base}/docs/components/button?anchor-test=button#${id}`);
    await assertAnchor(page, id);
    assert.equal(new URL(page.url()).search, '?anchor-test=button');
  }
  assert.notDeepEqual(await page.locator('.comparison-list .component-example__anchor').allTextContents(), chineseTitles);
  for (const locale of ['ja', 'ko', 'fr']) {
    await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    await page.goto(`${base}/docs/components/button?anchor-locale=${locale}#comparison-appearance`);
    await assertAnchor(page, 'comparison-appearance');
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.deepEqual(await page.locator('.comparison-list .component-example').evaluateAll(nodes => nodes.map(node => node.id)), comparisonKinds.map(kind => `comparison-${kind}`));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.screenshot({ path: `/tmp/inkra-button-example-anchor-${width}.png` });
  console.log(`PASS all 8 Button group anchors: click, keyboard, history, reload, English direct entry and stable IDs in 5 locales at ${width}px`);
}

try {
  for (const width of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('inkra-docs-locale')) localStorage.setItem('inkra-docs-locale', 'zh-CN');
    });
    await page.goto(`${base}/docs/components/container#preview`);
    const link = page.locator('#reading-width h2 a');
    await link.waitFor();
    const initialFont = await link.evaluate(node => getComputedStyle(node).fontSize);
    await link.click();
    await assertAnchor(page, 'reading-width');
    assert.equal(await link.evaluate(node => getComputedStyle(node).fontSize), initialFont);
    await page.goBack();
    await page.waitForURL('**/container#preview');
    await page.goForward();
    await assertAnchor(page, 'reading-width');
    await page.reload();
    await assertAnchor(page, 'reading-width');
    await page.screenshot({ path: `/tmp/inkra-example-anchor-${width}.png` });

    // Direct bookmarks survive lazy loading and a different initial locale.
    await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'en'));
    await page.goto(`${base}/docs/components/container?anchor-test=1#reading-width`);
    await assertAnchor(page, 'reading-width');
    assert.match(await link.textContent(), /Reading width/);
    assert.equal(new URL(page.url()).search, '?anchor-test=1');
    await link.focus();
    await page.keyboard.press('Enter');
    await assertAnchor(page, 'reading-width');

    // Normal documentation tabs must retain their existing navigation semantics.
    await page.goto(`${base}/docs/components/container#api`);
    await page.locator('[role="tab"][aria-selected="true"]').filter({ hasText: 'API' }).first().waitFor();
    assert.equal(new URL(page.url()).hash, '#api');
    assert.equal(await page.locator('#reading-width').count(), 0);
    await page.goBack();
    await assertAnchor(page, 'reading-width');

    await page.goto(`${base}/docs/components/container#missing-example`);
    await page.locator('.component-example').first().waitFor();
    assert.equal(new URL(page.url()).hash, '#missing-example');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

    // Mapped examples have distinct, locale-independent destinations too.
    await page.goto(`${base}/docs/components/select#select-icon-only`);
    await assertAnchor(page, 'select-icon-only');
    const ids = await page.locator('.component-example').evaluateAll(nodes => nodes.map(node => node.id));
    assert.equal(ids.length, new Set(ids).size);
    assert(ids.every(Boolean));
    await page.goto(`${base}/docs/components/tabs#tabs-overflow-buttons`);
    await assertAnchor(page, 'tabs-overflow-buttons');
    await assertButtonAnchors(page, width);
    assert.deepEqual(errors, []);
    console.log(`PASS example anchors: click, keyboard, history, reload, locale, lazy routes, tabs and mapped examples at ${width}px`);
    await page.close();
  }
} finally {
  await browser.close();
}
