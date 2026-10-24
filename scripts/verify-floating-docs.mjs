import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    const zh = locale === 'zh-CN';
    await page.goto(`${base}/docs/components/context-menu#preview`);
    const example = page.locator('.component-example').filter({ hasText: zh ? '浏览器菜单排除策略' : 'Native-menu exclusion policy' });
    const region = example.locator('.context-menu-demo__target');
    const input = region.getByRole('textbox', { name: zh ? '名称' : 'Name', exact: true });
    await input.fill('Draft keyboard and native menu');
    for (const target of [input, region.locator('[data-context-menu-native]')]) {
      const prevented = await target.evaluate(node => {
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
        node.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert.equal(prevented, false, 'excluded target keeps native contextmenu default');
      assert.equal(await page.getByRole('menu').count(), 0);
    }
    await example.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await region.focus();
    await region.press('Shift+F10');
    const menu = page.getByRole('menu', { name: zh ? '草稿操作' : 'Draft actions', exact: true });
    await menu.waitFor();
    await page.getByRole('menuitem', { name: zh ? '复制笔记' : 'Duplicate note', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.matches('.context-menu-demo__policy .context-menu-demo__target'));
    assert.match(await example.locator('output').textContent(), zh ? /已复制笔记/ : /Note duplicated/);
    assert.equal(await input.inputValue(), 'Draft keyboard and native menu');
    await region.press('Shift+F10');
    await menu.waitFor();
    await page.screenshot({ path: `/tmp/inkra-context-menu-round7-docs-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await region.elementHandle());
    assert(await region.evaluate(node => node === document.activeElement));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    await page.goto(`${base}/docs/components/popover#preview`);
    const focusExample = page.locator('.component-example').filter({ hasText: zh ? '初始焦点与焦点返回' : 'Initial focus and focus return' });
    const edit = focusExample.getByRole('button', { name: zh ? '编辑名称' : 'Edit name', exact: true });
    await edit.click();
    const name = page.getByRole('dialog').getByRole('textbox', { name: zh ? '名称' : 'Name', exact: true });
    await name.waitFor();
    assert(await name.evaluate(node => node === document.activeElement), 'custom initial focus works');
    await name.fill('Inkra');
    await page.screenshot({ path: `/tmp/inkra-popover-round7-docs-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.waitForFunction(button => document.activeElement === button, await edit.elementHandle());
    assert(await edit.evaluate(node => node === document.activeElement));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    await page.goto(`${base}/docs/components/tooltip#preview`);
    const directions = page.locator('.component-example .more-examples__row');
    assert.deepEqual(await directions.getByRole('button').allTextContents(), zh ? ['上', '右', '下', '左'] : ['Top', 'Right', 'Bottom', 'Left']);
    const tip = directions.getByRole('button').first();
    await page.keyboard.press('Tab');
    // Radix dismisses on scroll; settle the test's viewport movement before focus.
    await tip.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await tip.focus();
    await page.getByRole('tooltip').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('tooltip').waitFor({ state: 'hidden' });
    assert(await tip.evaluate(node => node === document.activeElement));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS live native-menu exclusions, actions, popover focus and localized tooltips: ${locale} ${width}px`);
  }
} finally {
  await browser.close();
}
