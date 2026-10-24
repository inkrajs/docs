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
    const title = zh ? '保留面板内容' : 'Preserved panel content';
    for (const component of ['tabs', 'accordion']) {
      await page.goto(`${base}/docs/components/${component}#preview`);
      const sample = page.locator('.component-example').filter({
        has: page.locator('.component-example__header').filter({ hasText: title }),
      });
      await sample.waitFor();
      const input = sample.getByRole('textbox', { name: zh ? '名称' : 'Name', exact: true });
      await input.fill('Retained draft');
      if (component === 'tabs') {
        await sample.getByRole('tab', { name: zh ? '草稿' : 'Drafts', exact: true }).click();
        assert.equal(await sample.locator('input').inputValue(), 'Retained draft');
        assert.equal(await sample.locator('input').isVisible(), false);
        await sample.getByRole('tab', { name: zh ? '笔记' : 'Notes', exact: true }).click();
      } else {
        const trigger = sample.getByRole('button', { name: zh ? '草稿' : 'Drafts', exact: true });
        await trigger.click();
        await page.waitForTimeout(250);
        const content = sample.locator('.inkra-accordion__content');
        assert.equal(await content.getAttribute('aria-hidden'), 'true');
        assert.equal(await content.evaluate(node => node.inert), true);
        assert((await content.boundingBox())?.height <= 1, 'closed content takes no visible height');
        assert.equal(await sample.locator('input').inputValue(), 'Retained draft');
        await trigger.click();
      }
      assert.equal(await input.inputValue(), 'Retained draft');
      await input.focus();
      assert(await input.evaluate(node => node === document.activeElement));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${component} ${width}px overflow`);
      await sample.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-${component}-round6-docs-${width}.png`, animations: 'disabled' });
      console.log(`PASS ${component} ${locale} ${width}px retained draft and layout`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
