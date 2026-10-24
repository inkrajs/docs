import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  await page.locator('.icon-examples__stage canvas').first().waitFor();
  assert.equal(await page.locator('.icon-examples__stage canvas').count(), 9);
  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.waitForTimeout(150);
    const grid = await page.locator('.icon-examples__stage').evaluate(node => {
      const cells = [...node.children].map(child => child.getBoundingClientRect());
      const bounds = node.getBoundingClientRect();
      return { columns: new Set(cells.map(cell => Math.round(cell.x))).size,
        rows: new Set(cells.map(cell => Math.round(cell.y))).size,
        contained: cells.every(cell => cell.left >= bounds.left && cell.right <= bounds.right && cell.top >= bounds.top && cell.bottom <= bounds.bottom),
        painted: [...node.children].every(canvas => canvas.width && [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((value, i) => i % 4 === 3 && value > 0)),
      };
    });
    assert.deepEqual(grid, { columns: 3, rows: 3, contained: true, painted: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-icon-grid-${width}.png` });
  }
  await page.setViewportSize({ width: 1305, height: 954 });
  await page.reload();
  await page.locator('.icon-examples__stage canvas').first().waitFor();
  const playground = page.locator('.component-playground').first();
  await setPlaygroundControls(playground, true);
  const sizeControl = playground.getByRole('slider', { name: '图标尺寸', exact: true });
  assert.equal(await sizeControl.getAttribute('aria-valuenow'), '40');
  await sizeControl.press('Home');
  assert.equal(await sizeControl.getAttribute('aria-valuenow'), '16');
  await sizeControl.press('ArrowRight');
  assert.equal(await sizeControl.getAttribute('aria-valuenow'), '17', 'size can be changed one pixel at a time');
  await sizeControl.press('End');
  assert.equal(await sizeControl.getAttribute('aria-valuenow'), '128');
  await setPlaygroundControls(playground, false);
  for (const width of [1305, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.waitForTimeout(150);
    const layout = await playground.locator('.icon-examples__stage').evaluate(node => {
      const cells = [...node.children].map(canvas => canvas.getBoundingClientRect());
      return { columns: new Set(cells.map(cell => Math.round(cell.x))).size,
        rows: new Set(cells.map(cell => Math.round(cell.y))).size,
        correctSize: cells.every(cell => cell.width === 128 && cell.height === 128),
        overlaps: cells.some((a, i) => cells.some((b, j) => i !== j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)),
      };
    });
    assert.deepEqual(layout, { columns: 3, rows: 3, correctSize: true, overlaps: false });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width < 400) {
      const viewport = playground.locator('.icon-examples__viewport');
      assert(await viewport.evaluate(node => node.scrollWidth > node.clientWidth));
      await viewport.evaluate(node => { node.scrollLeft = node.scrollWidth; });
      assert(await viewport.evaluate(node => node.scrollLeft > 0), 'large icons remain reachable by local scrolling');
    }
    await page.screenshot({ path: `/tmp/inkra-icon-128-${width}.png` });
  }
  await page.setViewportSize({ width: 1305, height: 954 });
  await setPlaygroundControls(playground, true);
  await sizeControl.press('Home');
  for (let i = 0; i < 24; i++) await sizeControl.press('ArrowRight');
  await playground.getByRole('tab', { name: '笔触', exact: true }).click();
  await playground.getByRole('switch', { name: '自定义图标笔触', exact: true }).check();
  const weight = playground.getByRole('slider', { name: '图标粗细', exact: true });
  assert.equal(await weight.getAttribute('aria-valuenow'), '1.5', 'playground starts with the library icon default');
  await weight.press('Home');
  assert.equal(await weight.getAttribute('aria-valuenow'), '0.3');
  const intensity = playground.getByRole('slider', { name: '图标浓度', exact: true });
  await intensity.press('Home');
  await page.waitForTimeout(100);
  const mass = canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.reduce((total, value, index) => total + (index % 4 === 3 ? value : 0), 0);
  for (const icon of await playground.locator('.icon-examples__stage canvas').all()) assert.equal(await icon.evaluate(mass), 0);
  await intensity.press('End');
  await weight.press('End');
  await page.waitForTimeout(100);
  for (const icon of await playground.locator('.icon-examples__stage canvas').all()) assert(await icon.evaluate(mass) > 0);
  const breaksControl = playground.getByRole('slider', { name: '图标断裂程度', exact: true });
  assert.equal(await breaksControl.getAttribute('aria-valuenow'), '18');
  const beforeBreaks = await playground.locator('.icon-examples__stage canvas').evaluateAll(nodes => nodes.map(canvas => canvas.toDataURL()));
  await breaksControl.press('End');
  await page.waitForTimeout(100);
  assert.equal(await breaksControl.getAttribute('aria-valuenow'), '100');
  const afterBreaks = await playground.locator('.icon-examples__stage canvas').evaluateAll(nodes => nodes.map(canvas => canvas.toDataURL()));
  assert(afterBreaks.some((pixels, i) => pixels !== beforeBreaks[i]), 'break control repaints the preview');
  const pressure = playground.getByRole('slider', { name: '笔压变化', exact: true });
  assert.equal(await pressure.getAttribute('aria-valuenow'), '82');
  await pressure.press('Home');
  assert.equal(await pressure.getAttribute('aria-valuenow'), '0');
  const countControl = playground.getByRole('slider', { name: '最大断裂个数', exact: true });
  assert.equal(await countControl.getAttribute('aria-valuenow'), '1');
  await countControl.press('ArrowRight');
  await countControl.press('ArrowRight');
  assert.equal(await countControl.getAttribute('aria-valuenow'), '3');
  await page.screenshot({ path: '/tmp/inkra-icon-stroke-controls.png' });
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/icon-stroke.tsx');
    window.fixture = mount(container);
  });
  async function sample(props = {}, tokens = {}) {
    await page.evaluate(({ props, tokens }) => window.fixture.configure(props, tokens), { props, tokens });
    await page.waitForTimeout(60);
    return page.locator('[data-testid]').evaluateAll(canvases => Object.fromEntries(canvases.map(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let alpha = 0;
      let hash = 2166136261;
      for (let i = 0; i < pixels.length; i++) {
        hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
        if (i % 4 === 3) alpha += pixels[i];
      }
      return [canvas.dataset.testid, { alpha, hash, width: canvas.width, height: canvas.height }];
    })));
  }
  const normal = await sample({ strokeWidth: 1.2 });
  const defaults = await sample({ strokeWidth: 1.5 });
  assert.deepEqual(await sample({ breaks: 0.18 }), defaults, 'default break setting matches the token');
  const flat = await sample({ pressureVariation: 0 });
  const varied = await sample({ pressureVariation: 1 });
  for (const key of ['base', 'wash', 'scuff']) assert.notEqual(flat[key].hash, varied[key].hash, key + ' pressure variation changes pixels');
  assert.deepEqual(await sample({}, { '--inkra-icon-pressure-variation': '0' }), flat);
  assert.deepEqual(await sample({ pressureVariation: 1 }, { '--inkra-icon-pressure-variation': '0' }), varied);
  assert.deepEqual(await sample({ pressureVariation: -1 }), flat);
  assert.deepEqual(await sample({ pressureVariation: 2 }), varied);
  for (const value of [NaN, Infinity, -Infinity]) assert.deepEqual(await sample({ pressureVariation: value }), defaults);
  assert.deepEqual(await sample({}, { '--inkra-icon-pressure-variation': 'invalid' }), defaults);
  assert.deepEqual(await sample({ pressureVariation: 0.82 }), defaults, 'pressure restores deterministic pixels');
  const unbroken = await sample({ breaks: 0 });
  assert.deepEqual(await sample({ breaks: 1, breakCount: 0 }), unbroken, 'zero gaps disables breaks independently');
  assert.deepEqual(await sample({ breakCount: 1 }), defaults, 'default gap count');
  const threeGaps = await sample({ breakCount: 3 });
  for (const key of ['base', 'wash', 'scuff']) assert.notEqual(threeGaps[key].hash, defaults[key].hash, key + ' displayed paths can use multiple gaps');
  const maximumGaps = await sample({ breakCount: 12 });
  for (const key of ['wash', 'scuff']) assert.equal(threeGaps[key].hash, maximumGaps[key].hash, key + ' short displayed paths saturate before the maximum');
  assert.deepEqual(await sample({}, { '--inkra-icon-break-count': '3' }), threeGaps);
  assert.deepEqual(await sample({ breakCount: 3 }, { '--inkra-icon-break-count': '1' }), threeGaps);
  assert.deepEqual(await sample({ breakCount: 3.9 }), threeGaps);
  assert.deepEqual(await sample({ breakCount: -1 }), await sample({ breakCount: 0 }));
  assert.deepEqual(await sample({ breakCount: 100 }), await sample({ breakCount: 12 }));
  for (const value of [NaN, Infinity, -Infinity]) assert.deepEqual(await sample({ breakCount: value }), defaults);
  assert.deepEqual(await sample({}, { '--inkra-icon-break-count': 'invalid' }), defaults);
  const broken = await sample({ breaks: 1 });
  const quarter = await sample({ breaks: 0.25 });
  const midpoint = await sample({ breaks: 0.5 });
  const afterMidpoint = await sample({ breaks: 0.51 });
  for (const key of ['base', 'wash', 'scuff']) {
    assert.notEqual(unbroken[key].hash, broken[key].hash, key + ' breaks change actual pixels');
    assert.equal(unbroken[key].width, broken[key].width);
    assert.equal(unbroken[key].height, broken[key].height);
    assert.notEqual(unbroken[key].hash, quarter[key].hash, key + ' low-range breaks are visible');
    assert.notEqual(quarter[key].hash, midpoint[key].hash, key + ' first half changes continuously');
    const fullChange = Math.abs(unbroken[key].alpha - broken[key].alpha);
    assert(Math.abs(midpoint[key].alpha - afterMidpoint[key].alpha) < fullChange * 0.12, key + ' no abrupt 50-to-51% jump');
  }
  assert.deepEqual(await sample({ breaks: -1 }), unbroken, 'breaks lower bound');
  assert.deepEqual(await sample({ breaks: 2 }), broken, 'breaks upper bound');
  assert.deepEqual(await sample({}, { '--inkra-icon-breaks': '0' }), unbroken, 'breaks inherit from the container');
  assert.deepEqual(await sample({ breaks: 1 }, { '--inkra-icon-breaks': '0' }), broken, 'explicit breaks override the container');
  assert.deepEqual(await sample({}, { '--inkra-icon-breaks': 'invalid' }), defaults);
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(await sample({ breaks: value }, { '--inkra-icon-breaks': '0' }), unbroken, 'non-finite breaks inherit');
  }
  assert.deepEqual(await sample({ breaks: 0.18 }), defaults, 'break changes restore deterministic cached pixels');
  assert.deepEqual(await sample(), defaults, 'icons default to 1.5');
  assert.deepEqual(await sample({}, { '--inkra-stroke-width': '3' }), defaults, 'general border weights do not override the icon default');
  const thin = await sample({ strokeWidth: 0.5 });
  const thick = await sample({ strokeWidth: 2.5 });
  for (const key of ['base', 'wash', 'scuff']) {
    assert(thin[key].alpha < thick[key].alpha, key + ' stroke width changes rendered coverage');
    assert.equal(thin[key].width, thick[key].width);
    assert.equal(thin[key].height, thick[key].height);
  }
  const half = await sample({ strokeWidth: 1.2, intensity: 0.5 });
  for (const key of ['base', 'wash', 'scuff']) {
    assert(Math.abs(half[key].alpha / normal[key].alpha - 0.5) < 0.015, key + ' intensity is uniform across composited strokes');
  }
  assert.deepEqual(await sample({ strokeWidth: 1.2, intensity: 1 }), normal, 'cache restores exact full-intensity pixels');
  assert.deepEqual(await sample({}, { '--inkra-icon-stroke-width': '1.2', '--inkra-icon-intensity': '0.5' }), half, 'container tokens are inherited');
  assert.deepEqual(await sample({ strokeWidth: 1.2, intensity: 1 }, { '--inkra-icon-stroke-width': '3', '--inkra-icon-intensity': '0.1' }), normal, 'props override container tokens');
  for (const value of [0, -1]) {
    const hidden = await sample({ intensity: value });
    assert(Object.values(hidden).every(icon => icon.alpha === 0));
  }
  assert.deepEqual(await sample({ strokeWidth: 1.2, intensity: 2 }), normal, 'intensity clamps to one');
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(await sample({ strokeWidth: value, intensity: value }), defaults, 'non-finite props fall back to inherited settings');
  }
  assert.deepEqual(await sample({}, { '--inkra-icon-stroke-width': 'invalid', '--inkra-icon-intensity': 'invalid' }), defaults, 'invalid tokens retain icon defaults');
  assert.deepEqual(await sample({ strokeWidth: 100 }), await sample({ strokeWidth: 3 }), 'weight upper bound');
  assert.deepEqual(await sample({ strokeWidth: -2 }), await sample({ strokeWidth: 0.3 }), 'weight lower bound');
  assert.equal(await page.getByRole('img', { name: 'Sample icon' }).count(), 1, 'single semantic image retained');
  assert.deepEqual(errors, []);
  console.log('PASS 3x3 icon preview at desktop/mobile widths; weight/intensity/breaks controls, pixels, badges, wash/scuff, bounds, cache and inherited overrides');
} finally {
  await browser.close();
}
