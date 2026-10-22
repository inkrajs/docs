import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'zh-CN', 'light'], [1305, 'en', 'dark'], [320, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedCode = value; } } });
    }, { locale, theme });
    for (const component of ['radio-group', 'button', 'data-table']) {
      await page.goto(`${base}/docs/components/${component}#api`);
      await page.locator('.docs-api-table .inkra-table').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const table = page.locator('.docs-api-table').first();
      assert(await table.locator('td code.inkra-pencil-text[data-pencil-ready="true"]').count() > 0);
      assert.equal(await table.locator('th').count(), component === 'button' ? 4 : 3);
      assert.equal(await table.locator('td').count(), await table.locator('td > .inkra-table__divider').count());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${component} page overflow`);
    }
    await page.goto(`${base}/docs/components/radio-group#preview`);
    const playground = page.locator('.component-playground').first();
    const expected = await playground.getAttribute('data-doc-code');
    await playground.getByRole('tab', { name: /^(代码|Code)$/ }).click();
    const code = playground.locator('.docs-code');
    await code.waitFor();
    assert.equal(await code.textContent(), expected, 'token rendering preserves source bytes');
    const appearance = await code.evaluate(node => ({
      colors: [...new Set([...node.querySelectorAll('.inkra-pencil-text')].map(token => getComputedStyle(token).color))],
      font: getComputedStyle(node).fontFamily,
      ready: node.querySelectorAll('[data-pencil-ready="true"]').length,
    }));
    assert(appearance.colors.length >= 3, 'syntax tokens use distinct colors');
    assert.match(appearance.font, /Trip Map Hand/);
    assert(appearance.ready > 0, 'code uses pencil lettering');
    await playground.getByRole('button', { name: /复制代码|Copy code/ }).click();
    assert.equal(await page.evaluate(() => window.copiedCode), expected, 'copy preserves unformatted source');
    assert.equal(await code.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.toString();
    }), expected, 'source stays selectable');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-docs-code-${width}-${theme}.png` });
    await page.getByRole('tab', { name: /^(示例|Examples)$/ }).first().click();
    await page.getByRole('button', { name: /查看源码|View source/ }).first().click();
    assert(await page.locator('.component-example__code .inkra-pencil-text').count() > 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS Inkra API tables, pencil syntax, exact source/copy and layout: ${width}px ${locale} ${theme}`);
  }
  const page = await browser.newPage();
  await page.goto(`${base}/docs/getting-started`);
  const sample = '<Widget label="<img src=x onerror=alert(1)> & 你好" />\n// comment\nconst count: number = 42;';
  await page.evaluate(async code => {
    const { React, ReactDOM, ReactDOMClient, CodeBlock } = await import('/scripts/fixtures/docs-code.mjs');
    const host = document.createElement('div');
    host.id = 'code-safety-fixture';
    document.body.prepend(host);
    ReactDOM.flushSync(() => ReactDOMClient.createRoot(host).render(React.createElement(CodeBlock, { code })));
  }, sample);
  const fixture = page.locator('#code-safety-fixture');
  assert.equal(await fixture.textContent(), sample);
  assert.equal(await fixture.locator('img, script').count(), 0, 'source is text, never injected HTML');
  await page.emulateMedia({ forcedColors: 'active' });
  const color = await fixture.locator('.inkra-pencil-text__source').first().evaluate(node => getComputedStyle(node).color);
  assert.notEqual(color, 'rgba(0, 0, 0, 0)', 'forced colors retains readable DOM');
  console.log('PASS escaped source and forced-color fallback');
} finally {
  await browser.close();
}
