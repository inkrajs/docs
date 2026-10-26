import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { chooseDocsOption, setPlaygroundControls } from './playground-test-helpers.mjs';
import { infiniteScrollCopy } from '../src/components/infiniteScrollCopy.ts';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

async function openControls(page, route) {
  await page.goto(`${base}/docs/components/${route}#preview`);
  const playground = page.locator('.playground').first();
  await playground.waitFor();
  if (await playground.locator('.playground-config-toggle').count()) await setPlaygroundControls(playground, true);
  return playground.locator('.preview-controls');
}

async function verifyFields(controls, route) {
  const fields = controls.locator('.docs-select');
  assert(await fields.count() > 0, `${route} has shared configuration fields`);
  for (const field of await fields.all()) {
    const count = Number(await field.getAttribute('data-option-count'));
    const presentation = await field.getAttribute('data-presentation');
    assert.equal(presentation, count >= 2 && count <= 4 ? 'radio' : 'select', `${route}: ${count} choices`);
    if (presentation === 'radio') {
      assert.equal(await field.locator('input[type="radio"]').count(), count);
      assert(await field.locator('fieldset').getAttribute('aria-label'));
      assert.equal(await field.locator('fieldset').getAttribute('data-variant'), 'segmented');
      assert.equal(await field.locator('.inkra-radio-group__mark').count(), 0, 'no generic radio dots');
      const labels = await field.locator('.docs-choice-label').evaluateAll(nodes => nodes.map(node => {
        if (!node.getClientRects().length) return true;
        const style = getComputedStyle(node);
        return style.whiteSpace === 'nowrap' && node.getBoundingClientRect().height <= parseFloat(style.lineHeight) + 1;
      }));
      assert(labels.every(Boolean), `${route}: visible labels stay on one line`);
    }
  }
}

async function verifyIcons(group, count, distinct = true) {
  await group.scrollIntoViewIfNeeded();
  const icons = group.locator('.docs-choice-icon');
  assert.equal(await icons.count(), count);
  const names = await icons.evaluateAll(nodes => nodes.map(node => node.dataset.choiceIcon));
  if (distinct) assert.equal(new Set(names).size, count, 'each choice has a corresponding symbol');
  await group.page().waitForFunction(() => {
    const canvases = [...document.querySelectorAll('.docs-choice-icon canvas')];
    return canvases.length > 0 && canvases.every(canvas => canvas.dataset.pencilIconReady === 'true');
  });
  const results = await icons.evaluateAll(nodes => nodes.map(node => {
    const canvas = node.querySelector('canvas');
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const item = node.closest('.inkra-radio-group__item');
    const box = item.getBoundingClientRect();
    const labelElement = item.querySelector('.inkra-selection-control__label');
    const label = labelElement.getBoundingClientRect();
    return {
      ink: pixels.some((value, index) => index % 4 === 3 && value > 0),
      fits: !labelElement.getClientRects().length || (label.left >= box.left - 1 && label.right <= box.right + 1 && label.bottom <= box.bottom + 1),
      touch: box.width >= 44 && box.height >= 44,
    };
  }));
  assert(results.every(result => result.ink && result.fits && result.touch), JSON.stringify(results));
}

try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
  for (const route of ['button', 'input', 'select', 'slider', 'loading', 'guide', 'layout', 'grid', 'infinite-scroll', 'tree-select', 'popover']) {
    const controls = await openControls(page, route);
    await verifyFields(controls, route);
    if (route === 'button') {
      await verifyIcons(controls.getByRole('radiogroup', { name: '内容对齐', exact: true }), 3);
      await chooseDocsOption(controls, '内容对齐', '居中');
      assert.equal(await page.locator('#button-demo-panel-preview .inkra-button').getAttribute('data-align'), 'center');
      assert.equal(await controls.getByRole('combobox', { name: '外观', exact: true }).count(), 1);
    }
    if (route === 'infinite-scroll') {
      const copy = infiniteScrollCopy('zh-CN');
      const directions = controls.getByRole('radiogroup', { name: copy.directions, exact: true });
      await verifyIcons(directions, 3);
      assert.equal(await directions.locator('..').getAttribute('data-option-labels'), 'hidden');
      await directions.getByRole('radio', { name: copy.bottom, exact: true }).hover();
      await page.getByRole('tooltip', { name: copy.bottom, exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await page.screenshot({ path: '/tmp/inkra-docs-icon-choices-desktop.png' });
    }
    if (route === 'popover') {
      const alignment = controls.getByRole('radiogroup', { name: '对齐', exact: true });
      await chooseDocsOption(controls, '方向', '左');
      assert.match(await alignment.locator('.docs-choice-icon').first().getAttribute('data-choice-icon'), /vertical/i);
      await chooseDocsOption(controls, '方向', '上');
      assert.match(await alignment.locator('.docs-choice-icon').first().getAttribute('data-choice-icon'), /horizontal/i);
    }
    if (route === 'select') {
      const preview = page.locator('.preview-stage').first();
      assert(await preview.getByRole('combobox').count() > 0, 'Select demo remains a real dropdown');
    }
    if (route === 'tree-select') {
      const disabled = controls.locator('.docs-select fieldset:disabled input');
      assert(await disabled.count() > 0, 'dependent choices retain disabled state');
      for (const input of await disabled.all()) assert(await input.isDisabled());
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} has no page overflow`);
    console.log(`PASS shared choices: ${route}`);
  }
  await page.close();

  for (const [locale, width, colorScheme] of [...['zh-CN', 'en', 'ja', 'ko', 'fr'].map(locale => [locale, 390, 'light']), ['zh-CN', 320, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, colorScheme, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme: colorScheme });
    const controls = await openControls(page, 'infinite-scroll');
    await verifyFields(controls, locale);
    const text = infiniteScrollCopy(locale);
    const group = controls.getByRole('radiogroup', { name: text.directions, exact: true });
    await verifyIcons(group, 3);
    await verifyIcons(controls.getByRole('radiogroup', { name: text.interaction, exact: true }), 3);
    const first = group.getByRole('radio', { name: text.bottom, exact: true });
    await chooseDocsOption(controls, text.directions, text.bottom);
    assert.deepEqual(await page.getByTestId('infinite-scroll-board').locator('[data-active]').evaluateAll(nodes => nodes.map(n => n.dataset.direction)), ['bottom']);
    await page.evaluate(() => document.activeElement?.blur());
    await first.focus();
    await page.getByRole('tooltip', { name: text.bottom, exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');
    assert(await group.getByRole('radio', { name: text.vertical, exact: true }).isChecked());
    assert.deepEqual(await page.getByTestId('infinite-scroll-board').locator('[data-active]').evaluateAll(nodes => nodes.map(n => n.dataset.direction)), ['top', 'bottom']);
    await group.scrollIntoViewIfNeeded();
    const box = await group.boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= width + 1, `${locale} radio group stays in viewport`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (locale === 'fr') {
      const triggers = controls.getByRole('radiogroup', { name: text.interaction, exact: true });
      assert.equal(await triggers.locator('..').getAttribute('data-option-labels'), 'visible');
      await triggers.scrollIntoViewIfNeeded();
      assert(await triggers.locator('.docs-choice-label').evaluateAll(nodes => nodes.some(node => {
        const source = node.querySelector('.inkra-pencil-text__source');
        return node.classList.contains('inkra-pencil-text--ellipsis')
          && source.scrollWidth > source.clientWidth
          && getComputedStyle(source).textOverflow === 'ellipsis'
          && node.querySelector('canvas')?.dataset.lines === '1';
      })), 'long French labels use the single-line pencil ellipsis renderer while retaining the full DOM name');
      await triggers.getByRole('radio', { name: text.automatic, exact: true }).focus();
      await page.getByRole('tooltip', { name: text.automatic, exact: true }).waitFor();
      await page.keyboard.press('Escape');
    }
    await page.screenshot({ path: `/tmp/inkra-docs-choices-${locale}-${width}.png` });
    console.log(`PASS localized mobile choices and keyboard: ${locale}, ${width}px, ${colorScheme}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
