import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { inkraLocales, createInkraTranslator } from '@inkra/react/i18n';
import { assertPlaygroundLayout, readCode, setControls, showPreview } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const languages = [['zh-CN', '简体中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['fr', 'Français']];
const screenshots = [];
const errors = [];

async function settled(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
}
async function assertGeometry(page, scope) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no page overflow');
  const boxes = await scope.locator('.inkra-field').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, right: rect.right, left: rect.left };
  }));
  for (const box of boxes) assert(box.width > 100 && box.right <= page.viewportSize().width + 1 && box.left >= 0, JSON.stringify(box));
}
async function assertPaint(scope) {
  const painted = await scope.locator('.inkra-pencil-text canvas').evaluateAll(nodes => nodes.filter(canvas => {
    const rect = canvas.getBoundingClientRect();
    if (!canvas.width || !canvas.height || rect.bottom < 0 || rect.top > innerHeight) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 16) return true;
    return false;
  }).length);
  assert(painted > 0, 'visible localized pencil text has actual painted pixels');
}
async function update(page, locale, messages) {
  await page.evaluate(settings => window.i18nFixture.update(settings), { locale, messages });
  await page.waitForFunction(value => document.querySelector('[data-testid="i18n-fixture"]').lang === value, locale);
  await settled(page);
}

try {
  for (const [width, docsLocale, theme] of [[1543, 'zh-CN', 'light'], [1305, 'zh-CN', 'light'], [390, 'en', 'dark'], [320, 'zh-CN', 'light']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ docsLocale, theme }) => {
      localStorage.setItem('inkra-docs-locale', docsLocale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { docsLocale, theme });
    await page.goto(base + '/docs/internationalization');
    const section = page.locator('#internationalization');
    await section.scrollIntoViewIfNeeded();
    const form = section.locator('form');
    const playground = section.locator('.component-playground');
    await assertPlaygroundLayout(playground);
    await form.locator('input[name="note"]').fill('Untranslated draft');
    const inputNode = await form.locator('input[name="note"]').elementHandle();
    for (const [locale, name] of languages) {
      await setControls(playground, true);
      await playground.locator('.preview-controls [role="combobox"]').click();
      await page.getByRole('option', { name, exact: true }).click();
      await page.waitForFunction(value => document.querySelector('.i18n-examples__preview').lang === value, locale);
      await showPreview(playground);
      await settled(page);
      const messages = inkraLocales[locale];
      assert.equal(await form.locator('input[name="note"]').inputValue(), 'Untranslated draft');
      assert.equal(await form.getByRole('button', { name: messages['input.clear'], exact: true }).count(), 1);
      assert.equal(await form.getByRole('button', { name: messages['datePicker.clear'], exact: true }).count(), 1);
      const date = await form.locator('.inkra-date-picker__value').textContent();
      assert.equal(date, new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(2026, 9, 25)));
      await assertGeometry(page, form);
      await form.locator('.inkra-time-picker__trigger').click();
      await page.getByRole('button', { name: messages['common.cancel'], exact: true }).click();
      await form.scrollIntoViewIfNeeded();
      await settled(page);
      await assertPaint(form);
      const path = '/tmp/inkra-i18n-' + width + '-' + locale + '.png';
      await section.evaluate(node => {
        const header = document.querySelector('.app-header').getBoundingClientRect().height;
        window.scrollBy(0, node.getBoundingClientRect().top - header - 20);
      });
      await settled(page);
      await page.screenshot({ path, animations: 'disabled' });
      screenshots.push(path);
    }
    await setControls(playground, true);
    await playground.locator('.preview-controls').getByRole('switch').check();
    await showPreview(playground);
    await form.getByRole('button', { name: 'Effacer la note', exact: true }).waitFor();
    assert.equal(await form.getByRole('button', { name: 'Réinitialiser la date', exact: true }).count(), 1);
    const code = await readCode(playground);
    assert.match(code, /select.placeholder/);
    assert.match(code, /locale="fr"/);
    assert.match(code, /TimePicker/);
    assert.equal(await form.locator('input[name="note"]').inputValue(), 'Untranslated draft');
    assert(await form.locator('input[name="note"]').evaluate((node, previous) => node === previous, inputNode));
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 954 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/docs/internationalization', { waitUntil: 'domcontentloaded' });
  await page.locator('#internationalization').waitFor();
  // Vite may reload once when the fixture first optimizes a new package subpath.
  const mount = () => page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('section');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/InternationalizationFixture.tsx');
    window.i18nFixture = mount(container);
  });
  try { await mount(); } catch (error) {
    if (!String(error).includes('Execution context was destroyed')) throw error;
    await page.goto(base + '/docs/internationalization', { waitUntil: 'domcontentloaded' });
    await page.locator('#internationalization').waitFor();
    await mount();
  }
  const form = page.getByTestId('i18n-fixture');
  const note = form.locator('input[name="note"]');
  await note.fill('Untouched 日本語 {page} $&');
  const inputNode = await note.elementHandle();
  await note.focus();
  await note.evaluate(node => node.setSelectionRange(2, 7));
  for (const [locale] of languages) {
    await update(page, locale, { 'common.cancel': 'Outer cancel' });
    assert(await note.evaluate((node, previous) => node === previous && document.activeElement === node, inputNode));
    assert.deepEqual(await note.evaluate(node => [node.selectionStart, node.selectionEnd]), [2, 7]);
    assert.equal(await note.inputValue(), 'Untouched 日本語 {page} $&');
    const t = createInkraTranslator(locale);
    await form.getByRole('button', { name: t('inputNumber.increase'), exact: true }).waitFor();
    assert.equal(await form.getByRole('button', { name: t('tagInput.remove', { label: 'User {count} $& <img>' }), exact: true }).count(), 1);
    assert.equal(await form.getByTestId('nested').getByRole('button', { name: 'Inner clear', exact: true }).count(), 1);
    assert.equal(await form.getByTestId('nested').getByRole('button', { name: 'Outer cancel', exact: true }).count(), 1);
    assert.ok((await form.locator('.inkra-number-ticker').textContent()).includes(new Intl.NumberFormat(locale).format(900719925474099312345n)));
  }
  assert.deepEqual(await page.evaluate(() => window.i18nFixture.events), { mounts: 1, unmounts: 0 });
  await form.getByTestId('nested').getByRole('button', { name: inkraLocales.fr['common.save'], exact: true }).click();
  await form.getByText(inkraLocales.fr['editable.invalid'], { exact: true }).waitFor();

  await update(page, 'ja');
  await form.locator('.inkra-date-picker__trigger').click();
  const datePortal = page.locator('.inkra-date-picker__popover');
  await datePortal.getByRole('button', { name: inkraLocales.ja['datePicker.next'], exact: true }).waitFor();
  await update(page, 'fr', { 'datePicker.next': 'Next custom month', 'common.cancel': 'Custom cancel' });
  await datePortal.getByRole('button', { name: 'Next custom month', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('.inkra-date-picker__popover')?.lang === 'fr');
  await page.keyboard.press('Escape');
  await form.locator('.inkra-time-picker__trigger').click();
  await page.getByRole('button', { name: 'Custom cancel', exact: true }).last().click();
  await page.waitForFunction(() => document.querySelector('[data-testid="i18n-fixture"] .inkra-time-picker__trigger') === document.activeElement);

  const data = await form.evaluate(node => [...new FormData(node).entries()]);
  assert(data.some(([key, value]) => key === 'note' && value === 'Untouched 日本語 {page} $&'));
  assert(data.some(([key, value]) => key === 'date' && value === '2026-10-25'));
  assert(data.some(([key, value]) => key === 'time' && value === '09:30'));
  await assertGeometry(page, form);
  await page.emulateMedia({ forcedColors: 'active' });
  await settled(page);
  assert.equal(await form.getByRole('button', { name: inkraLocales.fr['input.clear'], exact: true }).count(), 1);
  await page.evaluate(() => window.i18nFixture.unmount());
  assert.deepEqual(await page.evaluate(() => window.i18nFixture.events), { mounts: 1, unmounts: 1 });
  await page.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, locales: languages.map(([locale]) => locale), widths: [1543, 1305, 390, 320], screenshots }, null, 2));
} finally {
  await browser.close();
}
