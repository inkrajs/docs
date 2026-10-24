import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

const fixtureEvents = () => page.evaluate(() => window.treeSelectRefinementFixture.events);
const flushReset = () => page.evaluate(() => new Promise(resolve => setTimeout(resolve, 20)));
const waitForValue = (testId, value) => page.waitForFunction(({ testId, value }) => {
  const root = document.querySelector(`[data-testid="${testId}"] .inkra-tree-select`);
  const text = root?.querySelector('.inkra-tree-select__value')?.textContent?.trim();
  return text === value;
}, { testId, value });

try {
  await page.goto(`${base}/docs/components/tree-select#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'tree-select-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/tree-select-refinement.tsx');
    window.treeSelectRefinementFixture = mount(container);
  });

  const sizes = page.getByTestId('sizes');
  await sizes.waitFor();
  assert.equal(await sizes.locator('.inkra-tree-select__trigger .inkra-tree-select__clear').count(), 0, 'clear is never nested inside trigger');
  for (const [size, expected] of [['sm', 36], ['md', 44], ['lg', 48]]) {
    const sizeCase = page.getByTestId(`size-${size}`);
    const geometry = await sizeCase.locator('.inkra-tree-select').evaluate(root => {
      const height = selector => root.querySelector(selector)?.getBoundingClientRect().height ?? null;
      const rect = node => {
        const bounds = node?.getBoundingClientRect();
        return bounds ? { left: bounds.left, right: bounds.right, width: bounds.width } : null;
      };
      const control = root.querySelector('.inkra-tree-select__control');
      const trigger = root.querySelector('.inkra-tree-select__trigger');
      const clear = root.querySelector('.inkra-tree-select__clear');
      const ellipsis = root.querySelector('.inkra-pencil-text--ellipsis');
      const source = root.querySelector('.inkra-pencil-text--ellipsis > .inkra-pencil-text__source');
      const sourceStyle = source ? getComputedStyle(source) : null;
      return {
        wrapper: rect(root.parentElement),
        rootRect: rect(root),
        controlRect: rect(control),
        triggerRect: rect(trigger),
        clearRect: rect(clear),
        root: root.getBoundingClientRect().height,
        control: height('.inkra-tree-select__control'),
        trigger: height('.inkra-tree-select__trigger'),
        triggerSurface: height('.inkra-tree-select__trigger .inkra-button__surface'),
        clear: height('.inkra-tree-select__clear'),
        clearSurface: height('.inkra-tree-select__clear .inkra-button__surface'),
        controlCanvasCount: control?.querySelectorAll(':scope > .inkra-pencil-surface__ink').length ?? 0,
        ellipsisClientWidth: ellipsis?.clientWidth ?? 0,
        ellipsisScrollWidth: ellipsis?.scrollWidth ?? 0,
        sourceClientWidth: source?.clientWidth ?? 0,
        sourceScrollWidth: source?.scrollWidth ?? 0,
        sourceOverflow: sourceStyle?.overflow ?? null,
        sourceTextOverflow: sourceStyle?.textOverflow ?? null,
        sourceWhiteSpace: sourceStyle?.whiteSpace ?? null,
      };
    });
    assert.ok(Math.abs(geometry.wrapper.width - 240) <= 1 && Math.abs(geometry.rootRect.width - 240) <= 1,
      `${size} fixture constrains the shared control to 240px; ${JSON.stringify(geometry)}`);
    assert.ok(Math.abs(geometry.control - expected) <= 1, `${size} shared frame is ${expected}px; ${JSON.stringify(geometry)}`);
    assert.ok(Math.abs(geometry.triggerSurface - expected) <= 1, `${size} trigger surface is ${expected}px; ${JSON.stringify(geometry)}`);
    assert.ok(Math.abs(geometry.clearSurface - expected) <= 1, `${size} clear surface is ${expected}px; ${JSON.stringify(geometry)}`);
    assert.ok(geometry.root >= 44 && geometry.trigger >= 44 && geometry.clear >= 44, `${size} hit areas remain 44px; ${JSON.stringify(geometry)}`);
    assert.equal(geometry.controlCanvasCount, 1, `${size} control owns one shared outline canvas`);
    assert.ok(geometry.triggerRect.left >= geometry.controlRect.left - 1
      && geometry.triggerRect.right <= geometry.controlRect.right + 1
      && geometry.clearRect.left >= geometry.controlRect.left - 1
      && geometry.clearRect.right <= geometry.controlRect.right + 1,
    `${size} trigger and clear action remain inside the shared frame; ${JSON.stringify(geometry)}`);
    assert.ok(geometry.triggerRect.right <= geometry.clearRect.left + 1
      || geometry.clearRect.right <= geometry.triggerRect.left + 1,
    `${size} trigger and clear action do not overlap; ${JSON.stringify(geometry)}`);
    assert.ok(geometry.sourceScrollWidth > geometry.sourceClientWidth,
      `${size} actual PencilText source overflows its constrained width; ${JSON.stringify(geometry)}`);
    assert.equal(geometry.sourceTextOverflow, 'ellipsis', `${size} actual PencilText source uses ellipsis`);
    assert.equal(geometry.sourceOverflow, 'hidden', `${size} actual PencilText source clips overflow`);
    assert.equal(geometry.sourceWhiteSpace, 'nowrap', `${size} actual PencilText source stays on one line`);
  }

  const states = page.getByTestId('states');
  const readonly = states.locator('.inkra-tree-select').first();
  const disabled = states.locator('.inkra-tree-select').nth(1);
  assert.equal(await readonly.evaluate(node => getComputedStyle(node).direction), 'rtl');
  assert.equal(await readonly.getAttribute('data-invalid'), 'true');
  assert.equal(await readonly.getAttribute('data-readonly'), 'true');
  assert.equal(await readonly.getByRole('button', { name: 'Clear readonly' }).isDisabled(), true);
  await readonly.getByRole('button', { name: 'Readonly destination' }).click();
  assert.equal(await page.getByRole('dialog', { name: 'Tree options' }).count(), 0, 'readonly trigger does not open');
  assert.equal(await disabled.getAttribute('data-disabled'), 'true');
  assert.equal(await disabled.getByRole('button', { name: 'Disabled destination' }).isDisabled(), true);

  const internal = page.getByTestId('internal-form');
  const internalTrigger = internal.getByRole('button', { name: 'Internal destination' });
  const internalClear = internal.locator('.inkra-tree-select__clear');
  await internalTrigger.click();
  await page.getByRole('searchbox', { name: 'Search internal' }).waitFor();
  await internalClear.click();
  await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-label="Tree options"]'));
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Internal destination');
  assert.equal(await internalClear.getAttribute('aria-hidden'), 'true');
  assert.equal(await internalClear.getAttribute('tabindex'), '-1');
  assert.equal(new URLSearchParams(await internal.evaluate(form => new URLSearchParams(new FormData(form)).toString())).has('internal-destination'), false);
  assert.deepEqual((await fixtureEvents()).clear, ['internal']);
  await internal.getByRole('button', { name: 'Reset internal' }).click();
  await waitForValue('internal-form', 'Short destination');
  assert.equal(new URLSearchParams(await internal.evaluate(form => new URLSearchParams(new FormData(form)).toString())).get('internal-destination'), 'short');

  const prevented = page.getByTestId('prevented-form');
  await prevented.getByRole('button', { name: 'Clear prevented' }).click();
  await prevented.getByRole('button', { name: 'Reset prevented' }).click();
  await page.waitForFunction(() => window.treeSelectRefinementFixture.events.preventedReset === 1);
  await flushReset();
  assert.match(await prevented.locator('.inkra-tree-select__value').innerText(), /Select an item/);
  assert.equal(new URLSearchParams(await prevented.evaluate(form => new URLSearchParams(new FormData(form)).toString())).has('prevented-destination'), false);

  const external = page.getByTestId('external-control');
  await external.getByRole('button', { name: 'Clear external' }).click();
  await page.getByTestId('external-form').getByRole('button', { name: 'Reset external' }).click();
  await waitForValue('external-control', 'Short destination');
  assert.equal(await page.evaluate(() => new FormData(document.getElementById('tree-select-external-form')).get('external-destination')), 'short');
  assert.equal((await fixtureEvents()).externalReset, 1);

  const controlled = page.getByTestId('controlled-form');
  await controlled.getByRole('button', { name: 'Clear controlled' }).click();
  assert.match(await controlled.locator('.inkra-tree-select__value').innerText(), /Select an item/);
  await controlled.getByRole('button', { name: 'Reset controlled' }).click();
  await flushReset();
  assert.match(await controlled.locator('.inkra-tree-select__value').innerText(), /Select an item/, 'controlled reset waits for parent value');
  assert.equal(new URLSearchParams(await controlled.evaluate(form => new URLSearchParams(new FormData(form)).toString())).has('controlled-destination'), false);
  await page.evaluate(() => window.treeSelectRefinementFixture.setControlledValue('long'));
  await waitForValue('controlled-form', await page.evaluate(() => window.treeSelectRefinementFixture.longLabel));
  await controlled.getByRole('button', { name: 'Reset controlled' }).click();
  await flushReset();
  assert.equal(await controlled.locator('.inkra-tree-select__value').innerText(), await page.evaluate(() => window.treeSelectRefinementFixture.longLabel));

  assert.deepEqual(pageErrors, []);
  console.log('PASS TreeSelect shared frame, focus/clear, RTL/state, sizing and reset semantics');
} finally {
  await page.evaluate(() => {
    window.treeSelectRefinementFixture?.unmount();
    document.getElementById('tree-select-refinement-fixture')?.remove();
  }).catch(() => {});
  await browser.close();
}
