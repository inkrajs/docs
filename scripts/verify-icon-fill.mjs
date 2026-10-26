import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DOCS_URL || 'http://127.0.0.1:4180';
const baselinePath = process.env.ICON_OUTLINE_BASELINE || '/tmp/inkra-icon-outline-baseline.json';
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
const browser = await chromium.launch();
const errors = [];

async function mount(page) {
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/docs/components/icon#preview`);
  await page.evaluate(async () => {
    document.querySelector('#root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/icon-fill.tsx');
    window.iconFillFixture = fixture.mount(container);
  });
  await painted(page);
}

async function painted(page) {
  await page.waitForFunction(() => {
    const icons = [...document.querySelectorAll('[data-testid="icon-fill-fixture"] canvas')];
    return icons.length >= 20 && icons.every(icon => icon.dataset.pencilIconReady === 'true');
  }, undefined, { timeout: 120000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function update(page, configuration) {
  await page.evaluate(next => window.iconFillFixture.update(next), configuration);
  await page.waitForTimeout(80);
  await painted(page);
}

async function pixels(locator) {
  return locator.evaluate(canvas => {
    const { width, height } = canvas;
    const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let ink = 0, red = 0, blue = 0, green = 0, contour = 0, alpha = 0, edge = 0;
    for (let index = 0; index < rgba.length; index += 4) {
      const a = rgba[index + 3];
      alpha += a;
      if (a < 16) continue;
      ink++;
      if (rgba[index] > rgba[index + 2] * 1.25 && rgba[index] > rgba[index + 1] * 1.25) red++;
      if (rgba[index + 2] > rgba[index] * 1.25 && rgba[index + 2] > rgba[index + 1] * 1.1) blue++;
      if (rgba[index + 1] > rgba[index] * 1.25 && rgba[index + 1] > rgba[index + 2] * 1.25) green++;
      if (rgba[index] < 100 && rgba[index + 1] < 140 && rgba[index + 1] > rgba[index] * 1.15 && rgba[index + 1] > rgba[index + 2] * 0.95) contour++;
      const x = index / 4 % width, y = Math.floor(index / 4 / width);
      if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) edge++;
    }
    return { width, height, ink, red, blue, green, contour, alpha, edge, png: canvas.toDataURL() };
  });
}

async function alphaAt(locator, x, y, sourceSize = 24) {
  return locator.evaluate((canvas, point) => {
    const offset = (40 - point.sourceSize) / 2;
    const cx = Math.round((point.x + offset) * canvas.width / 40);
    const cy = Math.round((point.y + offset) * canvas.height / 40);
    const data = canvas.getContext('2d').getImageData(cx - 1, cy - 1, 3, 3).data;
    return Array.from(data).filter((_, index) => index % 4 === 3).reduce((sum, value) => sum + value, 0) / 9;
  }, { x, y, sourceSize });
}

try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, deviceScaleFactor: 1 });
  await mount(page);
  const representative = key => page.locator(`[data-testid="representatives"] [data-icon="${key}"] canvas`);
  const outline = {};
  for (const key of await page.locator('[data-testid="representatives"] [data-icon]').evaluateAll(nodes => nodes.map(node => node.dataset.icon))) {
    outline[key] = await pixels(representative(key));
    if (baseline?.[key]) assert.equal(outline[key].png, baseline[key], `${key}: existing outline pixels remain unchanged`);
  }
  console.log(baseline ? 'PASS old-package outline pixel baseline' : 'NOTE no old-package outline baseline supplied; default/explicit outline equivalence checked below');

  await update(page, { catalog: true, variant: 'filled', fillColor: '#cf3656' });
  const catalog = await page.locator('[data-catalog-icon]').evaluateAll(nodes => nodes.map(node => {
    const images = [...node.querySelectorAll('canvas')].map(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0, edge = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 16) continue;
        ink++;
        const x = ((i - 3) / 4) % canvas.width, y = Math.floor((i - 3) / 4 / canvas.width);
        if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) edge++;
      }
      return { variant: canvas.dataset.variant, ink, edge, png: canvas.toDataURL() };
    });
    return { key: node.dataset.catalogIcon, images };
  }));
  assert(catalog.length >= 200, 'the complete catalog, not only a curated subset, is exercised');
  for (const { key, images } of catalog) {
    const [defaultIcon, outlineIcon, filledIcon] = images;
    assert.equal(defaultIcon.png, outlineIcon.png, `${key}: outline is backward-compatible default`);
    assert.notEqual(filledIcon.png, outlineIcon.png, `${key}: filled has a real visual effect`);
    for (const icon of images) {
      assert(icon.ink > 2, `${key} ${icon.variant}: nonblank`);
      assert.equal(icon.edge, 0, `${key} ${icon.variant}: no canvas-edge clipping`);
    }
  }
  console.log(`PASS all ${catalog.length} catalog icons: default, outline, filled, nonblank, bounds`);
  await page.getByTestId('catalog').evaluate(section => {
    section.style.gridTemplateColumns = 'repeat(10, minmax(0, 1fr))';
    for (const canvas of section.querySelectorAll('canvas')) {
      if (canvas.dataset.variant !== 'filled') canvas.style.display = 'none';
      else { canvas.style.width = '72px'; canvas.style.height = '72px'; }
    }
  });
  for (let chunk = 0; chunk < Math.ceil(catalog.length / 100); chunk++) {
    await page.locator('[data-catalog-icon]').evaluateAll((nodes, index) => {
      nodes.forEach((node, position) => { node.style.display = position >= index * 100 && position < (index + 1) * 100 ? 'block' : 'none'; });
    }, chunk);
    await page.getByTestId('catalog').screenshot({ path: `/tmp/inkra-icon-fill-catalog-${chunk}.png` });
  }

  await update(page, { catalog: false });
  for (const [key, x, y] of [['settings', 12, 12], ['map-pin', 12, 10], ['eye', 12, 12]]) {
    assert(await alphaAt(representative(key), x, y) < 24, `${key}: interior hole remains transparent`);
  }
  assert(await alphaAt(representative('plus'), 8, 8) < 24, 'plus does not turn into a closed polygon');
  assert(await alphaAt(representative('check'), 10, 10) < 24, 'check does not gain an implicit triangle');
  assert((await pixels(representative('folder'))).red > 300, 'folder exposes actual customizable filled area');
  assert((await pixels(representative('folder'))).ink > outline.folder.ink * 1.4, 'folder visibly fills its body');
  const regions = await pixels(page.getByTestId('custom-regions'));
  assert(regions.red > 500 && regions.blue > 500, 'independent path colors render separate fill regions');
  assert(await alphaAt(page.getByTestId('custom-regions'), 20, 20, 40) < 8, 'explicit cutout is transparent');
  assert(await alphaAt(page.getByTestId('intersecting'), 20, 20, 40) > 100, 'intersecting silhouettes union instead of XOR holes');
  assert(await alphaAt(page.getByTestId('nested'), 20, 20, 40) > 100, 'three nesting levels retain the solid center');
  assert(await alphaAt(page.getByTestId('nested'), 20, 26, 40) < 24, 'nested contour creates a transparent annulus');
  assert(await alphaAt(page.getByTestId('rule-evenodd'), 20, 20, 40) < 8, 'explicit evenodd fill preserves the hole');
  assert(await alphaAt(page.getByTestId('rule-nonzero'), 20, 20, 40) > 100, 'explicit nonzero rule fills same-winding interior');
  assert(await alphaAt(page.getByTestId('detail-palette'), 13.5, 6.5) < 80, 'palette paint dot survives as negative space');
  assert(await alphaAt(page.getByTestId('detail-circle-dot'), 12, 12) < 80, 'small nested circle is not painted over by its outline');
  assert(await alphaAt(page.getByTestId('detail-search'), 11, 11) < 24, 'search keeps a hollow magnifier lens');
  assert(await alphaAt(page.getByTestId('detail-command'), 12, 12) < 24, 'command remains a line symbol, not a solid tile');
  for (const size of [24, 40, 120]) {
    const alpha = await page.getByTestId(`tiny-hole-${size}`).evaluate(canvas => {
      const center = canvas.width / 2;
      const data = canvas.getContext('2d').getImageData(Math.floor(center) - 1, Math.floor(center) - 1, 2, 2).data;
      return Math.min(...Array.from(data).filter((_, index) => index % 4 === 3));
    });
    assert(alpha < (size === 24 ? 210 : size === 40 ? 140 : 24), `${size}px: a small hole remains distinguishable from opaque pigment`);
  }
  await page.getByTestId('representatives').screenshot({ path: '/tmp/inkra-icon-fill-desktop.png' });

  const redFolder = await pixels(representative('folder'));
  await update(page, { fillColor: '#2478d4' });
  const blueFolder = await pixels(representative('folder'));
  assert(blueFolder.blue > 300 && blueFolder.red < redFolder.red / 5, 'changing fillColor invalidates image cache');
  assert(redFolder.contour > 100 && blueFolder.contour > 100, 'custom fill colors preserve the independently colored contour');
  assert.equal(blueFolder.width, redFolder.width);
  assert.equal(blueFolder.height, redFolder.height);
  await update(page, { fillColor: '#cf3656' });
  assert.equal((await pixels(representative('folder'))).png, redFolder.png, 'color round trip restores deterministic pixels');
  await update(page, { intensity: 0.5 });
  const faded = await pixels(representative('folder'));
  assert(faded.alpha > redFolder.alpha * 0.46 && faded.alpha < redFolder.alpha * 0.54, 'intensity composites fill and strokes once');
  await update(page, { intensity: 0 });
  assert.equal((await pixels(representative('folder'))).alpha, 0, 'zero intensity remains truly transparent');
  assert.equal(await page.getByTestId('named').getAttribute('aria-label'), 'Colored folder');
  await update(page, { intensity: 1 });

  const variable = page.getByTestId('variable');
  assert((await pixels(variable)).red > 300, 'CSS variable resolves initial fill color');
  await page.getByTestId('icon-fill-fixture').evaluate(node => node.style.setProperty('--fixture-fill', '#2478d4'));
  await page.waitForTimeout(100);
  assert((await pixels(variable)).blue > 300, 'ancestor CSS variable mutation repaints fill');
  const leftToRight = await pixels(page.getByTestId('composite'));
  await update(page, { direction: 'rtl' });
  const rightToLeft = await pixels(page.getByTestId('composite'));
  assert.notEqual(rightToLeft.png, leftToRight.png, 'logical badge end switches corners in RTL');
  assert(leftToRight.green > 5 && rightToLeft.green > 5, 'badge keeps its independently configured fill color');
  await update(page, { direction: 'ltr', variant: 'outline', fillColor: 'currentColor' });
  assert.equal((await pixels(representative('folder'))).png, outline.folder.png, 'variant round trip restores original outline');
  console.log('PASS holes, open shapes, custom fill regions, color/variant cache, intensity, CSS variables, semantics and RTL badge');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await update(page, { variant: 'filled', fillColor: '#cf3656' });
    await page.getByTestId('icon-fill-fixture').evaluate(node => { node.style.color = 'var(--inkra-ink)'; });
    let lightInherited;
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      await page.waitForTimeout(80);
      assert((await pixels(representative('folder'))).red > 300);
      const inherited = await pixels(page.getByTestId('inherited-fill'));
      if (theme === 'light') lightInherited = inherited.png;
      else assert.notEqual(inherited.png, lightInherited, 'currentColor fill follows theme ink');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${theme}: no page overflow`);
      await page.getByTestId('representatives').screenshot({ path: `/tmp/inkra-icon-fill-${theme}-${width}.png` });
    }
    console.log(`PASS filled icon gallery light/dark at ${width}px`);
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForTimeout(100);
  assert((await pixels(representative('folder'))).ink > 100, 'forced colors does not leave an empty canvas');
  assert.deepEqual(errors, []);
  await page.close();
} finally {
  await browser.close();
}
