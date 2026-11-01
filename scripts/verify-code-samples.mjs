import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'zh-CN', 'light'], [320, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async text => { window.copiedCode = text; },
      } });
    }, { locale, theme });
    await page.goto(`${base}/docs/installation`);
    await page.locator('.inkra-markdown__code-frame').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.inkra-markdown__code-frame').count(), 3);
    for (const [index, language] of ['Bash', 'TSX', 'TSX'].entries()) {
      const card = page.locator('.inkra-markdown__code-frame').nth(index);
      assert.equal(await card.locator('.inkra-markdown__code-language').textContent(), language);
      assert(await card.locator('.inkra-markdown__code-language canvas').count() > 0, 'language label uses the library pencil renderer');
      const button = card.getByRole('button', { name: /复制代码|Copy code/ });
      const box = await button.boundingBox();
      assert(box.width >= 44 && box.height >= 44);
      await button.click();
      assert.equal((await page.evaluate(() => window.copiedCode)).trimEnd(), (await card.locator('pre').textContent()).trimEnd());
      await card.getByRole('button', { name: /已复制代码|Code copied/ }).waitFor();
      assert(await card.getByRole('status').textContent());
      const geometry = await card.evaluate(node => {
        const header = node.querySelector('.inkra-markdown__code-header').getBoundingClientRect();
        const body = node.querySelector('.inkra-markdown__code-surface').getBoundingClientRect();
        const label = node.querySelector('.inkra-markdown__code-language').getBoundingClientRect();
        const action = node.querySelector('button').getBoundingClientRect();
        return { headerBottom: header.bottom, bodyTop: body.top, labelRight: label.right, actionLeft: action.left };
      });
      assert(geometry.headerBottom <= geometry.bodyTop + 1);
      assert(geometry.labelRight < geometry.actionLeft);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
    const first = page.locator('.inkra-markdown__code-frame').first();
    await first.getByRole('button').click();
    await first.getByRole('button', { name: /复制失败|Copy failed/ }).waitFor();
    assert.match(await first.getByRole('status').textContent(), /手动选择|manually/);
    assert.equal(await first.locator('pre').evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.toString().trimEnd();
    }), 'npm install @inkra/react');
    await page.screenshot({ path: `/tmp/inkra-code-samples-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS code card headers, copy/failure, selection and layout: ${width}px ${locale} ${theme}`);
  }
} finally {
  await browser.close();
}
