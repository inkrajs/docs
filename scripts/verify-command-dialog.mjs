import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];
try {
  for (const { width, locale } of [{ width: 1305, locale: 'zh-CN' }, { width: 390, locale: 'en' }]) {
    const zh = locale === 'zh-CN';
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' && /DialogTitle|Description|aria-describedby/.test(message.text())) errors.push(message.text());
    });
    await page.addInitScript(value => localStorage.setItem('inkra-docs-locale', value), locale);
    await page.goto(`${base}/docs/components/command#preview`);
    for (const { triggerName, title, region } of [
      { triggerName: zh ? '打开命令面板' : 'Open command palette', title: zh ? '命令面板' : 'Command palette', region: '[data-testid="command-playground"]' },
      { triggerName: zh ? '搜索操作' : 'Search actions', title: zh ? '操作命令' : 'Actions', region: '[data-testid="command-composition"]' },
    ]) {
      const trigger = page.locator(region).getByRole('button', { name: triggerName, exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await dialog.waitFor();
      assert.equal(await dialog.locator('.inkra-overlay__header, .inkra-overlay__body, .inkra-overlay__description').count(), 0, 'no visible wrapper header or padded body');
      assert.equal(await dialog.locator('.inkra-command__paper').count(), 0, 'no second command surface');
      assert.equal(await dialog.locator('.inkra-overlay__surface').count(), 1, 'one dialog surface');
      const heading = dialog.locator('.inkra-overlay__title');
      const titleBox = await heading.boundingBox();
      assert(titleBox.width <= 1 && titleBox.height <= 1, 'dialog title remains visually hidden');
      assert.equal(await dialog.getAttribute('aria-describedby'), null, 'no missing description reference');
      const input = dialog.getByRole('combobox');
      assert.equal(await input.evaluate(node => node === document.activeElement), true, 'search receives initial focus');
      await input.fill(zh ? '新建' : 'New');
      await dialog.getByRole('option', { name: /新建笔记|New note/ }).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(button => document.activeElement === button, await trigger.elementHandle());
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'Escape restores trigger focus');
      await trigger.click();
      await page.getByRole('dialog', { name: title, exact: true }).getByRole('option', { name: /新建笔记|New note/ }).click();
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(button => document.activeElement === button, await trigger.elementHandle());
      assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'selection closes and returns focus');
      await trigger.click();
      await dialog.screenshot({ path: `/tmp/inkra-command-dialog-${width}-${region.includes('composition') ? 'composed' : 'main'}.png` });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.keyboard.press('Escape');
    }
    await page.close();
    console.log(`PASS command dialog single surface, hidden title, selection and focus: ${locale} ${width}`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
