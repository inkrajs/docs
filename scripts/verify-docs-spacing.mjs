import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];
async function gap(page, before, after, expected = 20) {
  const spacing = await page.locator('.documentation').evaluate(article => {
    const style = getComputedStyle(article);
    const examples = article.querySelector('.component-examples');
    return { padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], examples: examples && getComputedStyle(examples).rowGap };
  });
  const inset = page.viewportSize().width <= 480 ? '12px' : '20px';
  assert.deepEqual(spacing.padding, [inset, inset, inset, inset]);
  if (spacing.examples) assert.equal(spacing.examples, '20px');
  const result = await page.evaluate(({ before, after }) => {
    const a = document.querySelector(before).getBoundingClientRect();
    const b = document.querySelector(after).getBoundingClientRect();
    return b.top - a.bottom;
  }, { before, after });
  assert.ok(Math.abs(result - expected) < 1, `${before} -> ${after}: expected ${expected}px, got ${result}px`);
}
try {
  for (const width of [1305, 390, 320]) {
    for (const locale of ['zh-CN', 'en']) {
      const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
      await context.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      for (const [route, target] of [['getting-started', '.getting-started-content > h2'], ['usage-guide', '.usage-guide__rules'], ['design-standard', '.standard-tabs button']]) {
        await page.goto(`${base}/docs/${route}`);
        await page.locator(target).first().waitFor();
        await gap(page, '.page-heading__divider', target);
        if (route === 'getting-started') {
          const widths = await page.locator('.getting-started-content').evaluate(node => ({
            content: node.getBoundingClientRect().width,
            paragraph: node.querySelector('p').getBoundingClientRect().width,
          }));
          assert(Math.abs(widths.content - widths.paragraph) < 1, 'getting-started paragraph fills the content width');
        }
        assert.equal(await page.locator('.page-heading + .section-divider').count(), 0, 'no duplicate heading divider');
        if (route === 'design-standard') {
          for (const tab of await page.locator('.standard-tabs [role="tab"]').all()) {
            await tab.click();
            await gap(page, '.standard-tabs-divider', '.design-standard:not([hidden]) > :first-child');
          }
          await page.locator('.standard-tabs [role="tab"]').first().click();
          await gap(page, '.standard-tabs-divider', '.color-palette__heading h2');
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (locale === 'zh-CN') await page.screenshot({ path: `/tmp/inkra-spacing-${route}-${width}.png` });
      }
      for (const component of ['button', 'select', 'data-table']) {
        await page.goto(`${base}/docs/components/${component}#preview`);
        await page.locator('.component-playground').first().waitFor();
        await gap(page, '.page-heading__divider', '.page-tabs button');
        for (const tab of await page.locator('.page-tabs [role="tab"]').all()) {
          await tab.click();
          await gap(page, '.documentation > .section-divider', '.content-section > :first-child');
        }
      }
      await context.close();
      console.log(`PASS spacing: three resource pages, all design tabs and three component page layouts, ${locale} ${width}px`);
    }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
