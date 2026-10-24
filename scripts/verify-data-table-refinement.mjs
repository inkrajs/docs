import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.dataTableRefinementFixture.events);

async function focusPixels(button) {
  await button.focus();
  const focus = button.locator('.inkra-data-table__sort-focus');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await focus.elementHandle());
  await focus.evaluate(async node => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const canvas = node.querySelector('.inkra-pencil-surface__ink');
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((value, index) => index % 4 === 3 && value > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('DataTable sort focus canvas did not paint');
  });
}

try {
  await page.goto(`${base}/docs/components/data-table#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'data-table-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/DataTableRefinementFixture.tsx');
    window.dataTableRefinementFixture = mount(container);
  });

  const accepted = page.getByTestId('accepted-case');
  await accepted.waitFor();
  const nameSort = accepted.getByRole('button', { name: /Notebook name/i });
  assert.match(await nameSort.getAttribute('aria-label') ?? await nameSort.textContent(), /not sorted/i);
  assert.equal(await nameSort.locator('.inkra-pencil-text').count(), 1, 'string sort header uses PencilText');
  assert.equal(await accepted.locator('.inkra-data-table__filter > span .inkra-pencil-text').count(), 1, 'filter label uses PencilText');
  assert.equal(await accepted.getByTestId('custom-header').locator('.inkra-pencil-text').count(), 0, 'custom ReactNode header stays unchanged');
  assert(await accepted.locator('tbody td').first().locator('.inkra-pencil-text').count() > 0,
    'TanStack default cell output uses PencilText');
  assert.equal(await accepted.locator('[data-custom-cell]').first().locator('.inkra-pencil-text').count(), 0,
    'custom cell ReactNode stays unchanged');

  await focusPixels(nameSort);
  assert.equal(await nameSort.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
  await nameSort.click();
  assert.equal(await accepted.locator('th').nth(0).getAttribute('aria-sort'), 'ascending');
  assert.equal(await nameSort.locator('.inkra-data-table__sort-icon').getAttribute('data-direction'), 'asc');
  assert.match(await accepted.locator('tbody tr').first().innerText(), /Alpha notebook/);
  await nameSort.click();
  assert.equal(await accepted.locator('th').nth(0).getAttribute('aria-sort'), 'descending');
  assert.equal(await nameSort.locator('.inkra-data-table__sort-icon').getAttribute('data-direction'), 'desc');
  assert.match(await accepted.locator('tbody tr').first().innerText(), /Gamma notebook/);

  const acceptedNav = accepted.getByRole('navigation', { name: 'Accepted pagination' });
  await page.waitForFunction(() => window.dataTableRefinementFixture.events.accepted.length === 2);
  assert.deepEqual((await events()).accepted, [{ pageIndex: 0, pageSize: 2 }, { pageIndex: 0, pageSize: 2 }],
    'each sort preserves the engine page-reset callback');
  const beforeNext = (await events()).accepted.length;
  await acceptedNav.getByRole('button', { name: 'Next page' }).click();
  assert.deepEqual((await events()).accepted.slice(beforeNext), [{ pageIndex: 1, pageSize: 2 }],
    'Next requests exactly one subsequent page change');
  assert.match(await acceptedNav.textContent(), /Page 2 of 3/);

  const rejected = page.getByTestId('rejected-case');
  const rejectedNav = rejected.getByRole('navigation', { name: 'Rejected pagination' });
  await rejectedNav.getByRole('button', { name: 'Next page' }).click();
  await rejectedNav.getByRole('button', { name: 'Next page' }).click();
  assert.deepEqual((await events()).rejected, [{ pageIndex: 1, pageSize: 2 }, { pageIndex: 1, pageSize: 2 }],
    'each rejected interaction can request the same next page again');
  assert.match(await rejectedNav.textContent(), /Page 1 of 3/, 'rejected controlled state remains visible');

  const correction = page.getByTestId('correction-case');
  const correctionNav = correction.getByRole('navigation', { name: 'Correction pagination' });
  await page.waitForFunction(() => window.dataTableRefinementFixture.events.corrections.length === 1);
  assert.deepEqual((await events()).corrections, [{ pageIndex: 2, pageSize: 2 }]);
  assert.match(await correctionNav.textContent(), /Page 3 of 3/, 'display clamps rejected out-of-range state');
  const renderCount = (await events()).correctionRenders;
  await correction.getByRole('button', { name: /Rerender rejected correction/ }).click();
  await page.waitForTimeout(50);
  assert.equal((await events()).corrections.length, 1, 'inline callback identity changes do not repeat one correction');
  assert((await events()).correctionRenders > renderCount && (await events()).correctionRenders < renderCount + 5,
    'correction rerender remains bounded');

  const stableCorrection = page.getByTestId('stable-correction-case');
  assert.deepEqual((await events()).stableCorrections, [{ pageIndex: 2, pageSize: 2 }]);
  await stableCorrection.getByRole('button', { name: 'Grow rejected rows' }).click();
  await page.waitForFunction(() => window.dataTableRefinementFixture.events.stableCorrections.length === 2);
  assert.deepEqual((await events()).stableCorrections, [{ pageIndex: 2, pageSize: 2 }, { pageIndex: 2, pageSize: 2 }],
    'stable callback receives a distinct correction for changed row count even with the same target page');
  await stableCorrection.getByRole('button', { name: /Rerender stable correction/ }).click();
  await page.waitForTimeout(50);
  assert.equal((await events()).stableCorrections.length, 2, 'unchanged stable correction remains deduplicated');

  const dynamic = page.getByTestId('dynamic-case');
  const dynamicNav = dynamic.getByRole('navigation', { name: 'Dynamic pagination' });
  assert.match(await dynamicNav.textContent(), /Page 3 of 3/);
  await dynamic.getByRole('button', { name: 'Empty dynamic rows' }).click();
  await dynamic.getByText('No dynamic rows').waitFor();
  await page.waitForFunction(() => window.dataTableRefinementFixture.events.dynamic.some(value => value.pageIndex === 0));
  assert.match(await dynamicNav.textContent(), /Page 0 of 0/);
  assert(await dynamicNav.getByRole('button', { name: 'Previous page' }).isDisabled());
  assert(await dynamicNav.getByRole('button', { name: 'Next page' }).isDisabled());
  await dynamic.getByRole('button', { name: 'Restore dynamic rows' }).click();
  await dynamic.getByText('Alpha notebook').waitFor();
  assert.match(await dynamicNav.textContent(), /Page 1 of 3/, 'restored rows keep the accepted empty-boundary correction');
  await dynamic.getByRole('button', { name: 'Shrink dynamic rows' }).click();
  assert.match(await dynamicNav.textContent(), /Page 1 of 1/);

  const rtl = page.getByTestId('narrow-rtl-case');
  const rtlNav = rtl.getByRole('navigation', { name: 'RTL narrow pagination' });
  const geometry = await rtlNav.evaluate(node => {
    const nav = node.getBoundingClientRect();
    const children = [...node.children].map(child => child.getBoundingClientRect());
    return {
      nav: { left: nav.left, right: nav.right, width: nav.width },
      children: children.map(box => ({ left: box.left, right: box.right, width: box.width })),
      columns: getComputedStyle(node).gridTemplateColumns,
    };
  });
  assert.match(geometry.columns, /44px/);
  assert(geometry.children.every(box => box.left >= geometry.nav.left - 1 && box.right <= geometry.nav.right + 1), JSON.stringify(geometry));
  const arrows = rtlNav.locator('.inkra-data-table__page-arrow');
  assert.notEqual(await arrows.first().evaluate(node => getComputedStyle(node).transform), 'none', 'RTL mirrors logical page arrows');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'narrow RTL fixture does not overflow the page');

  const forced = await browser.newPage({ viewport: { width: 390, height: 800 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await forced.goto(`${base}/docs/components/data-table#preview`, { waitUntil: 'networkidle' });
    await forced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/DataTableRefinementFixture.tsx');
      window.dataTableRefinementForced = mount(container);
    });
    const forcedSort = forced.getByTestId('accepted-case').getByRole('button', { name: /Notebook name/i });
    await forcedSort.focus();
    assert.equal(await forcedSort.locator('.inkra-data-table__sort-focus').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedSort.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert.equal(await forcedSort.evaluate(node => getComputedStyle(node).transitionDuration), '0s');
  } finally {
    await forced.close();
  }

  assert.deepEqual(errors, []);
  console.log('PASS DataTable pencil sorting, controlled pagination boundaries, narrow RTL and fallbacks');
} finally {
  await page.evaluate(() => {
    window.dataTableRefinementFixture?.unmount();
    document.getElementById('data-table-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
