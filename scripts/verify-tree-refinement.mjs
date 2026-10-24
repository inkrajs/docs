import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.treeRefinementFixture.events);

async function focusPixels(row) {
  await row.hover();
  await page.keyboard.press('Tab');
  await row.focus();
  await page.waitForFunction(node => node.hasAttribute('data-focus-visible'), await row.elementHandle());
  const focus = row.locator('.inkra-tree__focus');
  await focus.waitFor();
  await focus.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, index) => index % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Tree focus canvas did not paint visible pixels');
  });
  return true;
}

try {
  await page.goto(`${base}/docs/components/tree#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'tree-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/TreeRefinementFixture.tsx');
    window.treeRefinementFixture = mount(container);
  });

  const controlled = page.getByTestId('controlled-case').getByRole('treegrid', { name: 'Controlled project tree' });
  await controlled.waitFor();
  const rows = controlled.locator('.inkra-tree__item');
  const root = rows.filter({ hasText: 'Root folder' }).first();
  const childA = rows.filter({ hasText: /^Child A$/ }).first();
  const branch = rows.filter({ hasText: /^Branch folder/ }).first();
  const disabled = rows.filter({ hasText: /^Disabled item$/ }).first();
  const last = rows.filter({ hasText: /^Last item$/ }).first();

  await root.focus();
  assert.equal(await root.getAttribute('aria-expanded'), 'true');
  await root.press('ArrowDown');
  assert(await childA.evaluate(node => node === document.activeElement), 'ArrowDown enters the next visible child row');
  await childA.press('ArrowDown');
  assert(await branch.evaluate(node => node === document.activeElement), 'ArrowDown follows visible tree order');
  await branch.press('ArrowRight');
  assert.equal(await branch.getAttribute('aria-expanded'), 'true');
  await branch.focus();
  await branch.press('ArrowLeft');
  assert.equal(await branch.getAttribute('aria-expanded'), 'false');
  assert(await branch.evaluate(node => node === document.activeElement), 'horizontal collapse keeps row focus');
  await root.press('End');
  assert(await last.evaluate(node => node === document.activeElement), 'End reaches final visible item');
  await last.press('Home');
  assert(await root.evaluate(node => node === document.activeElement), 'Home returns to first item');

  await childA.focus();
  await childA.press('Space');
  assert.equal(await childA.getAttribute('aria-selected'), 'false');
  await childA.press('Space');
  assert.equal(await childA.getAttribute('aria-selected'), 'true');
  assert.deepEqual((await events()).selected.slice(-2), [[], ['child-a']]);
  await branch.focus();
  await branch.press('ArrowDown');
  assert(await last.evaluate(node => node === document.activeElement), 'keyboard skips disabled item');
  assert.equal(await disabled.getAttribute('aria-disabled'), 'true');
  assert((await events()).expanded.length >= 2, 'controlled expansion callbacks remain active');

  await childA.focus();
  assert(await focusPixels(childA), 'focused row paints pencil pixels');
  assert.equal(await childA.evaluate(node => getComputedStyle(node).outlineStyle), 'none', 'global fallback does not duplicate the pencil row focus');
  const rowBox = await childA.locator('.inkra-tree__item-content').boundingBox();
  const focusBox = await childA.locator('.inkra-tree__focus').boundingBox();
  assert(rowBox && focusBox);
  assert(focusBox.x >= rowBox.x && focusBox.x + focusBox.width <= rowBox.x + rowBox.width
    && focusBox.y >= rowBox.y && focusBox.y + focusBox.height <= rowBox.y + rowBox.height,
  'row focus remains inside row geometry');

  const narrowCase = page.getByTestId('narrow-case');
  const narrowTree = narrowCase.getByRole('treegrid', { name: 'Narrow deep tree' });
  const deep = narrowTree.locator('.inkra-tree__item').filter({ hasText: /deeply nested destination/ }).last();
  const geometry = await deep.locator('.inkra-tree__item-content').evaluate(node => {
    const row = node.getBoundingClientRect();
    const container = node.closest('[data-testid="narrow-case"]').getBoundingClientRect();
    const copy = node.querySelector('.inkra-tree__copy');
    const title = node.querySelector('.inkra-tree__title');
    const titleBox = title.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(title.querySelector('.inkra-pencil-text__source'));
    return {
      container: { left: container.left, right: container.right, width: container.width },
      row: { left: row.left, right: row.right, width: row.width },
      paddingInlineStart: Number.parseFloat(getComputedStyle(node).paddingInlineStart),
      copyWidth: copy?.getBoundingClientRect().width ?? 0,
      title: { left: titleBox.left, right: titleBox.right },
      textRects: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right })),
    };
  });
  assert(geometry.row.left >= geometry.container.left - 1 && geometry.row.right <= geometry.container.right + 1,
    JSON.stringify(geometry));
  assert(geometry.copyWidth >= 79, `deep row reserves readable copy width: ${JSON.stringify(geometry)}`);
  assert(geometry.textRects.length > 1 && geometry.textRects.every(rect =>
    rect.left >= geometry.title.left - 1 && rect.right <= geometry.title.right + 1),
  `long title source wraps inside its cell: ${JSON.stringify(geometry)}`);
  const deepAlignment = await deep.locator('.inkra-tree__item-content').evaluate(node => {
    const icon = node.querySelector('.inkra-tree__icon')?.getBoundingClientRect();
    const titleSource = node.querySelector('.inkra-tree__title .inkra-pencil-text__source');
    if (!icon || !titleSource) return null;
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(titleSource);
    const firstLine = [...range.getClientRects()][0];
    return firstLine ? {
      iconCenter: icon.top + icon.height / 2,
      firstLineCenter: firstLine.top + firstLine.height / 2,
    } : null;
  });
  assert(deepAlignment && Math.abs(deepAlignment.iconCenter - deepAlignment.firstLineCenter) <= 8,
    `deep icon aligns with first text line: ${JSON.stringify(deepAlignment)}`);
  const description = deep.locator('.inkra-tree__description');
  assert.equal(await description.locator('.inkra-pencil-text').count(), 1);
  assert.match(await description.locator('.inkra-pencil-text__source').innerText(), /Long supporting text/);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'deep tree does not overflow page');

  const rtlCase = page.getByTestId('rtl-case');
  const rtlTree = rtlCase.getByRole('treegrid', { name: 'RTL project tree' });
  const rtlRoot = rtlTree.locator('.inkra-tree__item').filter({ hasText: /^RTL root/ }).first();
  const rtlChild = rtlTree.locator('.inkra-tree__item').filter({ hasText: /^RTL child$/ }).first();
  const rtlRootPadding = Number.parseFloat(await rtlRoot.locator('.inkra-tree__item-content').evaluate(node => getComputedStyle(node).paddingRight));
  const rtlChildPadding = Number.parseFloat(await rtlChild.locator('.inkra-tree__item-content').evaluate(node => getComputedStyle(node).paddingRight));
  assert(rtlChildPadding > rtlRootPadding, 'RTL indentation grows from the logical start side');
  assert.equal(await rtlTree.evaluate(node => getComputedStyle(node).direction), 'rtl');
  await rtlChild.focus();
  await rtlChild.press('ArrowUp');
  assert(await rtlRoot.evaluate(node => node === document.activeElement), 'RTL ArrowUp follows visible order');
  await rtlRoot.press('ArrowDown');
  assert(await rtlChild.evaluate(node => node === document.activeElement), 'RTL ArrowDown follows visible order');
  const rtlChevronTransform = await rtlRoot.locator('.inkra-tree__chevron').evaluate(node => getComputedStyle(node).transform);
  assert.notEqual(rtlChevronTransform, 'none', 'RTL disclosure keeps a directional transform');

  const forced = await browser.newPage({ viewport: { width: 390, height: 800 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await forced.goto(`${base}/docs/components/tree#preview`, { waitUntil: 'networkidle' });
    await forced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      container.id = 'tree-refinement-forced';
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/TreeRefinementFixture.tsx');
      window.treeRefinementForced = mount(container);
    });
    const forcedTree = forced.getByRole('treegrid', { name: 'Controlled project tree' });
    const forcedRow = forcedTree.locator('.inkra-tree__item').filter({ hasText: /^Child A$/ }).first();
    await forcedRow.focus();
    assert.equal(await forcedRow.locator('.inkra-tree__focus').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedRow.locator('.inkra-tree__item-content').evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    const disclosure = forcedTree.getByRole('button', { name: 'Collapse item Root folder', exact: true });
    await disclosure.focus();
    assert.equal(await disclosure.locator('.inkra-tree__disclosure-focus').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await disclosure.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
  } finally {
    await forced.close();
  }

  for (const [width, theme] of [[1100, 'light'], [390, 'dark']]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px fixture overflow`);
    await narrowCase.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-tree-refinement-${width}.png`, animations: 'disabled' });
  }
  assert.deepEqual(errors, []);
  console.log('PASS Tree React Aria keyboard/selection/expansion, deep containment, RTL and focus fallbacks');
} finally {
  await page.evaluate(() => {
    window.treeRefinementFixture?.unmount();
    document.getElementById('tree-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
