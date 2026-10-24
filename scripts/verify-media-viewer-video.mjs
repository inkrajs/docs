import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(`${base}/docs/components/image-viewer#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'media-viewer-video-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/MediaViewerVideoFixture.tsx');
    window.mediaViewerVideoFixture = mount(container);
  });

  const trigger = page.getByRole('button', { name: 'Open mixed media viewer' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Mixed media viewer' });
  await dialog.waitFor();
  const video = dialog.locator('video[aria-label="Animated Inkra artwork"]');
  await page.waitForFunction(node => node.readyState >= 1 && Number.isFinite(node.duration) && node.duration > 0,
    await video.elementHandle(), { timeout: 5000 });
  assert.equal(await video.getAttribute('controls'), null);
  assert.equal(await video.getAttribute('autoplay'), null);
  assert.equal(await video.getAttribute('playsinline'), '');
  assert.equal(await dialog.getByRole('group', { name: 'Artwork video controls' }).count(), 1);

  await page.evaluate(() => {
    window.mediaViewerOriginalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function rejectFixturePlay() {
      return Promise.reject(new DOMException('Fixture playback rejection', 'NotAllowedError'));
    };
  });
  await dialog.getByRole('button', { name: 'Play artwork video' }).click();
  await dialog.getByRole('alert').filter({ hasText: 'Artwork video could not start.' }).waitFor();
  assert.equal(await video.evaluate(node => node.paused), true);
  await page.evaluate(() => {
    HTMLMediaElement.prototype.play = window.mediaViewerOriginalPlay;
    delete window.mediaViewerOriginalPlay;
  });
  await dialog.getByRole('button', { name: 'Play artwork video' }).click();
  await page.waitForFunction(node => !node.paused, await video.elementHandle(), { timeout: 5000 });
  const seek = dialog.getByRole('slider', { name: 'Seek artwork video' });
  await seek.focus();
  await page.keyboard.press('End');
  assert(await video.evaluate(node => node.currentTime > 0));
  const volume = dialog.getByRole('slider', { name: 'Artwork video volume' });
  await volume.focus();
  await page.keyboard.press('ArrowLeft');
  assert(await video.evaluate(node => node.volume < 1));
  await dialog.getByRole('button', { name: 'Mute artwork video' }).click();
  assert.equal(await video.evaluate(node => node.muted), true);
  const rate = dialog.getByRole('combobox', { name: 'Artwork video speed' });
  await rate.click();
  await page.getByRole('option', { name: '1.5x' }).click();
  assert.equal(await video.evaluate(node => node.playbackRate), 1.5);

  const oldVideo = await video.elementHandle();
  await dialog.getByRole('button', { name: 'Next resource' }).click();
  await dialog.getByRole('img', { name: 'Static Inkra artwork' }).waitFor();
  assert.equal(await oldVideo.evaluate(node => node.paused), true, 'resource switch pauses the old video');
  assert.equal(await dialog.locator('video').count(), 0, 'video resource unmounts on image selection');
  assert.deepEqual(windowed((await page.evaluate(() => window.mediaViewerVideoFixture.events.active))), ['image']);

  await dialog.getByRole('button', { name: 'Previous resource' }).click();
  const reopenedVideo = dialog.locator('video[aria-label="Animated Inkra artwork"]');
  await page.waitForFunction(node => node.readyState >= 1, await reopenedVideo.elementHandle(), { timeout: 5000 });
  const reopenedHandle = await reopenedVideo.elementHandle();
  await dialog.getByRole('button', { name: 'Play artwork video' }).click();
  await page.waitForFunction(node => !node.paused, reopenedHandle, { timeout: 5000 });
  await dialog.getByRole('button', { name: 'Close mixed media viewer' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await reopenedHandle.evaluate(node => node.paused), true, 'closing viewer pauses video before unmount');
  assert(await trigger.evaluate(node => node === document.activeElement), 'viewer restores trigger focus');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('PASS MediaViewer video controls, resource switching, cleanup and focus return');
} finally {
  await page.evaluate(() => {
    if (window.mediaViewerOriginalPlay) HTMLMediaElement.prototype.play = window.mediaViewerOriginalPlay;
    window.mediaViewerVideoFixture?.unmount();
    document.getElementById('media-viewer-video-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}

function windowed(values) { return values.slice(-1); }
