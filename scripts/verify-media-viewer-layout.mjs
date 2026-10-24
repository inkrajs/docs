import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function visibleWithinClip(locator) {
  return locator.evaluate(node => {
    const box = node.getBoundingClientRect();
    if (box.width < 1 || box.height < 1 || box.left < -1 || box.top < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1) return false;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const clip = parent.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (box.top < clip.top - 1 || box.bottom > clip.bottom + 1)) return false;
      if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (box.left < clip.left - 1 || box.right > clip.right + 1)) return false;
    }
    return true;
  });
}

try {
  for (const [width, height, theme, dir] of [[1305, 954, 'light', 'ltr'], [390, 844, 'dark', 'rtl'], [390, 320, 'light', 'ltr'], [320, 320, 'dark', 'rtl']]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ theme }) => {
      localStorage.setItem('inkra-docs-locale', 'en');
      localStorage.setItem('inkra-docs-theme', theme);
    }, { theme });
    await page.goto(`${base}/docs/components/image-viewer#preview`);
    await page.evaluate(dir => { document.documentElement.dir = dir; }, dir);
    const trigger = page.getByTestId('media-viewer-mixed').getByRole('button');
    await trigger.click();
    const viewer = page.locator('.inkra-image-viewer');
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__image')?.naturalWidth > 0);
    const frame = await viewer.boundingBox();
    assert(frame && Math.abs(frame.x) < 1 && Math.abs(frame.y) < 1 && Math.abs(frame.width - width) < 1 && Math.abs(frame.height - height) < 1, JSON.stringify(frame));
    assert.equal(await viewer.locator('.inkra-overlay__header').count(), 0);
    const close = viewer.getByRole('button', { name: 'Close media viewer', exact: true });
    assert(await visibleWithinClip(close), `close reachable ${width}x${height}`);
    await viewer.getByRole('option').nth(1).click();
    const video = viewer.locator('video');
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer video')?.readyState >= 2);
    const videoBox = await video.boundingBox();
    assert(videoBox && videoBox.width > 100 && videoBox.height >= 44, `nonzero video stage ${width}x${height}: ${JSON.stringify(videoBox)}`);
    assert(await visibleWithinClip(video), `video stays within its stage ${width}x${height}`);
    for (const control of await viewer.locator('.inkra-image-viewer__video-controls button, .inkra-image-viewer__video-controls [role="slider"]').all()) {
      assert(await visibleWithinClip(control), `video control clipped ${width}x${height}: ${await control.getAttribute('aria-label')}`);
    }
    await viewer.getByRole('button', { name: 'Play video', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer video')?.currentTime > 0.1);
    await viewer.getByRole('button', { name: 'Pause video', exact: true }).click();
    const pixels = await video.evaluate(node => {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 18;
      const context = canvas.getContext('2d');
      context.drawImage(node, 0, 0, 32, 18);
      const data = context.getImageData(0, 0, 32, 18).data;
      return data.some((value, index) => index % 4 !== 3 && value > 40);
    });
    assert(pixels, 'decoded video frame is not blank');
    await page.screenshot({ path: `/tmp/inkra-round11-video-${width}x${height}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await viewer.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node === document.activeElement));
    assert.deepEqual(errors, []);
    console.log(`PASS full viewport, no header, actual video pixels and reachable controls: ${width}x${height} ${theme} ${dir}`);
    await page.close();
  }
} finally {
  await browser.close();
}
