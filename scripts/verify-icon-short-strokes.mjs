import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 900 }, deviceScaleFactor: Number(process.env.TEST_DPR ?? 2) });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/icon-short-strokes.tsx');
    window.fixture = mount(container);
  });
  await page.waitForFunction(() => document.querySelectorAll('[data-pressure][data-pencil-icon-ready]').length === 12);
  const metrics = await page.locator('[data-pressure]').evaluateAll(nodes => nodes.map(canvas => {
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / 40;
    const alpha = (x, y) => {
      const px = x * scale - 0.5, py = y * scale - 0.5;
      const x0 = Math.floor(px), y0 = Math.floor(py), dx = px - x0, dy = py - y0;
      const value = (x, y) => data[(y * canvas.width + x) * 4 + 3] ?? 0;
      return value(x0, y0) * (1 - dx) * (1 - dy) + value(x0 + 1, y0) * dx * (1 - dy)
        + value(x0, y0 + 1) * (1 - dx) * dy + value(x0 + 1, y0 + 1) * dx * dy;
    };
    const plus = canvas.dataset.symbol === 'plus';
    // Measure away from intersections/corners, which widen a stroke regardless of pressure.
    const lines = plus ? [[5, 12, 19, 12], [12, 5, 12, 19]] : [[20, 6, 9, 17]];
    const widths = [];
    for (const [x1, y1, x2, y2] of lines) {
      const length = Math.hypot(x2 - x1, y2 - y1);
      const nx = -(y2 - y1) / length, ny = (x2 - x1) / length;
      for (let t = 0.15; t <= 0.8; t += 0.025) {
        const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        if (plus && Math.abs(t - 0.5) < 0.2) continue;
        const samples = Array.from({ length: 101 }, (_, i) => ({ offset: (i - 50) / 10, a: alpha(x + 8 + nx * (i - 50) / 10, y + 8 + ny * (i - 50) / 10) }));
        const peak = Math.max(...samples.map(sample => sample.a));
        const visible = samples.filter(sample => sample.a > peak * 0.3);
        widths.push(visible.length ? visible.at(-1).offset - visible[0].offset : 0);
      }
    }
    widths.sort((a, b) => a - b);
    const spread = widths[Math.floor(widths.length * 0.9)] - widths[Math.floor(widths.length * 0.1)];
    return { symbol: canvas.dataset.symbol, size: Number(canvas.dataset.size), pressure: Number(canvas.dataset.pressure), spread };
  }));
  console.log(JSON.stringify(metrics));
  await page.screenshot({ path: '/tmp/inkra-icon-short-strokes.png', fullPage: true });
  for (const symbol of ['plus', 'check']) for (const size of [40, 96]) {
    const samples = metrics.filter(item => item.symbol === symbol && item.size === size);
    assert(samples[2].spread > samples[0].spread + 0.3, `${symbol} ${size}px has visibly wider pressure range, not just opacity changes`);
    assert(samples[1].spread > samples[0].spread, `${symbol} responds at midpoint`);
  }
  const gaps = await page.locator('[data-gaps]').evaluateAll(nodes => nodes.map(canvas => canvas.toDataURL()));
  assert.equal(new Set(gaps).size, 3, 'an enlarged plus can use more than one gap');
  const gapCounts = await page.locator('[data-line-gaps]').evaluateAll(nodes => nodes.map(canvas => {
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / 40;
    const length = Number(canvas.dataset.lineLength);
    const size = Number(canvas.dataset.lineSize);
    let count = 0, inside = false;
    for (let x = Math.ceil((20 - length / 2) * scale) + 2; x < Math.floor((20 + length / 2) * scale) - 2; x++) {
      let alpha = 0;
      for (let y = Math.floor(15 * scale); y < Math.ceil(25 * scale); y++) alpha += data[(y * canvas.width + x) * 4 + 3];
      const empty = alpha < 5;
      if (empty && !inside) count++;
      inside = empty;
    }
    const maximum = Number(canvas.dataset.lineGaps);
    return { length, size, maximum, expected: Math.min(maximum, Math.floor(length * size / 40 / 12)), count };
  }));
  console.log(JSON.stringify(gapCounts));
  for (const result of gapCounts) assert.equal(result.count, result.expected, 'intentional gaps are not filled back in by round caps');
  assert.deepEqual(errors, []);
  console.log('PASS plus/check actual stroke-width contrast at 0/50/100%, length-limited maximum gaps, default and enlarged sizes');
} finally { await browser.close(); }
