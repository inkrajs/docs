import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const zh = locale === 'zh-CN';
    const page = await browser.newPage({ viewport: { width, height: 700 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    await page.goto(`${base}/docs/components/drawer#preview`);
    const trigger = page.getByRole('button', { name: zh ? '打开任务抽屉' : 'Open task drawer', exact: true });
    const drawer = page.getByRole('dialog', { name: zh ? '任务详情' : 'Task details', exact: true });
    const input = drawer.getByRole('textbox', { name: zh ? '项目名称' : 'Project name', exact: true });
    await trigger.click();
    await input.fill('Unsaved draft');
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());
    await trigger.click();
    assert.equal(await input.inputValue(), 'Inkra', 'dismissal discards unsaved draft');
    await input.fill('Inkra Studio');
    await drawer.getByRole('button', { name: zh ? '保存' : 'Save', exact: true }).click();
    await drawer.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());
    assert.match(await page.locator('.component-playground output').textContent(), /Inkra Studio/);
    await trigger.click();
    assert.equal(await input.inputValue(), 'Inkra Studio', 'saved draft survives reopening');
    const body = drawer.locator('.inkra-drawer__body');
    const footer = drawer.locator('.inkra-drawer__footer');
    const footerBefore = await footer.boundingBox();
    await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
    assert(await body.evaluate(node => node.scrollTop > 0));
    assert.deepEqual(await footer.boundingBox(), footerBefore, 'body scrolling leaves footer stationary');
    await page.screenshot({ path: `/tmp/inkra-drawer-round8-docs-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });

    await page.goto(`${base}/docs/components/alert-dialog#preview`);
    const archive = page.getByRole('button', { name: zh ? '归档项目' : 'Archive project', exact: true });
    const alert = page.getByRole('alertdialog');
    await archive.click();
    const cancel = alert.getByRole('button', { name: zh ? '取消' : 'Cancel', exact: true });
    await page.waitForFunction(node => document.activeElement === node, await cancel.elementHandle());
    await alert.evaluate(node => { node.dir = 'rtl'; });
    const box = await alert.boundingBox();
    assert(Math.abs(box.x + box.width / 2 - width / 2) < 1, 'RTL alert stays centered');
    await page.screenshot({ path: `/tmp/inkra-alert-dialog-round8-docs-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await alert.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await archive.elementHandle());
    await archive.click();
    await alert.getByRole('button', { name: zh ? '确认归档' : 'Confirm archive', exact: true }).click();
    assert.equal(await alert.getAttribute('aria-busy'), 'true');
    assert(await cancel.isDisabled());
    await page.keyboard.press('Escape');
    assert(await alert.isVisible(), 'pending action rejects Escape dismissal');
    await alert.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.component-playground output').textContent(), zh ? '归档完成' : 'Archived');
    await page.waitForFunction(node => document.activeElement === node, await archive.elementHandle());

    await page.goto(`${base}/docs/components/command#preview`);
    await page.getByRole('button', { name: zh ? '打开命令面板' : 'Open command palette', exact: true }).click();
    const command = page.getByRole('dialog');
    await command.evaluate(node => { node.dir = 'rtl'; });
    const commandBox = await command.boundingBox();
    assert(Math.abs(commandBox.x + commandBox.width / 2 - width / 2) < 1, 'RTL composed command stays centered');
    await command.getByRole('combobox').fill(zh ? '新建' : 'New');
    await command.getByRole('option', { name: /新建笔记|New note/ }).waitFor();
    await page.screenshot({ path: `/tmp/inkra-command-round8-docs-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await command.waitFor({ state: 'hidden' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS live drawer save/cancel, async alert, RTL command and focus: ${locale} ${width}px`);
  }
} finally {
  await browser.close();
}
