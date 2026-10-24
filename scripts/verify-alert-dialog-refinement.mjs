import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 240 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.alertDialogRefinementFixture.events);

async function expectFocused(locator) {
  await page.waitForFunction(node => node === document.activeElement, await locator.elementHandle());
}

async function focusPixels(content) {
  const ring = content.locator('.inkra-alert-dialog__focus-ring');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await ring.elementHandle());
  await ring.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, index) => index % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('AlertDialog content focus canvas did not paint');
  });
}

try {
  await page.goto(`${base}/docs/components/alert-dialog#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'alert-dialog-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/AlertDialogRefinementFixture.tsx');
    window.alertDialogRefinementFixture = mount(container);
  });

  const normalTrigger = page.getByRole('button', { name: 'Open normal alert', exact: true });
  await normalTrigger.click();
  const normal = page.getByTestId('normal-content');
  await normal.waitFor();
  const cancel = normal.getByRole('button', { name: 'Cancel', exact: true });
  await expectFocused(cancel);
  const rect = await normal.boundingBox();
  assert(rect && rect.x >= 7 && rect.x + rect.width <= 383 && rect.y >= 7 && rect.y + rect.height <= 233,
    `RTL dialog remains inside viewport: ${JSON.stringify(rect)}`);
  assert.equal(await normal.evaluate(node => getComputedStyle(node).direction), 'rtl');
  const body = normal.locator('.inkra-alert-dialog__body');
  const header = normal.locator('.inkra-alert-dialog__header');
  const footer = normal.locator('.inkra-alert-dialog__footer');
  assert(await body.evaluate(node => node.scrollHeight > node.clientHeight), 'long body scrolls in short viewport');
  assert(await header.isVisible() && await footer.isVisible(), 'header and footer remain visible');
  const bodyBox = await body.boundingBox();
  const headerBox = await header.boundingBox();
  const footerBox = await footer.boundingBox();
  assert(bodyBox && headerBox && footerBox && headerBox.y + headerBox.height <= bodyBox.y + 1
    && bodyBox.y + bodyBox.height <= footerBox.y + 1, 'body scrollport stays between header and footer');
  await cancel.click();
  await normal.waitFor({ state: 'hidden' });
  await expectFocused(normalTrigger);

  const disabledTrigger = page.getByRole('button', { name: 'Open disabled-cancel alert', exact: true });
  await disabledTrigger.click();
  const disabled = page.getByTestId('disabled-content');
  await disabled.waitFor();
  const disabledCancel = disabled.getByRole('button', { name: 'Disabled cancel', exact: true });
  assert(await disabledCancel.isDisabled());
  await expectFocused(disabled);
  assert.equal(await disabled.getAttribute('tabindex'), '-1');
  await focusPixels(disabled);
  await disabled.getByRole('button', { name: 'Confirm', exact: true }).click();
  await disabled.waitFor({ state: 'hidden' });
  await expectFocused(disabledTrigger);

  const hiddenTrigger = page.getByRole('button', { name: 'Open hidden-cancel alert', exact: true });
  await hiddenTrigger.click();
  const hidden = page.getByTestId('hidden-content');
  await hidden.waitFor();
  assert.equal(await hidden.locator('button', { hasText: 'Hidden cancel' }).count(), 1);
  await expectFocused(hidden);
  await hidden.getByRole('button', { name: 'Confirm', exact: true }).click();
  await hidden.waitFor({ state: 'hidden' });

  const headerOnlyTrigger = page.getByRole('button', { name: 'Open header-only alert', exact: true });
  await headerOnlyTrigger.click();
  const headerOnly = page.getByTestId('header-only-content');
  await headerOnly.waitFor();
  const headerOnlyLayout = headerOnly.locator('.inkra-alert-dialog__layout');
  assert(await headerOnlyLayout.evaluate(node => node.scrollHeight > node.clientHeight), 'header/footer-only dialog scrolls its layout');
  assert.equal(await headerOnly.locator('.inkra-alert-dialog__body').count(), 0);
  const headerOnlyRect = await headerOnly.boundingBox();
  assert(headerOnlyRect && headerOnlyRect.y >= 7 && headerOnlyRect.y + headerOnlyRect.height <= 233);
  await headerOnly.getByRole('button', { name: 'Cancel', exact: true }).click();
  await headerOnly.waitFor({ state: 'hidden' });

  const pendingTrigger = page.getByRole('button', { name: 'Open pending alert', exact: true });
  await pendingTrigger.click();
  const pending = page.getByTestId('pending-content');
  await pending.waitFor();
  assert.equal(await pending.getAttribute('aria-busy'), 'true');
  assert(await pending.getByRole('button', { name: 'Cancel', exact: true }).isDisabled());
  assert(await pending.getByRole('button', { name: 'Pending action', exact: true }).isDisabled());
  await expectFocused(pending);
  await page.keyboard.press('Escape');
  assert(await pending.isVisible(), 'pending blocks Escape');
  await page.mouse.click(2, 2);
  assert(await pending.isVisible(), 'pending/outside interaction does not dismiss');
  assert.deepEqual((await events()).pendingOpen, [true]);

  const forced = await browser.newPage({ viewport: { width: 390, height: 240 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await forced.goto(`${base}/docs/components/alert-dialog#preview`, { waitUntil: 'networkidle' });
    await forced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      container.id = 'alert-dialog-refinement-forced';
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/AlertDialogRefinementFixture.tsx');
      window.alertDialogRefinementForced = mount(container);
    });
    await forced.getByRole('button', { name: 'Open disabled-cancel alert', exact: true }).click();
    const forcedContent = forced.getByTestId('disabled-content');
    await forcedContent.waitFor();
    assert.equal(await forcedContent.locator('.inkra-alert-dialog__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedContent.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert(Number.parseFloat(await forcedContent.evaluate(node => getComputedStyle(node).outlineOffset)) <= 0);
  } finally {
    await forced.close();
  }

  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/tmp/inkra-alert-dialog-refinement-390x240.png', animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('PASS AlertDialog RTL centering, safe focus, short viewport scrolling and pending guards');
} finally {
  await page.evaluate(() => {
    window.alertDialogRefinementFixture?.unmount();
    document.getElementById('alert-dialog-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
