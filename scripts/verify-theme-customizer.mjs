import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];
const pixelHash = node => {
  const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
  return pixels.reduce((hash, value) => Math.imul(hash ^ value, 16777619) >>> 0, 2166136261);
};
async function changed(locator, before) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const after = await locator.evaluate(pixelHash);
    if (after !== before) return after;
    await locator.page().waitForTimeout(100);
  }
  assert.fail('rendering parameters must change actual canvas pixels');
}
try {
  for (const [width, locale] of [[1305, 'zh-CN'], [800, 'en'], [390, 'zh-CN'], [320, 'en']]) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await context.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/usage-guide`);
    const trigger = page.locator('.header-customize');
    await trigger.waitFor();
    const customBox = await trigger.boundingBox();
    const githubBox = await page.locator('.header-github').boundingBox();
    assert.ok(customBox.x + customBox.width <= githubBox.x && Math.abs(customBox.y - githubBox.y) < 1, 'customizer is immediately left of GitHub');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `header fits ${width}`);
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const expectedDefaults = {
      '--inkra-letter-variation': 0.2, '--inkra-letter-breaks': 0.5, '--inkra-letter-outline': 0.9,
      '--inkra-letter-fill': 0.9, '--inkra-letter-grain': 0.6, '--inkra-stroke-width': 2,
      '--inkra-stroke-amplitude': 1.5, '--inkra-wash-strength': 0.8, '--inkra-wash-spacing': 2,
      '--inkra-wash-roughness': 3, '--inkra-wash-angle': -45,
    };
    const readDefaults = (node, expected) => Object.fromEntries(Object.keys(expected).map(token => [token, parseFloat(getComputedStyle(node).getPropertyValue(token))]));
    assert.deepEqual(await page.locator('html').evaluate(readDefaults, expectedDefaults), expectedDefaults);
    assert.deepEqual(await dialog.locator('.theme-customizer__preview-card').evaluate(readDefaults, expectedDefaults), expectedDefaults);
    const mode = dialog.locator('.theme-customizer__mode');
    assert.equal(await mode.locator('legend').innerText(), locale === 'en' ? 'Theme mode' : '主题模式');
    assert.equal(await mode.locator('.inkra-radio-group__icon canvas').count(), 3);
    const modeLayout = await mode.evaluate(node => {
      const panel = node.parentElement.getBoundingClientRect();
      const frame = node.querySelector('.inkra-radio-group__frame').getBoundingClientRect();
      const legend = node.querySelector('legend').getBoundingClientRect();
      return { panel: panel.width, frame: frame.width, top: legend.top - panel.top,
        widths: [...node.querySelectorAll('.inkra-radio-group__item')].map(item => item.getBoundingClientRect().width) };
    });
    assert(Math.abs(modeLayout.panel - modeLayout.frame) < 1, 'mode fills the panel');
    assert(Math.max(...modeLayout.widths) - Math.min(...modeLayout.widths) < 1, 'mode choices have equal widths');
    assert(Math.abs(modeLayout.top - 20) < 1, 'panel padding owns the single 20px leading gap');
    await dialog.screenshot({ path: `/tmp/inkra-theme-mode-${width}.png` });
    await page.evaluate(() => document.fonts.ready);
    await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    assert.ok(await dialog.locator('.inkra-drawer__surface.inkra-pencil-surface--full').isVisible(), 'drawer uses borderless edge-to-edge paper');
    assert.equal(await dialog.locator('.inkra-drawer__edge').count(), 1);
    const drawerBox = await dialog.boundingBox();
    assert.ok(Math.abs(drawerBox.y) < 1 && Math.abs(drawerBox.x + drawerBox.width - width) < 1 && Math.abs(drawerBox.height - 954) < 1, `drawer touches top, right and bottom viewport edges: ${JSON.stringify(drawerBox)} at ${width}px`);
    const heading = await dialog.locator('.inkra-drawer__heading').boundingBox();
    const close = dialog.locator('.inkra-drawer__close-button');
    const closeBox = await close.boundingBox();
    assert.ok(Math.abs(heading.y + heading.height / 2 - closeBox.y - closeBox.height / 2) < 1, 'title and close button are vertically centered');
    assert.ok(await close.locator('.inkra-pencil-surface--outline').count(), 'close button has a default outline');
    assert.ok(await dialog.getByRole('button', { name: /^(取消|Cancel)$/ }).locator('.inkra-pencil-surface--outline').count(), 'cancel button has a default outline');
    await dialog.locator('.theme-customizer__lettering[data-pencil-ready="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const savedBefore = await page.evaluate(() => ({
      tokens: document.documentElement.getAttribute('style'),
      theme: document.documentElement.dataset.theme,
      settings: localStorage.getItem('inkra-docs-custom-theme-v1'),
    }));
    const globalText = page.locator('.page-heading h1 canvas').first();
    const globalTextBefore = await globalText.evaluate(pixelHash);
    assert.equal(await dialog.locator('.theme-customizer__sample .inkra-card').count(), 1);
    assert.equal(await dialog.locator('.theme-customizer__preview-card').evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)', 'no extra solid preview background');
    assert.ok(await dialog.locator('.theme-customizer__separator').isVisible());
    const letter = dialog.locator('.theme-customizer__lettering canvas');
    const line = dialog.locator('.theme-customizer__line');
    const surface = dialog.locator('.theme-customizer__sample .inkra-button__surface canvas').first();
    const surfaceBefore = await surface.evaluate(pixelHash);
    await dialog.locator('.theme-customizer__swatches button').nth(2).click();
    await changed(surface, surfaceBefore);
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      window.backgroundPaints = 0;
      window.backgroundInvalidations = 0;
      window.backgroundPaintTargets = [];
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args) {
        if (this.canvas.closest('#root')) {
          window.backgroundPaints++;
          window.backgroundPaintTargets.push({ element: this.canvas.parentElement?.outerHTML.slice(0, 400), stack: new Error().stack });
        }
        return draw.apply(this, args);
      };
      new MutationObserver(records => { window.backgroundInvalidations += records.length; }).observe(document.getElementById('root'), {
        attributes: true, subtree: true, attributeFilter: ['data-pencil-ready'],
      });
    });
    await dialog.getByRole('radio', { name: /^(深色|Dark)$/ }).check();
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => ({ paints: window.backgroundPaints, invalidations: window.backgroundInvalidations })), { paints: 0, invalidations: 0 }, `preview theme changes must not redraw or hide background canvases: ${await page.evaluate(() => JSON.stringify(window.backgroundPaintTargets))}`);
    assert.equal(await dialog.locator('.theme-customizer__preview-card').getAttribute('data-inkra-theme'), 'dark');
    await dialog.getByRole('tab', { name: /^(文字|Text)$/ }).click();
    const textBefore = await letter.evaluate(pixelHash);
    await dialog.getByRole('slider', { name: /填色浓度|Fill intensity/ }).press('End');
    await changed(letter, textBefore);
    await dialog.getByRole('tab', { name: /^(线条|Lines)$/ }).click();
    const cardInk = dialog.locator('.theme-customizer__preview-card > .inkra-pencil-surface__ink');
    const iconInk = dialog.locator('.theme-customizer__preview-card .inkra-pencil-icon');
    const lineBefore = await line.evaluate(pixelHash);
    const cardBefore = await cardInk.evaluate(pixelHash);
    const buttonBefore = await surface.evaluate(pixelHash);
    const iconBefore = await iconInk.evaluate(pixelHash);
    await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).press('End');
    await changed(line, lineBefore);
    await changed(cardInk, cardBefore);
    await changed(surface, buttonBefore);
    assert.equal(await iconInk.evaluate(pixelHash), iconBefore, 'icon weight is independent of the general stroke weight');
    const thickLine = await line.evaluate(pixelHash);
    const thickCard = await cardInk.evaluate(pixelHash);
    const thickButton = await surface.evaluate(pixelHash);
    const thickIcon = await iconInk.evaluate(pixelHash);
    const roughness = dialog.getByRole('slider', { name: /线条起伏|Stroke roughness/ });
    assert.equal(await roughness.getAttribute('aria-valuemax'), '4');
    await roughness.press('Home');
    for (let step = 0; step < 20; step++) await roughness.press('ArrowRight');
    assert.equal(await roughness.getAttribute('aria-valuenow'), '2');
    await page.waitForTimeout(150);
    const atTwo = await Promise.all([line, cardInk, surface, iconInk].map(node => node.evaluate(pixelHash)));
    await roughness.press('End');
    for (const [index, node] of [line, cardInk, surface, iconInk].entries()) await changed(node, atTwo[index]);
    await changed(line, thickLine);
    await changed(cardInk, thickCard);
    await changed(surface, thickButton);
    await changed(iconInk, thickIcon);
    await dialog.getByRole('tab', { name: /^(涂色|Fill)$/ }).click();
    const noWashCard = await cardInk.evaluate(pixelHash);
    for (const name of [/涂色浓度|Fill strength/, /笔触间距|Stroke spacing/, /涂色起伏|Fill roughness/, /涂色角度|Fill angle/]) {
      const before = await surface.evaluate(pixelHash);
      await dialog.getByRole('slider', { name }).press('End');
      await changed(surface, before);
      assert.equal(await cardInk.evaluate(pixelHash), noWashCard, 'fill edits do not alter the card outline or paper');
    }
    assert.deepEqual(await page.evaluate(() => ({
      tokens: document.documentElement.getAttribute('style'),
      theme: document.documentElement.dataset.theme,
      settings: localStorage.getItem('inkra-docs-custom-theme-v1'),
    })), savedBefore, 'draft changes never affect the global theme or storage');
    assert.equal(await globalText.evaluate(pixelHash), globalTextBefore, 'page lettering stays unchanged before save');
    await page.screenshot({ path: `/tmp/inkra-customizer-${width}.png` });
    assert.ok(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), 'drawer has no horizontal overflow');
    await page.evaluate(() => { window.backgroundPaints = 0; window.backgroundInvalidations = 0; });
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('header-customize'));
    assert.ok(await trigger.evaluate(node => node === document.activeElement), 'close restores trigger focus');
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => ({ paints: window.backgroundPaints, invalidations: window.backgroundInvalidations })), { paints: 0, invalidations: 0 }, 'discarding drafts must not redraw the background');
    await trigger.click();
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.backgroundPaints = 0; window.backgroundInvalidations = 0; });
    await dialog.getByRole('button', { name: /^(取消|Cancel)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => ({ paints: window.backgroundPaints, invalidations: window.backgroundInvalidations })), { paints: 0, invalidations: 0 }, 'closing without edits must not redraw the background');
    await trigger.click();
    await dialog.getByRole('tab', { name: /^(线条|Lines)$/ }).click();
    assert.equal(await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).getAttribute('aria-valuenow'), '2', 'Escape discards unsaved settings');
    await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).press('End');
    await dialog.getByRole('tab', { name: /^(文字|Text)$/ }).click();
    await dialog.getByRole('slider', { name: /填色浓度|Fill intensity/ }).press('End');
    await dialog.getByRole('tab', { name: /^(主题|Theme)$/ }).click();
    await dialog.locator('.theme-customizer__swatches button').nth(2).click();
    await dialog.getByRole('radio', { name: /^(深色|Dark)$/ }).check();
    await dialog.getByRole('button', { name: /^(保存|Save)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--inkra-stroke-width') === '3' && document.documentElement.dataset.theme === 'dark');
    await changed(globalText, globalTextBefore);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('inkra-docs-custom-theme-v1')).render.width), 3);
    await page.reload();
    await trigger.click();
    await dialog.getByRole('tab', { name: /^(线条|Lines)$/ }).click();
    assert.equal(await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).getAttribute('aria-valuenow'), '3');
    await dialog.getByRole('button', { name: /^(恢复默认|Reset)$/ }).click();
    assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--inkra-stroke-width')), '3', 'Reset only changes the draft');
    assert.equal(await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).getAttribute('aria-valuenow'), '2');
    await dialog.getByRole('button', { name: /^(取消|Cancel)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await trigger.click();
    await dialog.getByRole('tab', { name: /^(线条|Lines)$/ }).click();
    assert.equal(await dialog.getByRole('slider', { name: /线条粗细|Stroke weight/ }).getAttribute('aria-valuenow'), '3', 'Cancel discards draft reset');
    await dialog.getByRole('button', { name: /^(恢复默认|Reset)$/ }).click();
    await dialog.getByRole('button', { name: /^(保存|Save)$/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--inkra-stroke-width') === '' && document.documentElement.style.getPropertyValue('--inkra-accent') === '' && document.documentElement.dataset.theme === 'light');

    const sample = page.locator('.color-demo__column:visible').first();
    assert.equal(await sample.locator('.inkra-card').count(), 4);
    assert.equal(await sample.locator('.inkra-badge').count(), 4);
    assert.equal(await sample.locator('.inkra-checkbox').count(), 4);
    await sample.getByRole('button', { name: /仅看未完成|Open tasks only/ }).click();
    assert.equal(await sample.locator('.inkra-card').count(), 3);
    while (await sample.getByRole('checkbox').count()) await sample.getByRole('checkbox').first().click();
    assert.equal(await sample.locator('.inkra-card').count(), 0);
    assert.ok(await sample.locator('.inkra-empty').isVisible());
    assert.equal(await sample.getByRole('progressbar').getAttribute('aria-valuenow'), '4');
    await sample.getByRole('button', { name: /查看全部|View all/ }).click();
    assert.equal(await sample.locator('.inkra-card').count(), 4);
    await sample.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-usage-components-${width}.png` });
    await context.close();
    console.log(`PASS isolated card preview, save/cancel/reset, pixels, persistence, focus, responsive drawer and real task components: ${locale} ${width}px`);
  }
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('inkra-docs-custom-theme-v1', '{broken');
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/docs/usage-guide`);
  await page.locator('.header-customize').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: '深色', exact: true }).check();
  assert.equal(await dialog.locator('.theme-customizer__preview-card').getAttribute('data-inkra-theme'), 'dark');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await dialog.getByRole('tab', { name: '线条', exact: true }).click();
  assert.equal(await dialog.getByRole('slider', { name: '线条粗细' }).getAttribute('aria-valuenow'), '2');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await dialog.getByText('设置已生效，但暂时无法保存到本机。').waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await dialog.locator('.theme-customizer__lettering canvas').evaluate(node => getComputedStyle(node).display), 'none');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await context.close();
  console.log('PASS malformed/blocked storage, saved dark mode and forced-color text fallback');
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
