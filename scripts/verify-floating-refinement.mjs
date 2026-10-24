import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function mount(page, id) {
  await page.goto(`${base}/docs/components/popover#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async fixtureId => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = fixtureId;
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/FloatingRefinementFixture.tsx');
    window.floatingRefinementFixture = fixture.mount(container);
  }, id);
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 240 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page, 'floating-refinement-fixture');

  const popoverTrigger = page.getByRole('button', { name: 'Open bounded popover', exact: true });
  await popoverTrigger.focus();
  await popoverTrigger.press('Enter');
  const popover = page.locator('.inkra-popover__content');
  const popoverBody = popover.locator('.inkra-popover__content-body');
  await popover.waitFor();
  const popoverGeometry = await popover.evaluate(node => {
    const body = node.querySelector('.inkra-popover__content-body');
    const rect = node.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      bodyClientHeight: body.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      bodyWidth: bodyRect.width,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
    };
  });
  assert(popoverGeometry.left >= 11 && popoverGeometry.right <= popoverGeometry.viewportWidth - 11, JSON.stringify(popoverGeometry));
  assert(popoverGeometry.top >= 11 && popoverGeometry.bottom <= popoverGeometry.viewportHeight - 11, JSON.stringify(popoverGeometry));
  assert(popoverGeometry.bodyScrollHeight > popoverGeometry.bodyClientHeight, 'short viewport scrolls only the popover body');
  assert(popoverGeometry.bodyWidth <= 366, 'long content remains bounded');
  assert.equal(await popover.evaluate(node => getComputedStyle(node).animationName), 'none');
  assert.equal(await popover.getAttribute('data-inkra-theme'), 'dark');
  assert(await popoverBody.getByText(/Scrollable popover row 12/).count());
  await popoverBody.evaluate(node => { node.scrollTop = 0; });
  await page.screenshot({ path: '/tmp/inkra-floating-round7-popover-short.png', animations: 'disabled' });
  await popover.focus();
  await page.keyboard.press('Tab');
  assert(await popoverBody.getByRole('button', { name: 'Close bounded popover' }).evaluate(node => node === document.activeElement));
  assert(await popoverBody.evaluate(node => {
    const button = node.querySelector('button').getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    return button.top >= bounds.top && button.bottom <= bounds.bottom;
  }), 'last action is reachable inside the short popup');
  await page.keyboard.press('Escape');
  await page.waitForFunction(node => node === document.activeElement, await popoverTrigger.elementHandle());
  await page.waitForFunction(() => !document.querySelector('.inkra-popover__content'));

  const tooltipTrigger = page.getByRole('button', { name: 'Open bounded tooltip', exact: true });
  await tooltipTrigger.focus();
  const tooltip = page.locator('.inkra-tooltip__content');
  await tooltip.waitFor();
  const tooltipGeometry = await tooltip.evaluate(node => {
    const body = node.querySelector('.inkra-tooltip__content-body');
    const rect = node.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      bodyClientHeight: body.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
    };
  });
  assert(tooltipGeometry.left >= 7 && tooltipGeometry.right <= tooltipGeometry.viewportWidth - 7, JSON.stringify(tooltipGeometry));
  assert(tooltipGeometry.top >= 7 && tooltipGeometry.bottom <= tooltipGeometry.viewportHeight - 7, JSON.stringify(tooltipGeometry));
  assert(tooltipGeometry.bodyScrollHeight >= tooltipGeometry.bodyClientHeight);
  assert.equal(await tooltip.evaluate(node => getComputedStyle(node).animationName), 'none');
  assert.equal(await tooltip.getAttribute('data-inkra-theme'), 'dark');
  await page.screenshot({ path: '/tmp/inkra-floating-round7-tooltip-short.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.inkra-tooltip__content'));
  assert(await tooltipTrigger.evaluate(node => node === document.activeElement), 'tooltip Escape preserves trigger focus');
  assert.deepEqual(await page.evaluate(() => window.floatingRefinementFixture.events), {
    popover: [true, false], tooltip: [true, false],
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  await page.close();

  const forced = await browser.newPage({ viewport: { width: 390, height: 240 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await mount(forced, 'floating-refinement-forced');
    await forced.getByRole('button', { name: 'Open bounded popover', exact: true }).click();
    const forcedPopover = forced.locator('.inkra-popover__surface');
    await forcedPopover.waitFor();
    assert.match(await forcedPopover.evaluate(node => getComputedStyle(node).borderTopStyle), /solid/);
    assert.notEqual(await forcedPopover.evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
    await forced.keyboard.press('Escape');
    await forced.getByRole('button', { name: 'Open bounded tooltip', exact: true }).focus();
    const forcedTooltip = forced.locator('.inkra-tooltip__surface');
    await forcedTooltip.waitFor();
    assert.match(await forcedTooltip.evaluate(node => getComputedStyle(node).borderTopStyle), /solid/);
  } finally {
    await forced.close();
  }

  console.log('PASS floating long content, viewport collision, internal scrolling, theme, Escape/focus, reduced motion and forced colors');
} finally {
  await browser.close();
}
