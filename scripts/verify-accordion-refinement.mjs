import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.accordionRefinementFixture.events);

async function focusPixels(trigger) {
  await trigger.hover();
  await page.keyboard.press('Tab');
  await trigger.focus();
  const ring = trigger.locator('.inkra-accordion__focus-ring');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await ring.elementHandle());
  return ring.evaluate(node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.width || !canvas.height) return 0;
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
    let visible = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) visible++;
    return visible;
  });
}

try {
  await page.goto(`${base}/docs/components/accordion#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'accordion-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/AccordionRefinementFixture.tsx');
    window.accordionRefinementFixture = mount(container);
  });

  const forceCase = page.getByTestId('force-mounted-case');
  await forceCase.waitFor();
  const triggers = forceCase.locator('.inkra-accordion__trigger');
  const openTrigger = triggers.nth(0);
  const closedTrigger = triggers.nth(1);
  const contents = forceCase.locator('.inkra-accordion__content');
  const openContent = contents.nth(0);
  const closedContent = contents.nth(1);
  assert.equal(await openContent.getAttribute('data-state'), 'open');
  assert.equal(await openContent.getAttribute('aria-hidden'), null);
  assert.equal(await openContent.getAttribute('inert'), null);
  assert.equal(await closedContent.getAttribute('data-state'), 'closed');
  assert.equal(await closedContent.getAttribute('aria-hidden'), 'true');
  assert.equal(await closedContent.getAttribute('inert'), '');
  const closedAction = closedContent.locator('button');
  assert(await closedContent.evaluate(node => node.getBoundingClientRect().height <= 0.5
    && getComputedStyle(node).overflow === 'hidden'),
  'closed forceMount stays mounted but clips its contents in a zero-height wrapper');
  await closedAction.evaluate(node => node.focus());
  assert.equal(await closedAction.evaluate(node => node === document.activeElement), false,
    'inert content cannot receive programmatic focus');
  assert.equal(await closedAction.isEnabled(), true,
    'forceMount preserves child state rather than disabling controls');

  const draft = page.getByTestId('preserved-draft');
  await draft.fill('edited draft');
  await draft.focus();
  await openTrigger.click();
  assert.equal(await openTrigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await openContent.getAttribute('aria-hidden'), 'true');
  assert.equal(await openContent.getAttribute('inert'), '');
  assert(await openTrigger.evaluate(node => node === document.activeElement), 'closing focused content returns focus to trigger');
  assert.equal((await events()).focusCapture, 1);
  assert((await events()).blurCapture >= 1);
  assert.equal((await events()).triggerClick, 1, 'caller trigger event remains wired');
  assert.deepEqual((await events()).values, ['']);
  await page.waitForTimeout(250);
  const closedGeometry = await openContent.evaluate(node => ({ height: node.getBoundingClientRect().height, display: getComputedStyle(node).display }));
  assert(closedGeometry.height <= 0.5, JSON.stringify(closedGeometry));
  assert.notEqual(closedGeometry.display, 'none', 'forceMount content remains mounted after close animation');

  await openTrigger.press('Enter');
  assert.equal(await openContent.getAttribute('aria-hidden'), null);
  assert.equal(await openContent.getAttribute('inert'), null);
  assert.equal(await draft.inputValue(), 'edited draft', 'forceMount preserves draft state');
  assert.equal((await events()).triggerClick, 2);
  assert.deepEqual((await events()).values, ['', 'open']);
  assert.match(await page.getByTestId('ref-state').textContent(), /BUTTON:DIV/);
  assert.deepEqual((await events()).contentRefNodes, ['DIV'], 'asChild callback ref attaches once without render churn');
  assert.equal((await events()).contentRefCleanup, 0);

  await draft.focus();
  const externalToggle = page.getByTestId('external-toggle');
  await externalToggle.evaluate(node => node.click());
  await page.waitForFunction(node => node === document.activeElement, await openTrigger.elementHandle());
  assert.equal(await openContent.getAttribute('inert'), '');
  await openTrigger.press('Enter');
  await externalToggle.click();
  assert(await externalToggle.evaluate(node => node === document.activeElement),
    'closing a panel without focus inside does not steal external focus');

  await closedTrigger.focus();
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => document.activeElement?.textContent), 'Closed force mounted action',
    'Tab never enters closed forceMount content');

  const regularCase = page.getByTestId('regular-case');
  const regularTrigger = regularCase.getByRole('button', { name: 'Regular animated item', exact: true });
  const regularContent = regularCase.locator('.inkra-accordion__content');
  await regularTrigger.click();
  assert.equal(await regularContent.getAttribute('data-state'), 'closed');
  assert.equal(await regularContent.getAttribute('aria-hidden'), 'true');
  assert.equal(await regularContent.getAttribute('inert'), '');
  const animationName = await regularContent.evaluate(node => getComputedStyle(node).animationName);
  assert.match(animationName, /inkra-accordion-content-up/);
  await page.waitForFunction(node => node.hidden && !node.querySelector('a'), await regularContent.elementHandle());
  assert.equal(await regularContent.getAttribute('hidden'), '');
  assert.equal(await regularContent.locator('a').count(), 0, 'non-forceMount children unmount after exit');

  const horizontal = page.getByTestId('horizontal-case');
  const horizontalTrigger = horizontal.getByRole('button', { name: 'Horizontal item with a long trigger', exact: true });
  assert(await focusPixels(horizontalTrigger) > 20, 'pencil focus paints visible pixels');
  const triggerBox = await horizontalTrigger.boundingBox();
  const ringBox = await horizontalTrigger.locator('.inkra-accordion__focus-ring').boundingBox();
  const containerBox = await horizontal.boundingBox();
  assert(triggerBox && ringBox && containerBox);
  assert(ringBox.x >= triggerBox.x && ringBox.x + ringBox.width <= triggerBox.x + triggerBox.width
    && ringBox.y >= triggerBox.y && ringBox.y + ringBox.height <= triggerBox.y + triggerBox.height,
    'focus ring is inset inside trigger bounds');
  assert(Math.min(ringBox.x + ringBox.width, containerBox.x + containerBox.width)
    - Math.max(ringBox.x, containerBox.x) >= 44,
  'a long horizontally scrolling trigger retains a visible focus segment');

  const forced = await browser.newPage({ viewport: { width: 390, height: 800 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await forced.goto(`${base}/docs/components/accordion#preview`, { waitUntil: 'networkidle' });
    await forced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      container.id = 'accordion-refinement-forced';
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/AccordionRefinementFixture.tsx');
      window.accordionRefinementForced = mount(container);
    });
    const forcedTrigger = forced.getByRole('button', { name: 'Horizontal item with a long trigger', exact: true });
    await forcedTrigger.focus();
    assert.equal(await forcedTrigger.locator('.inkra-accordion__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedTrigger.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert(Number.parseFloat(await forcedTrigger.evaluate(node => getComputedStyle(node).outlineOffset)) <= 0,
      'forced-color focus stays inside clipped bounds');
    const forcedClosed = forced.getByTestId('force-mounted-case').locator('.inkra-accordion__content').nth(1);
    assert.equal(await forcedClosed.getAttribute('aria-hidden'), 'true');
    assert.equal(await forcedClosed.getAttribute('inert'), '');
  } finally {
    await forced.close();
  }

  assert.deepEqual(errors, []);
  console.log('PASS Accordion forceMount inertness, close accessibility/motion, refs/events and focus clipping');
} finally {
  await page.evaluate(() => {
    window.accordionRefinementFixture?.unmount();
    document.getElementById('accordion-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
