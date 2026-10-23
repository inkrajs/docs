import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const update = async options => { await page.evaluate(next => window.propertyFixture.update(next), options); await settle(); };
const eventLog = () => page.evaluate(() => window.propertyFixture.events);
const value = () => page.getByRole('slider', { name: 'Score' }).getAttribute('aria-valuenow');
try {
  await page.goto(`${base}/docs/components/tree#preview`);
  await page.locator('.component-playground .inkra-tree').waitFor();
  await page.evaluate(async () => {
    document.getElementById('root').style.display = 'none';
    const container = document.createElement('section');
    container.id = 'property-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/property-extensions.tsx');
    window.propertyFixture = mount(container);
  });
  await page.getByRole('slider', { name: 'Score' }).waitFor();
  const rating = page.getByRole('slider', { name: 'Score' });
  const fifth = rating.locator('.inkra-rating__symbol-target').nth(4);
  await fifth.hover({ position: { x: 40, y: 20 } });
  assert.equal(await value(), '2.5');
  assert.equal((await eventLog()).preview.at(-1), 5);
  const previewCount = (await eventLog()).preview.length;
  await fifth.hover({ position: { x: 39, y: 20 } });
  assert.equal((await eventLog()).preview.length, previewCount, 'deduplicated hover callback');
  await fifth.click({ position: { x: 40, y: 20 } });
  assert.equal(await value(), '5');
  assert.equal((await eventLog()).preview.at(-1), null);
  assert.equal(await page.evaluate(() => new FormData(document.getElementById('rating-form')).get('score')), '5');
  await page.getByRole('button', { name: 'Reset rating', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.inkra-rating').getAttribute('aria-valuenow') === '2.5');
  assert.deepEqual((await eventLog()).value, [5], 'reset is not a committed user change');
  await rating.press('ArrowRight');
  assert.equal(await value(), '3');
  await update({ preventReset: true });
  await page.getByRole('button', { name: 'Reset rating', exact: true }).click();
  await settle();
  assert.equal(await value(), '3');
  await update({ preventReset: false, form: 'other-form', hoverPreview: false });
  await fifth.hover({ position: { x: 40, y: 20 } });
  assert.equal(await rating.getAttribute('data-previewing'), null);
  await page.getByRole('button', { name: 'Reset rating', exact: true }).click();
  await settle();
  assert.equal(await value(), '3', 'old owner no longer resets the rating');
  await page.getByRole('button', { name: 'Reset other', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.inkra-rating').getAttribute('aria-valuenow') === '2.5');
  await update({ disabled: true });
  assert.equal(await page.evaluate(() => new FormData(document.getElementById('other-form')).has('score')), false);
  await update({ disabled: false, readOnly: true });
  await rating.press('ArrowRight');
  assert.equal(await value(), '2.5');
  assert.equal(await page.evaluate(() => new FormData(document.getElementById('other-form')).get('score')), '2.5');
  await update({ readOnly: false, ratingValue: 4 });
  await page.getByRole('button', { name: 'Reset other', exact: true }).click();
  await settle();
  assert.equal(await value(), '4', 'controlled value survives reset');
  await update({ hoverPreview: true, count: 3, step: 1 });
  assert.equal(await value(), '3');

  await page.getByRole('button', { name: 'Dismiss notice', exact: true }).click();
  assert.equal(await page.locator('.inkra-alert').count(), 0);
  await update({ alertOpen: true });
  await page.getByRole('button', { name: 'Dismiss notice', exact: true }).click();
  assert.equal(await page.locator('.inkra-alert').count(), 1, 'controlled close waits for parent');
  assert.deepEqual((await eventLog()).close, [false, false]);
  await update({ alertOpen: false });
  assert.equal(await page.getByRole('button', { name: 'Dismiss notice' }).count(), 0);

  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  assert.equal(await page.locator('.inkra-pagination [aria-current="page"]').getAttribute('aria-label'), 'Page 3');
  await update({ simple: true });
  assert.equal(await page.locator('.inkra-pagination__summary').innerText(), '3 of 10');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  assert.equal(await page.locator('.inkra-pagination__summary').innerText(), '4 of 10');
  await update({ total: 1, hideSingle: true });
  assert.equal(await page.locator('.inkra-pagination').count(), 0);
  assert.deepEqual((await eventLog()).page, [3, 4]);
  await update({ total: 0, hideSingle: false });
  assert.equal(await page.locator('.inkra-pagination__summary').innerText(), '0 of 0');
  await update({ total: 4, page: 2, simple: false, previousNext: false });
  assert.equal(await page.getByRole('button', { name: 'Next page', exact: true }).count(), 0);
  assert.equal(await page.locator('.inkra-pagination button').count(), 4);

  const tree = page.getByRole('treegrid', { name: 'Folders' });
  await tree.getByRole('button', { name: 'Collapse item' }).click();
  assert.match(await tree.innerText(), /Closed level 1/);
  await tree.getByRole('button', { name: 'Expand item' }).click();
  assert.match(await tree.innerText(), /Note level 2/);
  await update({ indent: 40, size: 'lg', rtl: true, alertOpen: true });
  const rows = tree.locator('.inkra-tree__item-content');
  await rows.last().click();
  assert.equal(await tree.locator('[aria-selected="true"]').count(), 1);
  assert.equal(await rows.last().evaluate(node => getComputedStyle(node).paddingRight), '40px');
  assert((await rows.first().boundingBox()).height >= 52);
  const target = await tree.getByRole('button', { name: 'Collapse item' }).boundingBox();
  assert(target.width >= 44 && target.height >= 44);
  const skeleton = page.locator('.inkra-skeleton');
  assert.equal(await skeleton.evaluate(node => getComputedStyle(node).height), '40px');
  assert.equal(await skeleton.evaluate(node => getComputedStyle(node).animationName), 'inkra-skeleton-pulse');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await skeleton.evaluate(node => getComputedStyle(node).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
  assert.equal(await skeleton.evaluate(node => getComputedStyle(node).animationName), 'none');
  await page.emulateMedia({ forcedColors: 'none' });
  console.log('PASS installed-package controlled/uncontrolled, reset, hover, RTL and reduced motion');
  await page.evaluate(() => {
    window.propertyFixture.unmount();
    document.getElementById('property-fixture').remove();
    document.getElementById('root').style.display = '';
  });

  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const locale of ['zh-CN', 'en']) {
      await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      for (const component of ['tree', 'pagination', 'rating', 'alert', 'skeleton']) {
        await page.goto(`${base}/docs/components/${component}#preview`);
        const playground = page.locator('.component-playground');
        await playground.waitFor();
        await setPlaygroundControls(playground, true);
        const controls = playground.locator('.preview-controls');
        let expectedCode;
        const choose = async (name, option) => {
          await controls.getByRole('combobox', { name, exact: true }).click();
          await page.getByRole('option', { name: option, exact: true }).click();
        };
        if (component === 'tree') {
          await controls.getByRole('tab', { name: /布局|Layout/, exact: true }).click();
          await choose(/层级缩进|Level indentation/, '40 px');
          await choose(/行密度|Row density/, /宽松|Relaxed/);
          expectedCode = /indent=\{40\} size="lg"/;
        } else if (component === 'pagination') {
          await controls.getByRole('tab', { name: /布局|Layout/, exact: true }).click();
          await controls.getByRole('switch', { name: /简洁模式|Simple mode/, exact: true }).click();
          expectedCode = /simple=\{true\}/;
        } else if (component === 'rating') {
          await controls.getByRole('tab', { name: /交互|Interaction/, exact: true }).click();
          await controls.getByRole('switch', { name: /悬停预览|Hover preview/, exact: true }).click();
          expectedCode = /hoverPreview=\{false\}/;
        } else if (component === 'alert') {
          await controls.getByRole('tab', { name: /交互|Interaction/, exact: true }).click();
          await controls.getByRole('switch', { name: /允许关闭|Dismissible/, exact: true }).click();
          expectedCode = /closable=\{true\}/;
        } else {
          await choose(/动画|Animation/, /呼吸|Pulse/);
          expectedCode = /animation="pulse"/;
        }
        await setPlaygroundControls(playground, false);
        await playground.getByRole('tab', { name: /代码|Code/, exact: true }).click();
        assert.match(await playground.locator('.code-panel code').textContent(), expectedCode);
        await playground.getByRole('tab', { name: /预览|Preview/, exact: true }).click();
        await page.evaluate(async () => { await document.fonts.ready; });
        await settle();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${component}: ${width}px overflow`);
        const painted = await playground.locator('canvas').evaluateAll(canvases => canvases.some(canvas => {
          if (!canvas.width || !canvas.height) return false;
          const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          return data.some((value, index) => index % 4 === 3 && value > 0);
        }));
        assert(painted, `${component}: pencil pixels rendered`);
        if (component === 'alert') {
          await playground.getByRole('button', { name: /关闭通知|Dismiss notification/, exact: true }).click();
          assert.equal(await playground.locator('.inkra-alert').count(), 0);
          await playground.getByRole('button', { name: /重新显示通知|Show notification again/, exact: true }).click();
        }
        await playground.screenshot({ path: `/tmp/inkra-properties-${component}-${locale}-${width}.png` });
      }
    }
    console.log(`PASS localized docs, canvas pixels and screenshots at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
