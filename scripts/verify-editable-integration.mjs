import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const ready = async input => {
  await input.locator('xpath=ancestor::*[contains(@class,"inkra-field-control-hit")]').evaluate(async element => {
    const started = performance.now();
    while (element.getAttribute('data-pencil-editable-ready') !== 'true') {
      if (performance.now() - started > 5000) throw new Error('Editable canvas not ready');
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  });
};
try {
  await page.goto(`${base}/components/input`);
  const input = page.locator('.preview-stage input.inkra-input');
  await input.waitFor();
  await ready(input);
  await input.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
  for (const value of ['zhong', '中文', '中文输入']) {
    await input.evaluate((element, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
      element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    }, value);
    await page.waitForTimeout(50);
    assert.equal(await input.evaluate(element => element.closest('.inkra-field-control-hit').hasAttribute('data-pencil-editable-ready')), true);
    assert.equal(await input.evaluate(element => getComputedStyle(element).color), 'rgba(0, 0, 0, 0)');
  }
  await input.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
  await ready(input);
  assert.equal(await input.inputValue(), '中文输入');
  await input.evaluate(element => { element.focus(); element.setSelectionRange(0, 2); });
  await page.keyboard.type('测试');
  assert.equal(await input.inputValue(), '测试输入');
  await ready(input);
  assert.equal(await page.locator('.component-example input[readonly]').evaluate(element => getComputedStyle(element).color), 'rgba(0, 0, 0, 0)');
  await input.fill('x'.repeat(4100));
  await page.waitForTimeout(100);
  assert.notEqual(await input.evaluate(element => getComputedStyle(element).color), 'rgba(0, 0, 0, 0)');
  await input.fill('');
  await ready(input);
  await page.emulateMedia({ forcedColors: 'active' });
  assert.notEqual(await input.evaluate(element => getComputedStyle(element, '::placeholder').color), 'rgba(0, 0, 0, 0)');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.emulateMedia({ media: 'print' });
  assert.notEqual(await input.evaluate(element => getComputedStyle(element, '::placeholder').color), 'rgba(0, 0, 0, 0)');
  await page.emulateMedia({ media: 'screen' });
  await input.fill('彩铅输入 Pencil input');
  await ready(input);
  await page.screenshot({ path: '/tmp/inkra-editable-integrated.png' });
  await page.goto(`${base}/components/textarea`);
  const textarea = page.locator('.preview-stage textarea');
  await textarea.fill('第一行：彩铅输入\nThe quick brown fox jumps over the lazy dog. A longer paragraph wraps naturally across more than one line.');
  await ready(textarea);
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.waitForTimeout(250);
    await ready(textarea);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-textarea-${width}.png` });
  }
  assert.deepEqual(errors, []);
  console.log('PASS controlled composition updates, selection replacement, readonly, length fallback, forced colors/print placeholder and responsive textarea');
} finally { await browser.close(); }
