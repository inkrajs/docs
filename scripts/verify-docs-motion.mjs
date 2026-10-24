import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.querySelector('[data-playground-moving]'));
}
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      window.playgroundMotions = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (this.matches('.preview-controls, .preview-display, .preview-stage, .code-panel')) {
          window.playgroundMotions.push({ target: this.className, frames, options });
        }
        return animate.call(this, frames, options);
      };
    });
    await page.goto(`${base}/docs/components/transfer#preview`);
    const playground = page.locator('.component-playground').first();
    const controls = playground.locator('.preview-controls');
    const display = playground.locator('.preview-display');
    const toggle = playground.locator('.playground-config-toggle');
    await playground.waitFor();
    await settle(page);
    if (await toggle.getAttribute('aria-expanded') === 'false') {
      await toggle.click();
      await settle(page);
    }
    const search = controls.getByRole('switch').first();
    await search.click();
    const checked = await search.isChecked();
    await toggle.click();
    assert.equal(await controls.getAttribute('inert'), '');
    assert.equal(await controls.getAttribute('aria-hidden'), 'true');
    await controls.waitFor({ state: 'hidden' });
    await settle(page);
    assert.equal(await playground.getAttribute('data-controls-present'), 'false');

    // Reverse a closing panel before its exit completes; stale completions must not hide it.
    await toggle.evaluate(button => button.click());
    await toggle.evaluate(button => button.click());
    await toggle.evaluate(button => button.click());
    await settle(page);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await controls.isVisible(), true);
    assert.equal(await controls.getAttribute('inert'), null);
    assert.equal(await search.isChecked(), checked);
    await search.focus();
    await page.keyboard.press('Escape');
    assert.equal(await toggle.evaluate(button => button === document.activeElement), true);
    await controls.waitFor({ state: 'hidden' });
    await settle(page);

    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    await settle(page);
    assert.equal(await playground.locator('.preview-stage').getAttribute('inert'), '');
    assert.equal(await playground.locator('.code-panel').isVisible(), true);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    await settle(page);
    const originalHeight = await display.evaluate(element => element.offsetHeight);
    await display.locator('.preview-stage').evaluate((stage, originalHeight) => {
      const probe = document.createElement('div');
      probe.dataset.motionHeightProbe = '';
      // Keep the probe inside the motion hook's 0.5x-2x scale budget at either viewport.
      probe.style.cssText = `height: ${Math.max(44, Math.round(originalHeight / 4))}px; width: 100%; flex: none`;
      stage.append(probe);
    }, originalHeight);
    await page.waitForFunction(height => document.querySelector('.preview-display').offsetHeight > height, originalHeight);
    await settle(page);
    assert(originalHeight / await display.evaluate(element => element.offsetHeight) >= 0.5,
      'height probe stays within the bounded animation budget');
    await page.locator('[data-motion-height-probe]').evaluate(element => element.remove());
    await settle(page);
    assert.equal(await display.evaluate(element => element.offsetHeight), originalHeight);
    assert.equal(await display.evaluate(element => getComputedStyle(element).transform), 'none');

    const motions = await page.evaluate(() => window.playgroundMotions);
    for (const target of ['preview-controls', 'preview-display', 'preview-stage', 'code-panel']) {
      assert(motions.some(motion => motion.target === target), `${target} has a bounded transition`);
    }
    for (const motion of motions) {
      assert.equal(motion.options.duration, 180);
      assert(motion.frames.every(frame => Object.keys(frame).every(key => ['transform', 'opacity'].includes(key))), 'no animated layout dimensions');
    }

    await toggle.click();
    await settle(page);
    if (width === 1305) {
      await playground.evaluate(element => element.style.width = '720px');
      await settle(page);
      assert.equal(await playground.getAttribute('data-controls-layout'), 'overlay');
      await toggle.click();
      await controls.waitFor({ state: 'hidden' });
      await toggle.click();
      await settle(page);
      await playground.evaluate(element => element.style.width = '420px');
      await settle(page);
    }
    assert.equal(await playground.getAttribute('data-controls-layout'), 'full');
    assert.equal(await display.getAttribute('inert'), '');
    assert.equal(await playground.locator('.preview-controls-divider').isVisible(), false);
    await playground.screenshot({ path: `/tmp/inkra-docs-motion-${width}.png` });

    // Preference changes also finish an already running transition without stranding presence.
    await toggle.evaluate(button => button.click());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await controls.waitFor({ state: 'hidden' });
    await settle(page);
    const beforeReduced = await page.evaluate(() => window.playgroundMotions.length);
    await toggle.click();
    await settle(page);
    await toggle.click();
    await controls.waitFor({ state: 'hidden' });
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    await settle(page);
    assert.equal(await page.evaluate(() => window.playgroundMotions.length), beforeReduced, 'reduced motion starts no WAAPI transitions');
    assert.equal(await playground.locator('[data-playground-moving]').count(), 0);
    await page.close();
    console.log(`PASS docs motion, reversal, intrinsic height and reduced motion at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
