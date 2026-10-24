import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const events = () => page.evaluate(() => window.inputFeedbackFixture.events);
const waitForComputedStyle = (locator, property, expected) => locator.evaluate((node, options) => new Promise((resolve, reject) => {
  const deadline = performance.now() + 2000;
  const check = () => {
    const actual = getComputedStyle(node).getPropertyValue(options.property).trim();
    if (actual === options.expected) {
      resolve(actual);
      return;
    }
    if (performance.now() >= deadline) {
      reject(new Error(`Timed out waiting for ${options.property}: ${options.expected}; received ${actual}`));
      return;
    }
    requestAnimationFrame(check);
  };
  check();
}), { property, expected });
const dispatchKey = async (locator, init) => {
  await locator.evaluate((node, eventInit) => {
    node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...eventInit }));
  }, init);
};
const frameHeight = locator => locator.locator('.inkra-editable__frame').evaluate(node => node.getBoundingClientRect().height);

try {
  await page.goto(`${base}/docs/components/hotkey#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'input-feedback-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/input-feedback.tsx');
    window.inputFeedbackFixture = mount(container);
  });

  const hotkeyCase = page.getByTestId('hotkey-case');
  await hotkeyCase.waitFor();
  const hotkeyRoot = hotkeyCase.locator('.inkra-hotkey-input');
  const hotkeyInput = hotkeyCase.getByRole('textbox', { name: 'Record fixture shortcut' });
  const focusRing = hotkeyCase.locator('.inkra-hotkey-input__focus-ring');
  await hotkeyInput.focus();
  await page.waitForFunction(() => document.querySelector('[data-testid="hotkey-case"] .inkra-hotkey-input')?.getAttribute('data-recording') === 'true');
  assert.equal(await hotkeyRoot.getAttribute('data-recording'), 'true');
  assert.equal(await hotkeyCase.locator('.inkra-hotkey-input__recording').innerText(), 'Recording shortcut');
  assert.equal(await hotkeyCase.locator('.inkra-hotkey-input__status').textContent(), 'Recording shortcut');
  assert.equal(await waitForComputedStyle(focusRing, 'opacity', '1'), '1');

  await dispatchKey(hotkeyInput, { key: 'Escape', code: 'Escape' });
  await page.waitForFunction(() => window.inputFeedbackFixture.events.hotkeyCancel.length === 1
    && !document.querySelector('[data-testid="hotkey-case"] .inkra-hotkey-input')?.hasAttribute('data-recording'));
  assert.equal(await hotkeyRoot.getAttribute('data-recording'), null);
  assert.match(await hotkeyCase.innerText(), /Ctrl\s*\+\s*S/);
  assert.deepEqual((await events()).hotkeyCancel, ['cancel']);

  await hotkeyInput.focus();
  await page.waitForFunction(() => document.querySelector('[data-testid="hotkey-case"] .inkra-hotkey-input')?.getAttribute('data-recording') === 'true');
  await dispatchKey(hotkeyInput, { key: 'P', code: 'KeyP', ctrlKey: true, shiftKey: true });
  await page.waitForFunction(() => window.inputFeedbackFixture.events.hotkeyChange.length === 1
    && !document.querySelector('[data-testid="hotkey-case"] .inkra-hotkey-input')?.hasAttribute('data-recording'));
  assert.equal(await hotkeyRoot.getAttribute('data-recording'), null);
  assert.match(await hotkeyCase.innerText(), /Ctrl\s*\+\s*Shift\s*\+\s*P/);
  let log = await events();
  assert.equal(log.hotkeyChange.at(-1).details.reason, 'record');
  assert.deepEqual(log.hotkeyChange.at(-1).value.modifiers, ['control', 'shift']);

  await hotkeyInput.focus();
  await page.waitForFunction(() => document.querySelector('[data-testid="hotkey-case"] .inkra-hotkey-input')?.getAttribute('data-recording') === 'true');
  await dispatchKey(hotkeyInput, { key: 'K', code: 'KeyK', ctrlKey: true });
  const conflictAlert = hotkeyCase.getByRole('alert');
  await conflictAlert.waitFor();
  assert.equal(await conflictAlert.innerText(), 'Reserved shortcut');
  log = await events();
  assert.deepEqual(log.hotkeyConflict, ['Reserved shortcut']);
  assert.equal(log.hotkeyChange.at(-1).details.conflict, 'Reserved shortcut');

  for (const [size, expected] of [['sm', 36], ['md', 44], ['lg', 48]]) {
    const sizeCase = page.getByTestId(`hotkey-size-${size}`);
    const controlHeight = await sizeCase.locator('.inkra-hotkey-input__control').evaluate(node => node.getBoundingClientRect().height);
    const hitHeight = await sizeCase.getByRole('textbox', { name: `Hotkey ${size}` }).evaluate(node => node.getBoundingClientRect().height);
    assert.ok(Math.abs(controlHeight - expected) <= 1, `${size} Hotkey surface matches ${expected}px control size`);
    assert.ok(hitHeight >= 44, `${size} Hotkey input keeps at least a 44px hit target`);
  }

  const internalCase = page.getByTestId('internal-editable-case');
  const internalEditable = internalCase.locator('.inkra-editable');
  assert.equal(await internalCase.locator('[data-editable-display="true"][role="button"]').count(), 0);
  const viewHeight = await frameHeight(internalCase);
  assert.ok(viewHeight >= 44 && viewHeight < 45, `md hit row should be 44px, received ${viewHeight}`);
  await internalCase.locator('[data-editable-display="true"]').click();
  const internalInput = internalCase.locator('[data-editable-editor="true"] input');
  await internalInput.waitFor();
  assert.ok(Math.abs((await frameHeight(internalCase)) - viewHeight) <= 1, 'view/edit row height remains stable');
  await internalInput.fill('Cancelled title');
  await internalCase.getByRole('button', { name: 'Cancel internal' }).click();
  assert.match(await internalCase.locator('[data-editable-display="true"]').innerText(), /Internal title/);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Edit internal title');
  assert.deepEqual((await events()).internalCancel, ['Internal title']);

  await internalCase.getByRole('button', { name: 'Edit internal title' }).click();
  await internalInput.fill('Saved internal title');
  await page.evaluate(() => window.inputFeedbackFixture.updateInternalState({ readOnly: true }));
  await page.waitForFunction(() => document.querySelector('[data-testid="internal-editable-case"] button[aria-label="Save internal"]')?.disabled === true);
  assert.equal(await internalCase.getByRole('button', { name: 'Save internal' }).isDisabled(), true);
  assert.equal(await internalCase.getByRole('button', { name: 'Cancel internal' }).isDisabled(), false);
  await page.evaluate(() => window.inputFeedbackFixture.updateInternalState({ readOnly: false, disabled: true }));
  await page.waitForFunction(() => document.querySelector('[data-testid="internal-editable-case"] .inkra-editable')?.getAttribute('data-disabled') === 'true');
  assert.equal(await internalCase.getByRole('button', { name: 'Save internal' }).isDisabled(), true);
  await page.evaluate(() => window.inputFeedbackFixture.updateInternalState({ disabled: false }));
  await page.waitForFunction(() => !document.querySelector('[data-testid="internal-editable-case"] .inkra-editable')?.hasAttribute('data-disabled'));
  await internalCase.getByRole('button', { name: 'Save internal' }).click();
  assert.match(await internalCase.locator('[data-editable-display="true"]').innerText(), /Saved internal title/);
  assert.deepEqual((await events()).internalSave, ['Saved internal title']);

  const externalCase = page.getByTestId('external-blur-case');
  await externalCase.getByRole('button', { name: 'Edit external title' }).click();
  const externalInput = externalCase.locator('[data-editable-editor="true"] input');
  await externalInput.fill('Saved after root blur');
  await externalInput.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Save external');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Cancel external');
  await page.keyboard.press('Tab');
  await page.getByTestId('external-focus-target').waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="external-blur-case"] [data-editable-display="true"]'));
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'external-focus-target');
  assert.match(await externalCase.locator('[data-editable-display="true"]').innerText(), /Saved after root blur/);
  assert.deepEqual((await events()).externalSave, ['Saved after root blur']);

  for (const [size, expected] of [['sm', 36], ['md', 44], ['lg', 48]]) {
    const sizeCase = page.getByTestId(`size-${size}`);
    const viewGeometry = await sizeCase.locator('.inkra-editable').evaluate(root => {
      const height = selector => root.querySelector(selector)?.getBoundingClientRect().height ?? null;
      return {
        display: height('[data-editable-display="true"]'),
        surface: height('.inkra-editable__display-surface'),
        shell: height('.inkra-editable__display-shell'),
        frame: height('.inkra-editable__frame'),
        editButton: height('button[aria-label^="Edit "]'),
      };
    });
    assert.ok(Math.abs(viewGeometry.display - expected) <= 1,
      `${size} view surface matches ${expected}px control size; actual geometry ${JSON.stringify(viewGeometry)}`);
    assert.ok(Math.abs(viewGeometry.surface - expected) <= 1,
      `${size} PencilSurface matches ${expected}px control size; actual geometry ${JSON.stringify(viewGeometry)}`);
    assert.ok(viewGeometry.shell >= 44 && viewGeometry.frame >= 44 && viewGeometry.editButton >= 44,
      `${size} view keeps 44px hit geometry; actual geometry ${JSON.stringify(viewGeometry)}`);
    await sizeCase.getByRole('button', { name: `Edit ${size} value` }).click();
    const editGeometry = await sizeCase.locator('.inkra-editable').evaluate(root => {
      const height = selector => root.querySelector(selector)?.getBoundingClientRect().height ?? null;
      return {
        editorSurface: height('.inkra-field-control--input'),
        editorHit: height('.inkra-field-control-hit'),
        editor: height('.inkra-editable__editor'),
        frame: height('.inkra-editable__frame'),
        saveButton: height('button[aria-label^="Save "]'),
      };
    });
    assert.ok(Math.abs(editGeometry.editorSurface - expected) <= 1,
      `${size} editor surface matches ${expected}px control size; actual geometry ${JSON.stringify(editGeometry)}`);
    assert.ok(editGeometry.editorHit >= 44 && editGeometry.frame >= 44 && editGeometry.saveButton >= 44,
      `${size} editor keeps 44px hit geometry; actual geometry ${JSON.stringify(editGeometry)}`);
    await sizeCase.getByRole('button', { name: `Cancel ${size}` }).click();
  }

  const asyncCase = page.getByTestId('async-validation-case');
  await asyncCase.getByRole('button', { name: 'Edit async title' }).click();
  const asyncInput = asyncCase.locator('[data-editable-editor="true"] input');
  await asyncInput.fill('bad');
  await asyncCase.getByRole('button', { name: 'Save async' }).click();
  const asyncError = asyncCase.getByRole('alert');
  await asyncError.waitFor();
  assert.equal(await asyncError.innerText(), 'Async invalid');
  assert.equal(await asyncInput.getAttribute('aria-errormessage'), await asyncError.getAttribute('id'));
  assert.equal(await asyncCase.locator('[data-editable-editor="true"]').count(), 1);
  await asyncInput.fill('Validated title');
  await asyncCase.getByRole('button', { name: 'Save async' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="async-validation-case"] [data-editable-display="true"]'));
  log = await events();
  assert.deepEqual(log.asyncValidation, ['bad', 'Validated title']);
  assert.deepEqual(log.asyncSave, ['Validated title']);

  const customCase = page.getByTestId('custom-controlled-case');
  await customCase.getByRole('link', { name: 'Controlled note' }).click();
  assert.equal(await customCase.locator('[data-editable-editor="true"]').count(), 0, 'nested display link does not start editing');
  await customCase.getByRole('button', { name: 'Edit controlled note' }).click();
  const customEditor = customCase.locator('[data-editable-editor="true"] textarea');
  await customEditor.fill('Updated controlled note');
  await customCase.getByRole('button', { name: 'Save controlled' }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="custom-controlled-case"] [data-editable-display="true"]'));
  assert.equal(await customCase.getByRole('link').innerText(), 'Updated controlled note');
  assert.equal((await events()).customValue.at(-1), 'Updated controlled note');

  const preventedCase = page.getByTestId('prevented-blur-case');
  await preventedCase.getByRole('button', { name: 'Edit prevented blur' }).click();
  const preventedEditor = preventedCase.locator('[data-editable-editor="true"] textarea');
  await preventedEditor.fill('Unsaved prevented blur');
  await page.getByTestId('prevented-focus-target').click();
  await page.waitForFunction(() => window.inputFeedbackFixture.events.preventedBlur.length === 1);
  assert.equal(await preventedCase.locator('[data-editable-editor="true"]').count(), 1, 'preventDefault keeps editor open');
  log = await events();
  assert.deepEqual(log.preventedBlur, ['Unsaved prevented blur']);
  assert.deepEqual(log.preventedSave, []);

  assert.deepEqual(pageErrors, []);
  console.log('PASS Hotkey recording feedback and Editable focus-boundary, validation and controlled-editor behavior');
} finally {
  await page.evaluate(() => {
    window.inputFeedbackFixture?.unmount();
    document.getElementById('input-feedback-fixture')?.remove();
  }).catch(() => {});
  await browser.close();
}
