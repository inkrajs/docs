import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function open(page, component) {
  await page.goto(`${base}/docs/components/${component}#preview`);
  await page.locator('.component-playground').waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

try {
  for (const config of [
    { width: 1305, height: 954, theme: 'light', locale: 'zh-CN' },
    { width: 390, height: 844, theme: 'dark', locale: 'en' },
  ]) {
    const page = await browser.newPage({ viewport: { width: config.width, height: config.height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ theme, locale }) => {
      localStorage.setItem('inkra-docs-theme', theme);
      localStorage.setItem('inkra-docs-locale', locale);
    }, config);

    await open(page, 'slot');
    const slot = page.locator('.preview-display .inkra-slot');
    await slot.focus();
    await page.keyboard.press('Space');
    assert.equal(await slot.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Enter');
    assert.equal(await slot.getAttribute('aria-pressed'), 'true');
    const slotBox = await slot.boundingBox();
    assert.equal(slotBox.width, 64);
    assert.equal(slotBox.height, 64);
    assert.equal(await slot.locator('button').count(), 0, 'interactive Slot does not nest a button');
    assert.equal(await slot.locator('.inkra-badge').count(), 1);
    const countBox = await slot.locator('.inkra-slot__count').boundingBox();
    assert(countBox.x >= slotBox.x + slotBox.width - countBox.width);
    await page.screenshot({ path: `/tmp/inkra-utility-slot-${config.width}-${config.theme}.png`, fullPage: true });

    await open(page, 'hotkey');
    const hotkeyInput = page.locator('.preview-display .inkra-hotkey-input__native');
    await hotkeyInput.focus();
    await page.keyboard.press('Control+Shift+K');
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-hotkey-input__native')?.value.includes('K'));
    assert.match(await hotkeyInput.inputValue(), /K/);
    await hotkeyInput.focus();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.preview-display output').textContent(), config.locale === 'en' ? 'Recording cancelled' : '已取消录入');

    await open(page, 'number-ticker');
    const ticker = page.locator('.preview-display .inkra-number-ticker');
    const announcement = ticker.locator('[aria-live="polite"]');
    const before = await announcement.textContent();
    await setPlaygroundControls(page.locator('.component-playground'), true);
    const properties = page.getByRole('group', { name: config.locale === 'en' ? 'Properties' : '属性', exact: true });
    await properties.getByRole('tab', { name: config.locale === 'en' ? 'Interaction' : '交互', exact: true }).click();
    await properties.getByRole('button', { name: config.locale === 'en' ? 'Add 275' : '增加 275' }).click();
    await page.waitForTimeout(500);
    assert.notEqual(await announcement.textContent(), before);
    assert.equal(await announcement.count(), 1);

    await open(page, 'log');
    const viewport = page.locator('.preview-display .inkra-log__viewport');
    await viewport.focus();
    await page.keyboard.press('Home');
    assert.equal(await viewport.evaluate(node => node.scrollTop), 0);
    await page.keyboard.press('End');
    await page.waitForFunction(() => {
      const node = document.querySelector('.preview-display .inkra-log__viewport');
      return node && node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
    });
    assert(await viewport.evaluate(node => node.scrollTop + node.clientHeight >= node.scrollHeight - 1));
    assert.equal(await viewport.locator('[aria-live], [role="log"]').count(), 0);
    assert.equal(await viewport.getByRole('listitem').count(), 4);
    assert(await viewport.evaluate(node => node.scrollWidth <= node.clientWidth));
    // PencilText's decorative canvas has a 5px bleed; measure selectable text instead.
    const textFits = await viewport.locator('.inkra-log__content > .inkra-pencil-text, .inkra-log__empty > .inkra-pencil-text')
      .evaluateAll(nodes => nodes.length > 0 && nodes.every(node => {
        const source = node.querySelector('.inkra-pencil-text__source');
        if (!source) return false;
        const range = document.createRange();
        range.selectNodeContents(source);
        const bounds = node.getBoundingClientRect();
        return [...range.getClientRects()].every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1);
      }));
    assert(textFits, 'Log text stays inside its column without clipping');
    await page.screenshot({ path: `/tmp/inkra-utility-log-${config.width}-${config.theme}.png`, fullPage: true });

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log(`PASS Slot, Hotkey, NumberTicker and Log interactions: ${config.width}px ${config.theme} ${config.locale}`);
    await page.close();
  }
} finally {
  await browser.close();
}
