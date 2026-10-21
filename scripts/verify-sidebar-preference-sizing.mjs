import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/components/button#preview');
    if (width < 768) await page.getByRole('button', { name: '打开文档目录', exact: true }).click();
    const preferences = page.locator(`${width < 768 ? '.mobile-drawer' : '.desktop-sidebar'} .sidebar-preferences`);
    const language = preferences.getByRole('combobox');
    const surface = language.locator('.inkra-select__trigger-surface');
    const frame = preferences.locator('.inkra-radio-group__frame');
    await surface.waitFor();
    const languageBox = await surface.boundingBox();
    const themeBox = await frame.boundingBox();
    assert.equal(languageBox.height, 52);
    assert.equal(themeBox.height, languageBox.height);
    assert.equal(themeBox.width, languageBox.width);
    assert.equal(themeBox.x, languageBox.x);
    for (const segment of await preferences.locator('.inkra-radio-group__segment').all()) {
      assert((await segment.boundingBox()).height >= 44);
    }
    await language.click();
    await page.getByRole('option', { name: 'English', exact: true }).click();
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
    assert.equal((await surface.boundingBox()).height, 52);
    await language.click();
    await page.getByRole('option', { name: '中文', exact: true }).click();
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
    await preferences.getByRole('radio', { name: '深色主题', exact: true }).check();
    assert.equal((await frame.boundingBox()).height, 52);
    await preferences.getByRole('radio', { name: '浅色主题', exact: true }).check();
    await page.mouse.move(380, 100);
    await page.waitForTimeout(550);
    await preferences.screenshot({ path: `/tmp/inkra-sidebar-preferences-${width}.png` });
    if (width < 768) {
      await page.keyboard.press('Escape');
      await page.locator('.mobile-drawer').waitFor({ state: 'hidden' });
    }
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/components/select#preview');
    const defaultSurface = page.locator('.preview-stage .inkra-select__trigger-surface').first();
    await defaultSurface.waitFor();
    assert.equal((await defaultSurface.boundingBox()).height, 44, 'ordinary md Select remains 44px');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS ${width}px: matching 52px surfaces, 44px theme targets, language/theme interaction, default Select unchanged`);
    await page.close();
  }
} finally {
  await browser.close();
}
