import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const waitForComputedStyle = (locator, property, expected) => locator.evaluate((node, options) => new Promise((resolve, reject) => {
  const deadline = performance.now() + 2000;
  const check = () => {
    const actual = getComputedStyle(node).getPropertyValue(options.property).trim();
    if (actual === options.expected) return resolve(actual);
    if (performance.now() >= deadline) return reject(new Error(`Timed out waiting for ${options.property}: ${options.expected}; received ${actual}`));
    requestAnimationFrame(check);
  };
  check();
}), { property, expected });

try {
  await page.goto(`${base}/docs/components/upload#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'upload-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/UploadRefinementFixture.tsx');
    window.uploadRefinementFixture = mount(container);
  });

  const pickerCase = page.getByTestId('picker-case');
  await pickerCase.waitFor();
  const nativeInput = pickerCase.locator('input[type="file"]');
  const dropzone = pickerCase.getByRole('button', { name: 'Picker fixture' });
  assert.equal(await nativeInput.getAttribute('aria-hidden'), 'true');
  assert.equal(await nativeInput.getAttribute('tabindex'), '-1');
  assert.equal(await nativeInput.evaluate(node => node.tabIndex), -1);
  assert.equal(await dropzone.getAttribute('tabindex'), '0');
  await dropzone.focus();
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('inkra-upload__dropzone')), true);
  assert.equal(await waitForComputedStyle(pickerCase.locator('.inkra-upload__focus-ring'), 'opacity', '1'), '1');

  await dropzone.evaluate(node => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['drag'], 'drag-fixture.txt', { type: 'text/plain' }));
    node.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await page.waitForFunction(() => document.querySelector('[data-testid="picker-case"] .inkra-upload__dropzone')?.hasAttribute('data-drag-active'));
  await page.evaluate(() => window.uploadRefinementFixture.setDisabled(true));
  await page.waitForFunction(() => {
    const zone = document.querySelector('[data-testid="picker-case"] .inkra-upload__dropzone');
    return zone?.getAttribute('tabindex') === '-1' && !zone.hasAttribute('data-drag-active');
  });
  assert.equal(await nativeInput.isDisabled(), true);
  await page.evaluate(() => window.uploadRefinementFixture.setDisabled(false));
  await page.waitForFunction(() => document.querySelector('[data-testid="picker-case"] .inkra-upload__dropzone')?.getAttribute('tabindex') === '0');

  const narrow = page.getByTestId('narrow-case');
  const narrowGeometry = await narrow.evaluate(root => {
    const upload = root.querySelector('.inkra-upload');
    const itemRects = [...root.querySelectorAll('.inkra-upload__item-surface')].map(item => {
      const itemRect = item.getBoundingClientRect();
      const actionsRect = item.querySelector('.inkra-upload__actions')?.getBoundingClientRect();
      const buttons = [...item.querySelectorAll('.inkra-upload__actions > button')].map(button => {
        const rect = button.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });
      return {
        item: { left: itemRect.left, right: itemRect.right, width: itemRect.width },
        actions: actionsRect ? { left: actionsRect.left, right: actionsRect.right, width: actionsRect.width } : null,
        buttons,
      };
    });
    const nameSource = root.querySelector('.inkra-upload__name .inkra-pencil-text__source');
    const nameStyle = nameSource ? getComputedStyle(nameSource) : null;
    return {
      wrapperWidth: root.getBoundingClientRect().width,
      clientWidth: upload?.clientWidth ?? 0,
      scrollWidth: upload?.scrollWidth ?? 0,
      itemRects,
      nameClientWidth: nameSource?.clientWidth ?? 0,
      nameScrollWidth: nameSource?.scrollWidth ?? 0,
      nameTextOverflow: nameStyle?.textOverflow ?? null,
      actionDisplay: getComputedStyle(root.querySelector('.inkra-upload__actions')).display,
      actionColumns: getComputedStyle(root.querySelector('.inkra-upload__actions')).gridTemplateColumns,
      actionTextOverflow: getComputedStyle(root.querySelector('.inkra-upload__actions .inkra-pencil-text__source')).textOverflow,
    };
  });
  assert.ok(Math.abs(narrowGeometry.wrapperWidth - 220) <= 1, `fixture is 220px; ${JSON.stringify(narrowGeometry)}`);
  assert.ok(narrowGeometry.scrollWidth <= narrowGeometry.clientWidth + 1, `narrow Upload does not overflow; ${JSON.stringify(narrowGeometry)}`);
  assert.equal(narrowGeometry.actionDisplay, 'grid');
  assert.notEqual(narrowGeometry.actionColumns, 'none');
  assert.equal(narrowGeometry.actionTextOverflow, 'ellipsis');
  for (const geometry of narrowGeometry.itemRects) {
    assert.ok(geometry.actions.left >= geometry.item.left - 1 && geometry.actions.right <= geometry.item.right + 1,
      `actions stay inside item; ${JSON.stringify(geometry)}`);
    for (const button of geometry.buttons) {
      assert.ok(button.left >= geometry.item.left - 1 && button.right <= geometry.item.right + 1,
        `button stays inside item; ${JSON.stringify({ geometry, button })}`);
    }
  }
  assert.ok(narrowGeometry.nameScrollWidth > narrowGeometry.nameClientWidth, `long file name truncates; ${JSON.stringify(narrowGeometry)}`);
  assert.equal(narrowGeometry.nameTextOverflow, 'ellipsis');

  const asyncCase = page.getByTestId('async-case');
  await asyncCase.getByRole('button', { name: 'Upload this deliberately long action label' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="async-case"] .inkra-upload__item')?.getAttribute('data-status') === 'uploading');
  await asyncCase.getByRole('button', { name: 'Cancel this deliberately long action label' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="async-case"] .inkra-upload__item')?.getAttribute('data-status') === 'cancelled');
  await page.evaluate(() => window.uploadRefinementFixture.resolveUpload());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 20)));
  assert.equal(await asyncCase.locator('.inkra-upload__item').getAttribute('data-status'), 'cancelled');
  assert.deepEqual(await page.evaluate(() => window.uploadRefinementFixture.events.asyncReasons), ['upload-start', 'cancel']);

  await page.emulateMedia({ forcedColors: 'active' });
  await page.keyboard.press('Tab');
  await dropzone.focus();
  assert(await dropzone.evaluate(node => node.matches(':focus-visible')), 'keyboard modality exposes the focus indicator');
  assert.equal(await dropzone.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  await page.emulateMedia({ forcedColors: 'none' });

  assert.deepEqual(pageErrors, []);
  console.log('PASS Upload picker focus, disabled drag cleanup, narrow actions and stale async completion');
} finally {
  await page.evaluate(() => {
    window.uploadRefinementFixture?.unmount();
    document.getElementById('upload-refinement-fixture')?.remove();
  }).catch(() => {});
  await browser.close();
}
