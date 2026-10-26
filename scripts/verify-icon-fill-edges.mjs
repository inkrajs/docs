import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.DOCS_URL || 'http://127.0.0.1:4180';
const baselinePath = process.env.ICON_EDGE_BASELINE || '/tmp/inkra-icon-fill-edge-baseline.json';
const capture = process.env.ICON_EDGE_CAPTURE === '1';
const baseline = capture ? {} : JSON.parse(readFileSync(baselinePath, 'utf8'));
const browser = await chromium.launch();
const errors = [];
const results = [];

async function snapshot(page) {
  return page.locator('[data-edge-key]').evaluateAll(nodes => Object.fromEntries(nodes.map(canvas => [canvas.dataset.edgeKey, {
    width: canvas.width, height: canvas.height,
    rgba: Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data),
    png: canvas.toDataURL(),
  }])));
}

async function update(page, options) {
  await page.evaluate(value => window.iconEdgeFixture.update(value), options);
  await page.waitForTimeout(80);
}

try {
  for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 954 }, deviceScaleFactor: dpr });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/icon#preview`);
    await page.evaluate(async () => {
      document.querySelector('#root').hidden = true;
      const container = document.createElement('div');
      document.body.append(container);
      window.iconEdgeFixture = (await import('/scripts/fixtures/icon-fill-edges.tsx')).mount(container);
    });
    await page.waitForFunction(() => document.querySelectorAll('[data-edge-key][data-pencil-icon-ready="true"]').length === 24);
    const current = await snapshot(page);
    if (capture) baseline[dpr] = current;
    else {
      for (const [key, after] of Object.entries(current)) {
        const before = baseline[dpr][key];
        assert(before, `${dpr}/${key}: a pre-change baseline exists`);
        assert.equal(after.width, before.width);
        let changed = 0, faded = 0, outside = 0, interior = 0, interiorChanged = 0;
        const radius = Math.ceil(3 * dpr);
        const pigmentAt = index => {
          const [r, g, b, alpha] = before.rgba.slice(index - 3, index + 1);
          return alpha >= 160 && ((r > g * 1.4 && r > b * 1.3) || (b > r * 1.4 && b > g * 1.3));
        };
        for (let index = 3; index < before.rgba.length; index += 4) {
          const oldAlpha = before.rgba[index], alpha = after.rgba[index];
          if (alpha !== oldAlpha) changed++;
          if (alpha < oldAlpha - 8 && alpha > 0) faded++;
          if (oldAlpha === 0 && alpha > 0) outside++;
          if (!pigmentAt(index)) continue;
          const x = ((index - 3) / 4) % before.width;
          const y = Math.floor((index - 3) / 4 / before.width);
          let inner = x >= radius && y >= radius && x < before.width - radius && y < before.height - radius;
          for (let dy = -radius; inner && dy <= radius; dy++) for (let dx = -radius; inner && dx <= radius; dx++) {
            // Exclude subpixel cutouts and the separate dark contour from the fill interior.
            if (!pigmentAt(((y + dy) * before.width + x + dx) * 4 + 3)) inner = false;
          }
          if (inner) {
            interior++;
            if (Math.abs(alpha - oldAlpha) > 1) interiorChanged++;
          }
        }
        assert.equal(outside, 0, `${dpr}/${key}: feathering does not grow into transparent space or fill holes`);
        assert.equal(interiorChanged, 0, `${dpr}/${key}: distant interior pigment is unchanged`);
        if (/^(user|database|folder-open|search|custom)-/.test(key)) {
          assert(changed > 0 && faded > 0, `${dpr}/${key}: formerly hard fill edges have actual partial-alpha falloff`);
        }
        results.push({ dpr, key, changed, faded, outside, interior });
      }
      await update(page, { color: '#2478d4', seed: 41 });
      await update(page, { color: '#cf3656', seed: 17 });
      const restored = await snapshot(page);
      for (const key of Object.keys(current)) assert.equal(restored[key].png, current[key].png, `${dpr}/${key}: seed/color round trip restores identical pixels`);
    }
    await page.getByTestId('icon-edges').screenshot({ path: `/tmp/inkra-icon-fill-edges-${capture ? 'before' : 'after'}-dpr${dpr}.png` });
    await page.close();
  }
  assert.deepEqual(errors, []);
  if (capture) {
    baseline.candidate = JSON.parse(readFileSync(new URL('../library-candidate.json', import.meta.url), 'utf8'));
    writeFileSync(baselinePath, JSON.stringify(baseline));
    console.log(`Captured old-package edges at DPR 1/2: ${baselinePath}`);
  } else {
    writeFileSync('/tmp/inkra-icon-fill-edge-results.json', JSON.stringify(results, null, 2));
    console.log(`PASS ${results.length} edge cases: partial-alpha falloff, no expansion, unchanged interior, deterministic seed/color cache`);
  }
} finally {
  await browser.close();
}
