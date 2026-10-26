import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function waitForLayout(root, page, expectedCount, expectedFirstKey) {
  await root.waitFor();
  await page.waitForFunction(([element, count, firstKey]) => {
    if (!element || element.getAttribute('data-layout') !== 'ready') return false;
    const items = element.querySelectorAll(':scope > [data-masonry-key]');
    return items.length === count && (!firstKey || items[0]?.getAttribute('data-masonry-key') === firstKey);
  }, [await root.elementHandle(), expectedCount, expectedFirstKey]);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function snapshot(root) {
  return root.evaluate(element => ({
    columns: Number(element.getAttribute('data-columns')),
    height: element.getBoundingClientRect().height,
    keys: [...element.querySelectorAll(':scope > [data-masonry-key]')].map(item => item.getAttribute('data-masonry-key')),
    items: [...element.querySelectorAll(':scope > [data-masonry-key]')].map(item => {
      const box = item.getBoundingClientRect();
      return { key: item.getAttribute('data-masonry-key'), x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  }));
}

async function boxModelSnapshot(root) {
  return root.evaluate(element => {
    const number = value => Number.parseFloat(value) || 0;
    const style = getComputedStyle(element);
    const paddingLeft = number(style.paddingLeft);
    const paddingRight = number(style.paddingRight);
    const paddingBottom = number(style.paddingBottom);
    const borderTop = number(style.borderTopWidth);
    const borderBottom = number(style.borderBottomWidth);
    const contentWidth = element.clientWidth - paddingLeft - paddingRight;
    const columns = Number(element.getAttribute('data-columns'));
    const gap = number(style.getPropertyValue('--inkra-masonry-column-gap'));
    const items = [...element.querySelectorAll(':scope > [data-masonry-key]')].map(item => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(item).transform);
      return { width: number(getComputedStyle(item).width), height: item.offsetHeight, x: matrix.m41, y: matrix.m42 };
    });
    return {
      borderBottom,
      borderTop,
      columns,
      contentWidth,
      expectedTrackWidth: items[0].width * columns + gap * (columns - 1),
      firstX: items[0].x,
      maxContentRight: Math.max(...items.map(item => item.x + item.width)),
      maxContentBottom: Math.max(...items.map(item => item.y + item.height)),
      offsetHeight: element.offsetHeight,
      paddingBottom,
      paddingLeft,
      transformedWidth: element.getBoundingClientRect().width,
      untransformedWidth: element.offsetWidth,
    };
  });
}

try {
  for (const viewport of [{ width: 1305, height: 900 }, { width: 390, height: 760 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'en');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    await page.goto(`${base}/docs/components/masonry#preview`);
    await page.getByRole('heading', { name: 'Masonry', exact: true }).waitFor();
    const playground = page.getByTestId('masonry-playground');
    const root = playground.locator('.inkra-masonry');
    await waitForLayout(root, page, 6, 'sketch');

    const initial = await snapshot(root);
    assert(initial.columns >= 1);
    assert(initial.height > 0);
    assert.deepEqual(initial.keys, ['sketch', 'palette', 'review', 'archive', 'async', 'notes']);
    assert(initial.items.every(item => item.width > 0 && item.height > 0));
    assert(initial.items.every(item => item.x >= -0.5 && item.x + item.width <= viewport.width + 0.5));

    await playground.getByRole('button', { name: 'Add card', exact: true }).click();
    await waitForLayout(root, page, 7, 'sketch');
    let changed = await snapshot(root);
    assert.equal(changed.keys.at(-1), 'added-1');

    await playground.getByRole('button', { name: 'Load image', exact: true }).click();
    await playground.locator('[data-masonry-key="async"] img').waitFor();
    await waitForLayout(root, page, 7, 'sketch');
    const withImage = await snapshot(root);
    assert(withImage.items.find(item => item.key === 'async').height > changed.items.find(item => item.key === 'async').height);

    await playground.getByRole('button', { name: 'Reverse order', exact: true }).click();
    await waitForLayout(root, page, 7, 'added-1');
    changed = await snapshot(root);
    assert.equal(changed.keys[0], 'added-1');
    assert.equal(changed.keys.at(-1), 'sketch');

    await root.evaluate(element => {
      element.style.border = '3px solid transparent';
      element.style.padding = '19px 23px 17px 29px';
      element.style.transform = 'scale(0.8)';
      element.style.transformOrigin = 'top left';
    });
    await page.waitForFunction(element => {
      const number = value => Number.parseFloat(value) || 0;
      const style = getComputedStyle(element);
      const paddingLeft = number(style.paddingLeft);
      const paddingRight = number(style.paddingRight);
      const columns = Number(element.getAttribute('data-columns'));
      const gap = number(style.getPropertyValue('--inkra-masonry-column-gap'));
      const first = element.querySelector(':scope > [data-masonry-key]');
      if (!first || element.getAttribute('data-layout') !== 'ready') return false;
      const trackWidth = number(getComputedStyle(first).width) * columns + gap * (columns - 1);
      return Math.abs(trackWidth - (element.clientWidth - paddingLeft - paddingRight)) <= 2;
    }, await root.elementHandle());
    const transformed = await boxModelSnapshot(root);
    assert(transformed.transformedWidth < transformed.untransformedWidth, 'fixture applies a parent-space scale');
    assert(Math.abs(transformed.expectedTrackWidth - transformed.contentWidth) <= 2, JSON.stringify(transformed));
    assert(Math.abs(transformed.firstX - transformed.paddingLeft) <= 1, JSON.stringify(transformed));
    assert(transformed.maxContentRight <= transformed.paddingLeft + transformed.contentWidth + 1, JSON.stringify(transformed));
    assert(Math.abs(transformed.offsetHeight - (transformed.borderTop + transformed.maxContentBottom + transformed.paddingBottom + transformed.borderBottom)) <= 2, JSON.stringify(transformed));
    await root.evaluate(element => {
      element.style.border = '';
      element.style.padding = '';
      element.style.transform = '';
      element.style.transformOrigin = '';
    });
    await waitForLayout(root, page, 7, 'added-1');

    const componentPlayground = page.locator('.component-playground').first();
    const propertiesToggle = componentPlayground.locator('.playground-config-toggle');
    if (await propertiesToggle.getAttribute('aria-expanded') === 'false') await propertiesToggle.click();
    await componentPlayground.getByRole('tab', { name: 'Behavior', exact: true }).click();
    await chooseDocsOption(componentPlayground, 'Direction', 'RTL', { exact: true, optionExact: true });
    await waitForLayout(root, page, 7, 'added-1');
    assert.equal(await root.getAttribute('dir'), 'rtl');

    const transition = await root.locator(':scope > [data-masonry-key]').first().evaluate(element => getComputedStyle(element).transitionDuration);
    assert(['0s', '0ms'].includes(transition), transition);
    await propertiesToggle.click();
    await page.waitForFunction(element => element?.getAttribute('aria-expanded') === 'false', await propertiesToggle.elementHandle());
    await waitForLayout(root, page, 7, 'added-1');
    await playground.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.addStyleTag({ content: '.app-header { visibility: hidden !important; }' });
    await root.screenshot({ path: `/tmp/inkra-masonry-${viewport.width}.png`, animations: 'disabled' });
    await page.close();
    console.log(`PASS Masonry dynamic image, stable order, RTL and narrow layout: ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
