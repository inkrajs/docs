import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function valueIs(slider, value) {
  await slider.page().waitForFunction(({ node, value }) => node.getAttribute('aria-valuenow') === String(value),
    { node: await slider.elementHandle(), value });
}

async function controls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
  await playground.page().waitForFunction(({ node, open }) =>
    node.dataset.controlsPresent === String(open) && !node.querySelector('[data-playground-moving]'),
  { node: await playground.elementHandle(), open });
}

try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const text = (zh, en) => locale === 'zh-CN' ? zh : en;
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });

    await page.goto(`${base}/docs/components/slider#preview`);
    const sliderForm = page.locator('.component-example form');
    const volume = sliderForm.getByRole('slider').first();
    await valueIs(volume, 25);
    await volume.focus();
    await volume.press('ArrowRight');
    await valueIs(volume, 26);
    await sliderForm.evaluate(node => {
      node.addEventListener('reset', event => event.preventDefault(), { once: true });
      node.reset();
    });
    await page.waitForTimeout(40);
    await valueIs(volume, 26);
    assert.equal(await sliderForm.evaluate(node => new FormData(node).get('level')), '26');
    await sliderForm.getByRole('button', { name: text('重置', 'Reset'), exact: true }).click();
    await valueIs(volume, 25);
    assert(await sliderForm.getByRole('button', { name: text('重置', 'Reset'), exact: true }).evaluate(node => node === document.activeElement),
      'native reset must leave focus on the initiating button');

    await page.goto(`${base}/docs/components/range-slider#preview`);
    const playground = page.locator('.component-playground').first();
    const form = page.getByTestId('range-slider-form');
    const lower = form.getByRole('slider').first();
    await valueIs(lower, 20);
    await lower.focus();
    await lower.press('ArrowRight');
    await valueIs(lower, 25);
    await form.getByRole('button', { name: text('读取表单', 'Read form'), exact: true }).click();
    assert.deepEqual(await form.evaluate(node => new FormData(node).getAll('price[]')), ['25', '80']);
    assert.equal(await form.locator('output').textContent(), '25 - 80');
    await form.getByRole('button', { name: text('重置', 'Reset'), exact: true }).click();
    await valueIs(lower, 20);
    assert.equal(await form.locator('output').textContent(), '');
    await controls(playground, true);
    await playground.getByRole('tab', { name: text('交互', 'Interaction'), exact: true }).click();
    await playground.getByRole('switch', { name: text('允许端点交叉', 'Allow crossing'), exact: true }).click();
    await playground.getByRole('tab', { name: text('代码', 'Code'), exact: true }).click();
    assert.match(await playground.locator('.code-panel code').textContent(), /allowCross=\{true\}/);
    await playground.getByRole('tab', { name: text('预览', 'Preview'), exact: true }).click();
    await controls(playground, false);
    const upper = playground.locator('.preview-stage').getByRole('slider').nth(1);
    await upper.focus();
    await upper.press('End');
    await valueIs(upper, 100);
    await playground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-range-slider-docs-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    await page.goto(`${base}/docs/components/range-slider#api`);
    for (const prop of ['minDistance', 'allowCross', 'name / form / ref', 'orientation / dir / inverted']) {
      await page.getByRole('cell', { name: prop, exact: true }).waitFor();
    }
    assert.equal(await page.getByRole('cell', { name: 'minStepsBetweenThumbs', exact: true }).count(), 0);

    await page.goto(`${base}/docs/components/rating#preview`);
    const ratingPlayground = page.locator('.component-playground').first();
    await controls(ratingPlayground, true);
    await ratingPlayground.getByRole('combobox', { name: text('步进', 'Step'), exact: true }).click();
    await page.getByRole('option', { name: '1.5', exact: true }).click();
    await controls(ratingPlayground, false);
    const rating = ratingPlayground.getByRole('slider');
    await rating.focus();
    await rating.press('End');
    await valueIs(rating, 5);
    await rating.press('ArrowDown');
    await valueIs(rating, 4.5);
    assert.equal(await rating.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
    await page.waitForFunction(node => {
      const focus = node.querySelector('.inkra-rating__focus-ring');
      return focus && getComputedStyle(focus).opacity === '1';
    }, await rating.elementHandle());
    await ratingPlayground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-rating-docs-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    console.log(`PASS numeric controls docs, canceled reset, range form, localized controls/source/API, rating focus: ${width}px ${locale}`);
    await page.close();
  }
} finally {
  await browser.close();
}
