import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const probes = ['.brand-word', '.page-heading h1', 'main .inkra-accordion__trigger-label .inkra-pencil-text', '.brand .inkra-pencil-icon'];

async function verifyInk(page, context) {
  for (const selector of probes) {
    const element = page.locator(selector).first();
    await element.waitFor();
    await page.waitForFunction(node => node.matches('canvas') || node.dataset.pencilReady === 'true', await element.elementHandle());
    const sample = await element.evaluate(node => {
      const canvas = node instanceof HTMLCanvasElement ? node : node.querySelector('canvas');
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const reference = document.createElement('canvas');
      reference.width = reference.height = 1;
      const ctx = reference.getContext('2d');
      ctx.fillStyle = getComputedStyle(node).color;
      ctx.fillRect(0, 0, 1, 1);
      const expected = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      let weight = 0;
      const channels = [0, 0, 0];
      for (let offset = 0; offset < pixels.length; offset += 4) {
        const alpha = pixels[offset + 3];
        weight += alpha;
        for (let channel = 0; channel < 3; channel += 1) channels[channel] += pixels[offset + channel] * alpha;
      }
      return { expected, actual: channels.map(channel => Math.round(channel / weight)), weight };
    });
    assert(sample.weight > 100, `${context} ${selector}: ink is nonblank`);
    assert(sample.actual.every((value, index) => Math.abs(value - sample.expected[index]) <= 12),
      `${context} ${selector}: canvas must match current CSS foreground ${JSON.stringify(sample)}`);
  }
}

try {
  for (const width of [1305, 390]) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('inkra-docs-theme', 'dark');
        localStorage.setItem('inkra-docs-locale', 'en');
      });
      await page.goto(`${base}/docs/components/accordion#preview`, { waitUntil: 'networkidle' });
      await verifyInk(page, `${width}px saved dark ${reducedMotion}`);
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => {
          document.documentElement.dataset.theme = theme;
          document.documentElement.dataset.inkraTheme = theme;
        }, theme);
        await page.waitForTimeout(250);
        await verifyInk(page, `${width}px switched ${theme} ${reducedMotion}`);
      }
      if (reducedMotion === 'reduce') {
        assert.equal(await page.locator('.brand-word').evaluate(node => getComputedStyle(node).transitionDuration), '0s');
        await page.screenshot({ path: `/tmp/inkra-initial-dark-round6-${width}.png`, animations: 'disabled' });
      }
      assert.deepEqual(errors, []);
      console.log(`PASS initial dark and switched theme ink matches DOM: ${width}px ${reducedMotion}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
