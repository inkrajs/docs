import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  page.setDefaultTimeout(15000);
  await page.goto('http://127.0.0.1:4180/components/button#accessibility');
  const tab = page.locator('#button-tab-accessibility');
  await tab.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.keyboard.press('Tab');
  await tab.focus();
  const ring = tab.locator('.inkra-tabs__focus-ring');
  assert.equal(await ring.evaluate(node => getComputedStyle(node).opacity), '1');
  assert.equal(await tab.evaluate(node => getComputedStyle(node).outlineWidth), '0px');
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#button-tab-accessibility .inkra-tabs__focus-ring canvas');
    return canvas && [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((v, i) => i % 4 === 3 && v);
  });
  await page.screenshot({ path: '/tmp/inkra-tabs-focus-light.png' });
  await page.locator('#button-tab-preview').click();
  assert.equal(await ring.evaluate(node => getComputedStyle(node).opacity), '0');
  await page.getByRole('radio', { name: '深色主题', exact: true }).check();
  await page.keyboard.press('Tab');
  await tab.focus();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/inkra-tabs-focus-dark.png' });
  assert.equal(await ring.evaluate(node => getComputedStyle(node).opacity), '1');
  const forced = await browser.newPage({ viewport: { width: 1305, height: 954 }, forcedColors: 'active' });
  await forced.goto('http://127.0.0.1:4180/components/button#accessibility');
  const forcedTab = forced.locator('#button-tab-accessibility');
  await forced.keyboard.press('Tab');
  await forcedTab.focus();
  assert.equal(await forcedTab.locator('.inkra-tabs__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
  assert.equal(await forcedTab.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  assert.equal(await forcedTab.evaluate(node => getComputedStyle(node).outlineWidth), '2px');
  console.log('PASS Tabs pencil focus, keyboard visibility, pointer reset, dark theme and forced-color fallback');
} finally {
  await browser.close();
}
