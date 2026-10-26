import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];
const beforePath = process.env.ICON_COLOR_BASELINE || '/tmp/inkra-color-style-before.json';
const old = existsSync(beforePath) ? JSON.parse(readFileSync(beforePath, 'utf8')) : null;

async function palette(page) {
  return page.getByTestId('icon-color-paths').evaluate(root => {
    const expressions = ['var(--inkra-icon-primary, var(--inkra-blue))', 'var(--inkra-icon-secondary, var(--inkra-warning-pigment))', 'var(--inkra-icon-accent, var(--inkra-coral))'];
    return expressions.map(expression => {
      const probe = document.createElement('span');
      probe.style.color = expression;
      root.append(probe);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      context.fillStyle = getComputedStyle(probe).color;
      context.fillRect(0, 0, 1, 1);
      probe.remove();
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    });
  });
}

async function painted(page) {
  await page.waitForFunction(() => {
    const icons = [...document.querySelectorAll('[data-testid="icon-color-paths"] canvas')];
    return icons.length >= 100 && icons.every(icon => icon.dataset.pencilIconReady === 'true');
  }, undefined, { timeout: 120000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function pixels(page, palette) {
  return page.locator('[data-testid="icon-color-paths"] [data-color-icon] canvas').evaluateAll((canvases, colors) => canvases.map(canvas => {
    const hue = rgb => {
      const [r, g, b] = rgb.map(value => value / 255);
      const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
      const saturation = delta / (1 - Math.abs(max + min - 1) || 1);
      if (delta < 0.04 || saturation < 0.12) return null;
      const angle = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
      return (angle * 60 + 360) % 360;
    };
    const hues = colors.map(hue);
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, edge = 0;
    const pigments = colors.map(() => 0);
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 32) continue;
      ink++;
      const x = index / 4 % canvas.width, y = Math.floor(index / 4 / canvas.width);
      if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) edge++;
      const pixel = Array.from(data.slice(index, index + 3));
      const pixelHue = hue(pixel);
      // Pencil grain and the contour darken small regions; compare chroma,
      // not literal RGB, while excluding nearly neutral/transparent pixels.
      const distances = hues.map(target => pixelHue === null || target === null ? Infinity
        : Math.min(Math.abs(pixelHue - target), 360 - Math.abs(pixelHue - target)));
      const nearest = distances.indexOf(Math.min(...distances));
      if (distances[nearest] < 22) pigments[nearest]++;
    }
    return { key: canvas.closest('[data-color-icon]').dataset.colorIcon, size: Number(canvas.dataset.size), ink, edge, pigments };
  }), palette);
}

async function baselines(page) {
  return page.locator('[data-testid="icon-color-paths"] [data-baseline-icon] canvas').evaluateAll(canvases => Object.fromEntries(canvases.map(canvas => [
    `${canvas.closest('[data-baseline-icon]').dataset.baselineIcon}/${canvas.dataset.variant}`, canvas.toDataURL(),
  ])));
}

async function material(page) {
  return page.locator('[data-wash-case]').evaluateAll(canvases => Object.fromEntries(canvases.map(canvas => {
    const inset = Math.ceil(canvas.width * 0.25);
    const data = canvas.getContext('2d').getImageData(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2).data;
    const alphas = Array.from(data).filter((_, index) => index % 4 === 3);
    const mean = alphas.reduce((sum, value) => sum + value, 0) / alphas.length;
    const deviation = Math.sqrt(alphas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / alphas.length);
    return [canvas.dataset.washCase, { mean, deviation, minimum: Math.min(...alphas), maximum: Math.max(...alphas) }];
  })));
}

function validate(results, label) {
  assert.ok(results.length >= 60, `${label}: at least 20 authored icons at three sizes`);
  for (const result of results) {
    const name = `${label} ${result.key} ${result.size}px`;
    assert.ok(result.ink > 4, `${name}: nonblank`);
    assert.equal(result.edge, 0, `${name}: no clipped canvas edges`);
    assert.ok(result.pigments.filter(count => count > 0).length >= 2, `${name}: at least two actual region colors (${result.pigments})`);
  }
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/icon#preview`);
    await page.evaluate(async () => {
      document.getElementById('root').hidden = true;
      const container = document.createElement('div');
      document.body.append(container);
      const fixture = await import('/scripts/fixtures/icon-color-paths.tsx');
      window.iconColorPathsFixture = fixture.mount(container);
    });
    await painted(page);
    const keys = await page.locator('[data-testid="color-catalog"] [data-color-icon]').evaluateAll(nodes => nodes.map(node => node.dataset.colorIcon));
    for (const key of ['calendar-days', 'calendar-check', 'clipboard', 'mail', 'shopping-bag', 'credit-card',
      'package', 'monitor', 'smartphone', 'headphones', 'car', 'bus', 'train-front', 'tent', 'chart-pie',
      'shield-check', 'bookmark-check']) assert(keys.includes(key), `${key}: requested multicolor preset is present`);
    const before = await baselines(page);
    if (old) {
      const expected = Object.fromEntries(old.icons.filter(icon => icon.variant !== 'colorful').map(icon => [`${icon.key}/${icon.variant}`, icon.png]));
      for (const [key, png] of Object.entries(expected)) {
        assert.equal(before[key], png, `${key}: existing outline and ordinary filled pixels stay unchanged`);
      }
    }
    const defaults = await palette(page);
    const defaultPixels = await pixels(page, defaults);
    writeFileSync(`/tmp/inkra-icon-color-pixels-${width}.json`, JSON.stringify({ defaults, pixels: defaultPixels }, null, 2));
    await page.locator('[data-testid="color-catalog"]').screenshot({ path: `/tmp/inkra-icon-color-presets-${width}.png` });
    validate(defaultPixels, `${width} default`);
    const defaultImages = await page.locator('[data-testid="icon-color-paths"] [data-color-icon] canvas').evaluateAll(nodes => nodes.map(canvas => canvas.toDataURL()));
    const materials = await material(page);
    const contour = await page.locator('[data-wash-contour="overlap"]').evaluate(canvas => {
      const context = canvas.getContext('2d');
      const count = (left, right) => {
        const data = context.getImageData(left, 42, right - left, 36).data;
        let ink = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Translucent graphite blends with pigment, so it need not be pure black.
          if (data[i + 3] > 80 && Math.max(data[i], data[i + 1], data[i + 2]) < 150) ink++;
        }
        return ink;
      };
      return { inner: count(45, 48), outer: count(42, 45), covered: count(72, 78) };
    });
    assert(contour.inner > 8 && contour.outer > 8, 'wash contour survives on both sides of an internal region boundary');
    assert.equal(contour.covered, 0, 'front pigment hides rear contours instead of drawing through it');
    for (const size of [24, 40, 120]) {
      const fill = materials[`fill-${size}`], wash = materials[`wash-${size}`];
      assert(wash.mean < fill.mean * 0.85, `${size}px wash exposes noticeably more paper than fill`);
      assert(wash.mean > fill.mean * 0.2, `${size}px wash remains readable pigment, not near-transparent`);
      assert(wash.maximum - wash.minimum > 20 && wash.deviation > 5, `${size}px wash retains nonuniform pencil texture`);
      assert(wash.deviation < 35, `${size}px wash texture stays quiet enough for small icon silhouettes`);
    }
    writeFileSync(`/tmp/inkra-icon-wash-material-${width}.json`, JSON.stringify({ defaults, materials }, null, 2));
    await page.getByTestId('wash-material').screenshot({ path: `/tmp/inkra-icon-wash-material-${width}.png` });
    await page.locator('[data-testid="color-catalog"]').screenshot({ path: `/tmp/inkra-icon-color-presets-${width}.png` });

    await page.evaluate(() => window.iconColorPathsFixture.update({ primary: '#26834a', secondary: '#8d58c5', accent: '#b73a57' }));
    await painted(page);
    validate(await pixels(page, await palette(page)), `${width} custom`);
    assert.deepEqual(await baselines(page), before, 'palette variables do not change outline or monochrome filled pixels');
    await page.locator('[data-testid="color-catalog"]').screenshot({ path: `/tmp/inkra-icon-color-custom-${width}.png` });

    await page.evaluate(() => window.iconColorPathsFixture.update({ dark: true }));
    await painted(page);
    const darkPalette = await palette(page);
    assert.notDeepEqual(darkPalette, defaults, 'default region pigments follow actual light/dark theme tokens');
    validate(await pixels(page, darkPalette), `${width} dark/reset`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: no page overflow`);
    await page.locator('[data-testid="color-catalog"]').screenshot({ path: `/tmp/inkra-icon-color-dark-${width}.png` });
    await page.evaluate(() => window.iconColorPathsFixture.update({}));
    await painted(page);
    assert.deepEqual(await page.locator('[data-testid="icon-color-paths"] [data-color-icon] canvas').evaluateAll(nodes => nodes.map(canvas => canvas.toDataURL())), defaultImages, 'reset restores identical theme-bound default pigments and seed');
    if (width === 1305) {
      const snapshots = () => page.locator('[data-testid="icon-color-paths"] [data-color-icon] canvas[data-size="40"]').evaluateAll(nodes => nodes.map(canvas => ({
        key: canvas.parentElement.parentElement.dataset.colorIcon,
        roles: canvas.parentElement.parentElement.dataset.colorRoles.split(' '),
        png: canvas.toDataURL(),
      })));
      const initial = await snapshots();
      for (const [role, color] of Object.entries({ primary: '#26834a', secondary: '#8d58c5', accent: '#b73a57' })) {
        await page.evaluate(config => window.iconColorPathsFixture.update(config), { [role]: color });
        await painted(page);
        const changed = await snapshots();
        for (let index = 0; index < initial.length; index++) {
          const target = initial[index];
          if (target.roles.includes(role)) assert.notEqual(changed[index].png, target.png, `${target.key}: ${role} region repaints`);
          else assert.equal(changed[index].png, target.png, `${target.key}: unrelated ${role} override does not alter other regions`);
        }
      }
      await page.evaluate(() => window.iconColorPathsFixture.update({}));
      await painted(page);
    }
    console.log(`PASS ${width}: all color presets at 24/40/80px, custom colors, reset/dark, unchanged outline/filled`);
    await page.close();
  }
  assert.deepEqual(errors, [], 'no browser exceptions');
} finally {
  await browser.close();
}
