import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const panels = caseNode => caseNode.locator('.inkra-transfer__panel');
const actions = caseNode => caseNode.locator('.inkra-transfer__actions');
const box = locator => locator.boundingBox();
const itemMove = (caseNode, name) => caseNode.getByRole('button', { name });
const activeTransferItem = () => page.evaluate(() => document.activeElement?.closest('[data-transfer-item-id]')?.getAttribute('data-transfer-item-id'));

try {
  await page.goto(`${base}/docs/components/transfer#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'transfer-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/TransferRefinementFixture.tsx');
    window.transferRefinementFixture = mount(container);
  });
  await page.getByTestId('wide-layout').waitFor();

  const wide = page.getByTestId('wide-layout');
  const widePanels = await panels(wide).all();
  const wideSource = await box(widePanels[0]);
  const wideTarget = await box(widePanels[1]);
  const wideActions = await box(actions(wide));
  assert(wideSource.x < wideActions.x && wideActions.x < wideTarget.x, 'wide container remains horizontal');

  const narrow = page.getByTestId('narrow-layout');
  const narrowPanels = await panels(narrow).all();
  const narrowSource = await box(narrowPanels[0]);
  const narrowTarget = await box(narrowPanels[1]);
  const narrowActions = await box(actions(narrow));
  assert(narrowSource.y < narrowActions.y && narrowActions.y < narrowTarget.y,
    'narrow component stacks even in a desktop viewport');
  assert(Math.abs(narrowSource.x - narrowTarget.x) < 2, 'stacked panels share the same inline position');

  const rtlWide = page.getByTestId('rtl-wide-layout');
  const rtlPanels = await panels(rtlWide).all();
  const rtlSource = await box(rtlPanels[0]);
  const rtlTarget = await box(rtlPanels[1]);
  assert(rtlSource.x > rtlTarget.x, 'RTL wide layout places source on the logical start side');
  const rtlWideTargetTransform = await rtlWide.locator('[data-direction="to-target"]').first()
    .evaluate(node => getComputedStyle(node).transform);
  assert.notEqual(rtlWideTargetTransform, 'none', 'RTL wide move icon mirrors toward the target');

  for (const testId of ['narrow-layout', 'rtl-narrow-layout']) {
    const caseNode = page.getByTestId(testId);
    const targetTransform = await caseNode.locator('[data-direction="to-target"]').first()
      .evaluate(node => getComputedStyle(node).transform);
    const sourceTransform = await caseNode.locator('[data-direction="to-source"]').first()
      .evaluate(node => getComputedStyle(node).transform);
    assert.match(targetTransform, /^matrix\(0, 1, -1, 0,/);
    assert.match(sourceTransform, /^matrix\(0, -1, 1, 0,/);
  }

  const delayed = page.getByTestId('delayed-controlled');
  const delayedMove = itemMove(delayed, 'Move to selected: Alpha');
  await delayedMove.focus();
  await delayedMove.click();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Move to selected: Alpha',
    'focus stays on the origin while controlled value is pending');
  assert.equal(await delayed.locator('[data-side="target"] [data-transfer-item-id="alpha"]').count(), 0);
  await page.evaluate(() => window.transferRefinementFixture.resolve('delayedProposals'));
  await page.waitForFunction(() => document.querySelector('[data-testid="delayed-controlled"] [data-side="target"] [data-transfer-item-id="alpha"]'));
  await page.waitForFunction(() => document.activeElement?.closest('[data-testid="delayed-controlled"] [data-side="target"]') != null);
  assert.equal(await activeTransferItem(), 'alpha');

  const rejected = page.getByTestId('rejected-controlled');
  const rejectedMove = itemMove(rejected, 'Move to selected: Alpha');
  await rejectedMove.focus();
  await rejectedMove.click();
  await page.evaluate(() => window.transferRefinementFixture.resolve('rejectedProposals'));
  await page.waitForFunction(() => document.querySelector('[data-testid="rejected-controlled"] [data-side="target"] [data-transfer-item-id="beta"]'));
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Move to selected: Alpha',
    'mismatched controlled update cancels the pending focus move');
  assert.equal(await rejected.locator('[data-side="target"] [data-transfer-item-id="alpha"]').count(), 0);

  const movedFocus = page.getByTestId('moved-focus-controlled');
  const movedFocusMove = itemMove(movedFocus, 'Move to selected: Alpha');
  await movedFocusMove.focus();
  await movedFocusMove.click();
  await page.getByTestId('outside-focus').focus();
  await page.evaluate(() => window.transferRefinementFixture.resolve('movedFocusProposals'));
  await page.waitForFunction(() => document.querySelector('[data-testid="moved-focus-controlled"] [data-side="target"] [data-transfer-item-id="alpha"]'));
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'outside-focus',
    'accepted delayed move does not steal focus after the user moved elsewhere');

  const batch = page.getByTestId('batch-controlled');
  await batch.locator('[data-side="source"] .inkra-selection-control__input').nth(0).check();
  await batch.locator('[data-side="source"] .inkra-selection-control__input').nth(1).check();
  const batchButton = batch.getByRole('button', { name: 'Move checked to selected' });
  await batchButton.focus();
  await batchButton.click();
  assert.equal(await batchButton.isDisabled(), true, 'batch origin becomes disabled while the move is pending');
  await page.evaluate(() => window.transferRefinementFixture.resolve('batchProposals'));
  await page.waitForFunction(() => document.querySelector('[data-testid="batch-controlled"] [data-side="target"] [data-transfer-item-id="alpha"]'));
  await page.waitForFunction(() => document.activeElement?.closest('[data-testid="batch-controlled"] [data-side="target"]') != null);
  assert.equal(await activeTransferItem(), 'alpha');

  const focusPanel = delayed.locator('[data-side="target"]');
  await page.keyboard.press('Tab');
  await focusPanel.focus();
  assert.equal(await focusPanel.locator(':scope > .inkra-transfer__panel-focus').count(), 1);
  assert.equal(await focusPanel.locator(':scope > .inkra-transfer__panel-focus').evaluate(node => getComputedStyle(node).opacity), '1');
  assert.match(await delayed.locator('.inkra-transfer').evaluate(node => getComputedStyle(node).fontFamily), /Trip Map Hand|HanziPen|Kaiti/);

  assert.equal(await page.locator('#transfer-refinement-fixture button button').count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('PASS Transfer container layout, directional icons and controlled focus acceptance');
} finally {
  await page.evaluate(() => {
    window.transferRefinementFixture?.unmount();
    document.getElementById('transfer-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
