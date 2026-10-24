import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function mount(page, id) {
  await page.goto(`${base}/docs/components/pagination#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async fixtureId => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = fixtureId;
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/PaginationRefinementFixture.tsx');
    window.paginationRefinementFixture = fixture.mount(container);
  }, id);
}

async function assertNotClipped(element, boundary, message) {
  const result = await element.evaluate((node, boundaryNode) => {
    const item = node.getBoundingClientRect();
    const failures = [];
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
        const clip = ancestor.getBoundingClientRect();
        if (item.left < clip.left - 1 || item.right > clip.right + 1 || item.top < clip.top - 1 || item.bottom > clip.bottom + 1) {
          failures.push({ className: ancestor.className, clip: { bottom: clip.bottom, left: clip.left, right: clip.right, top: clip.top } });
        }
      }
      if (ancestor === boundaryNode) break;
    }
    return { failures, item: { bottom: item.bottom, left: item.left, right: item.right, top: item.top } };
  }, await boundary.elementHandle());
  assert.deepEqual(result.failures, [], `${message}: ${JSON.stringify(result)}`);
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 760 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page, 'pagination-refinement-fixture');

  const controlled = page.getByTestId('controlled');
  const controlledNav = controlled.getByRole('navigation', { name: 'Pagination' });
  const current = controlledNav.getByRole('button', { name: 'Page 6', exact: true });
  await current.focus();
  await assertNotClipped(current, controlledNav, 'current page and focus ring remain inside pagination scroll ancestors');
  const pageGeometry = await current.evaluate(node => ({ button: node.getBoundingClientRect().width, container: node.closest('nav').getBoundingClientRect().width }));
  assert(pageGeometry.button <= pageGeometry.container / 2 + 1, JSON.stringify(pageGeometry));
  const next = controlledNav.getByRole('button', { name: 'Next page', exact: true });
  await next.click();
  await next.click();
  assert.deepEqual((await page.evaluate(() => window.paginationRefinementFixture.events)).controlledRequests, [7, 7],
    'controlled rejection permits repeated requests');
  assert.equal(await current.getAttribute('aria-current'), 'page');
  await controlled.getByRole('button', { name: 'Shrink total', exact: true }).click();
  const clamped = controlledNav.getByRole('button', { name: 'Page 3', exact: true });
  await clamped.waitFor();
  assert.equal(await clamped.getAttribute('aria-current'), 'page');
  assert.deepEqual((await page.evaluate(() => window.paginationRefinementFixture.events)).controlledRequests, [7, 7],
    'total shrink clamps display without a callback');
  await controlled.getByRole('button', { name: 'Toggle disabled', exact: true }).click();
  assert.equal(await controlledNav.locator('button:not(:disabled)').count(), 0);

  const summary = page.getByTestId('summary');
  const summaryNav = summary.getByRole('navigation', { name: 'Pagination' });
  const summaryCopy = summaryNav.locator('.inkra-pagination__summary');
  const summaryGeometry = await summaryCopy.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth, nav: node.closest('nav').clientWidth }));
  assert(summaryGeometry.client <= summaryGeometry.nav && summaryGeometry.scroll <= summaryGeometry.nav + 1, JSON.stringify(summaryGeometry));
  await summaryNav.getByRole('button', { name: 'Next page', exact: true }).press('Space');
  assert.deepEqual((await page.evaluate(() => window.paginationRefinementFixture.events)).hugeRequests, [999999999999]);
  await summary.getByRole('button', { name: 'Empty summary', exact: true }).click();
  assert.equal(await summaryNav.getAttribute('data-empty'), 'true');
  assert.match(await summaryCopy.textContent(), /0.*0/);
  assert.equal(await summaryNav.locator('button:not(:disabled)').count(), 0);

  const uncontrolled = page.getByTestId('uncontrolled');
  const uncontrolledNav = uncontrolled.getByRole('navigation', { name: 'Pagination' });
  const page11 = uncontrolledNav.getByRole('button', { name: 'Page 11', exact: true });
  await page11.press('Enter');
  assert.equal(await page11.getAttribute('aria-current'), 'page');
  assert.deepEqual((await page.evaluate(() => window.paginationRefinementFixture.events)).uncontrolledRequests, [11]);

  for (const testId of ['flex-natural', 'grid-natural']) {
    const host = page.getByTestId(testId);
    const nav = host.getByRole('navigation', { name: 'Pagination' });
    const geometry = await nav.evaluate(node => ({
      host: node.parentElement.getBoundingClientRect().width,
      list: node.querySelector('.inkra-pagination__list').getBoundingClientRect().width,
      nav: node.getBoundingClientRect().width,
    }));
    assert(geometry.nav > 200, `${testId} retains natural content width: ${JSON.stringify(geometry)}`);
    assert(geometry.nav <= geometry.host + 1 && Math.abs(geometry.list - geometry.nav) <= 1, JSON.stringify(geometry));
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '/tmp/inkra-pagination-refinement-390.png', animations: 'disabled' });
  await page.close();

  const forced = await browser.newPage({ viewport: { width: 390, height: 760 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await mount(forced, 'pagination-refinement-forced');
    const forcedCurrent = forced.getByTestId('controlled').getByRole('button', { name: 'Page 6', exact: true });
    await forcedCurrent.focus();
    assert.match(await forcedCurrent.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert.equal(await forcedCurrent.locator('.inkra-pagination__selection').evaluate(node => getComputedStyle(node).display), 'none');
  } finally {
    await forced.close();
  }

  console.log('PASS Pagination narrow custom content, controlled rejection/total clamp, huge/empty/disabled, keyboard, RTL, focus and forced colors');
} finally {
  await browser.close();
}
