import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { infiniteScrollCopy } from '../src/components/infiniteScrollCopy.ts';
import { docsLanguages } from '../src/docsLocales.ts';

const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 954 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180'}/docs/components/infinite-scroll#infinite-scroll-lifecycle`);
    const section = page.locator('#infinite-scroll-lifecycle');
    await section.waitFor();
    const original = await section.elementHandle();
    for (const [locale, label] of docsLanguages) {
      if (await page.evaluate(() => document.documentElement.lang) !== locale) {
        if (width < 800) await page.locator('.menu-button').click();
        const sidebar = page.locator(width < 800 ? '.mobile-drawer' : '.desktop-sidebar');
        await sidebar.locator('.language-control [role="combobox"]').click();
        await page.getByRole('option', { name: label, exact: true }).click();
        await page.waitForFunction(value => document.documentElement.lang === value, locale);
        if (width < 800) {
          await page.locator('.mobile-drawer .drawer-header > button').click();
          await page.locator('.mobile-drawer').waitFor({ state: 'hidden' });
        }
      }
      const text = infiniteScrollCopy(locale);
      assert.equal(await section.locator('h2').innerText(), text.lifecycle);
      assert.equal(await page.getByTestId('infinite-scroll-lifecycle-events').innerText(),
        `${text.started} 0; ${text.aborted} 0; ${text.completed} 0`);
      assert.equal(await page.getByTestId('infinite-scroll-lifecycle').getAttribute('aria-label'), text.lifecycle);
      assert.equal(await page.getByTestId('infinite-scroll-controlled').getAttribute('aria-label'), text.controlled);
      assert.equal(await section.locator('.infinite-scroll-examples__history-row').first().innerText(), `${text.lifecycleItem} 1`);
      assert.equal(await page.getByTestId('infinite-scroll-controlled').locator('.infinite-scroll-examples__history-row').first().innerText(), `${text.controlledItem} 1`);
      assert.equal(await page.locator('#infinite-scroll-loading-masonry h2').innerText(), text.masonry);
      assert(await section.evaluate((node, previous) => node === previous, original), 'language switches preserve the example instance');
      if (locale !== 'en') assert.doesNotMatch(await section.innerText(), /Request lifecycle|started|aborted|completed|Lifecycle|Controlled/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'translations do not overflow the page');
      if (locale === 'zh-CN') {
        await section.locator('h2').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `/tmp/inkra-infinite-scroll-lifecycle-zh-${width}.png` });
      }
      console.log(`PASS InfiniteScroll example translations ${locale} ${width}px`);
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
