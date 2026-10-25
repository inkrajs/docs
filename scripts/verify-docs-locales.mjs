import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { docsLanguages, lookupDocsMessage } from '../src/docsLocales.ts';
import { inkraLocales } from '@inkra/react/i18n';
import { setControls, showPreview } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const errors = [];
const translated = (locale, key) => lookupDocsMessage(locale, key) ?? key;
try {
  for (const width of [1543, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/docs/internationalization');
    const note = page.locator('input[name="note"]');
    await note.fill('Keep my draft');
    const original = await note.elementHandle();
    for (const [locale, label] of docsLanguages) {
      console.log('Checking site locale', width, locale);
      if (width < 800) await page.locator('.menu-button').click();
      const sidebar = page.locator(width < 800 ? '.mobile-drawer' : '.desktop-sidebar');
      await sidebar.locator('.language-control [role="combobox"]').click();
      await page.getByRole('option', { name: label, exact: true }).click();
      await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
      if (width < 800) await page.keyboard.press('Escape');
      assert.equal(await page.title(), translated(locale, '国际化') + ' · Inkra');
      assert.equal(await page.locator('form.i18n-examples__preview').getAttribute('lang'), locale);
      assert.equal(await note.inputValue(), 'Keep my draft');
      assert(await note.evaluate((node, prior) => node === prior, original));
      assert.equal(await page.locator('#internationalization > h2').count(), 0);
      assert.equal(await page.locator('main').getByRole('button', { name: inkraLocales[locale]['input.clear'], exact: true }).count(), 1);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.right > innerWidth + 1;
      }).slice(0, 12).map(node => `${node.tagName}.${node.className}: ${node.getBoundingClientRect().right}`));
      await page.screenshot({ path: `/tmp/inkra-docs-${width}-${locale}.png`, animations: 'disabled' });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${locale}: ${overflow.join('; ')}`);
      const main = page.locator('main');
      await main.getByRole('heading', { level: 1, name: translated(locale, '国际化'), exact: true }).waitFor();
    }
    await page.reload();
    await page.waitForFunction(() => document.documentElement.lang === 'fr');
    await page.goto(base + '/docs/theming');
    assert.equal(await page.locator('#theme-provider > h2').count(), 0);
    const playground = page.locator('#theme-provider .component-playground');
    await setControls(playground, true);
    await playground.getByRole('tab', { name: 'Texte', exact: true }).click();
    await playground.getByRole('slider', { name: 'Intensité du contour', exact: true }).press('Home');
    await showPreview(playground);
    await page.waitForFunction(() => document.querySelector('[data-testid="theme-preview"]').style.getPropertyValue('--inkra-letter-outline') === '0.2');
    assert.equal(await page.title(), 'Personnalisation du thème · Inkra');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `/tmp/inkra-docs-fr-${width}.png`, animations: 'disabled' });
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto(base + '/');
  await page.locator('.header-language').click();
  assert.equal(await page.getByRole('menuitemradio').count(), 5);
  await page.getByRole('menuitemradio', { name: '日本語', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'ja');
  await page.close();
  assert.deepEqual(errors, []);
  console.log('Five-language site controls, live provider inheritance, persistence, preserved drafts and 1543/390/320px layouts passed.');
} finally {
  await browser.close();
}
