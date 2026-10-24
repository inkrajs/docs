import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.audioPlayerRefinementFixture.events);

async function waitForMetadata(audio) {
  await page.waitForFunction(node => node.readyState >= 1 && Number.isFinite(node.duration) && node.duration > 0,
    await audio.elementHandle(), { timeout: 5000 });
}

try {
  await page.goto(`${base}/docs/components/audio-player#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'audio-player-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/AudioPlayerRefinementFixture.tsx');
    window.audioPlayerRefinementFixture = mount(container);
  });

  const inline = page.getByTestId('inline-callback-case');
  const inlineAudio = inline.locator('audio');
  await waitForMetadata(inlineAudio);
  assert.equal(await inline.getByRole('group', { name: 'Localized audio controls' }).count(), 1);
  assert.equal(await inline.locator('audio[aria-label="Localized native audio"]').count(), 1);
  const initialLoads = (await events()).loadStarts;
  for (let index = 0; index < 3; index += 1) await inline.getByRole('button', { name: /Rerender inline callback/ }).click();
  await page.waitForTimeout(100);
  assert.equal((await events()).loadStarts, initialLoads, 'inline callback rerenders do not reload native audio');
  assert.notEqual(await page.getByTestId('inline-status').textContent(), 'loading', 'inline callback rerender does not reset state');

  const controlled = page.getByTestId('controlled-case');
  const controlledAudio = controlled.locator('audio');
  await waitForMetadata(controlledAudio);
  const controlledMute = controlled.getByRole('button', { name: 'Mute fixture audio' });
  await controlledMute.click();
  await controlledMute.click();
  assert.deepEqual((await events()).controlledMuted, [true, true], 'rejected controlled mute can be requested again');
  assert.equal(await controlledAudio.evaluate(node => node.muted), false);
  const controlledVolume = controlled.getByRole('slider', { name: 'Fixture volume' });
  await controlledVolume.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const controlledVolumes = (await events()).controlledVolumes;
  assert.equal(controlledVolumes.length, 2);
  assert(controlledVolumes[0] > 0.4 && controlledVolumes[0] === controlledVolumes[1],
    `rejected controlled volume repeats the same proposal: ${JSON.stringify(controlledVolumes)}`);
  assert.equal(await controlledAudio.evaluate(node => node.volume), 0.4);
  const controlledRate = controlled.getByRole('combobox', { name: 'Fixture speed' });
  for (let index = 0; index < 2; index += 1) {
    await controlledRate.click();
    await page.getByRole('option', { name: '1.5x' }).click();
  }
  assert.deepEqual((await events()).controlledRates, [1.5, 1.5], 'rejected controlled rate can be requested again');
  assert.equal(await controlledAudio.evaluate(node => node.playbackRate), 1);

  const uncontrolled = page.getByTestId('uncontrolled-case');
  const uncontrolledAudio = uncontrolled.locator('audio');
  await waitForMetadata(uncontrolledAudio);
  assert.equal(await uncontrolled.locator('audio[aria-label="Explicit native audio name"]').count(), 1,
    'audioProps aria-label overrides labels.audio');
  const volume = uncontrolled.getByRole('slider', { name: 'Fixture volume' });
  await volume.focus();
  await page.keyboard.press('ArrowRight');
  await uncontrolled.getByRole('button', { name: 'Mute fixture audio' }).click();
  const rate = uncontrolled.getByRole('combobox', { name: 'Fixture speed' });
  await rate.click();
  await page.getByRole('option', { name: '1.5x' }).click();
  const beforeRerender = await uncontrolledAudio.evaluate(node => ({ volume: node.volume, muted: node.muted, rate: node.playbackRate }));
  await uncontrolled.getByRole('button', { name: /Rerender uncontrolled/ }).click();
  await page.waitForTimeout(50);
  assert.deepEqual(await uncontrolledAudio.evaluate(node => ({ volume: node.volume, muted: node.muted, rate: node.playbackRate })), beforeRerender,
    'unrelated render does not restore default media settings');
  const uncontrolledVolumes = (await events()).uncontrolledVolumes;
  assert.equal(uncontrolledVolumes.length, 1);
  assert(uncontrolledVolumes[0] > 0.3);
  assert.deepEqual((await events()).uncontrolledMuted, [true]);
  assert.deepEqual((await events()).uncontrolledRates, [1.5]);

  const lifecycle = page.getByTestId('lifecycle-case');
  const lifecycleAudio = lifecycle.locator('audio');
  await waitForMetadata(lifecycleAudio);
  await lifecycle.getByRole('button', { name: 'Set lifecycle volume' }).click();
  await lifecycle.getByRole('button', { name: 'Set lifecycle mute' }).click();
  await lifecycle.getByRole('button', { name: 'Set lifecycle rate' }).click();
  await lifecycle.getByRole('button', { name: 'Clear lifecycle source' }).click();
  await page.waitForFunction(node => node.getAttribute('src') === null
    && node.readyState === HTMLMediaElement.HAVE_NOTHING
    && node.networkState === HTMLMediaElement.NETWORK_EMPTY, await lifecycleAudio.elementHandle());
  assert.equal(await page.getByTestId('lifecycle-status').textContent(), 'idle');
  assert.deepEqual(await lifecycleAudio.evaluate(node => ({
    src: node.getAttribute('src'), readyState: node.readyState, networkState: node.networkState,
    durationEmpty: Number.isNaN(node.duration), currentTime: node.currentTime,
    volume: node.volume, muted: node.muted, rate: node.playbackRate,
  })), { src: null, readyState: 0, networkState: 0, durationEmpty: true, currentTime: 0, volume: 0.35, muted: true, rate: 1.5 });
  const clearedSeek = lifecycle.getByRole('slider', { name: 'Fixture seek' });
  assert.equal(await clearedSeek.getAttribute('aria-valuemax'), '0');
  assert.equal(await clearedSeek.getAttribute('data-disabled'), '');
  await lifecycle.getByRole('button', { name: 'Change lifecycle source' }).click();
  await waitForMetadata(lifecycleAudio);
  assert.deepEqual(await lifecycleAudio.evaluate(node => ({ volume: node.volume, muted: node.muted, rate: node.playbackRate })),
    { volume: 0.35, muted: true, rate: 1.5 }, 'source replacement preserves uncontrolled settings');

  const narrow = page.getByTestId('narrow-case');
  const narrowPlayer = narrow.locator('.inkra-audio-player');
  await waitForMetadata(narrow.locator('audio'));
  const geometry = await narrowPlayer.evaluate(node => {
    const player = node.getBoundingClientRect();
    const controls = node.querySelector('.inkra-audio-player__controls').getBoundingClientRect();
    const time = node.querySelector('.inkra-audio-player__time');
    const timeBox = time.getBoundingClientRect();
    const source = time.querySelector('.inkra-pencil-text__source');
    const range = document.createRange();
    range.selectNodeContents(source);
    return {
      player: { left: player.left, right: player.right, width: player.width },
      controls: { left: controls.left, right: controls.right, width: controls.width },
      time: { left: timeBox.left, right: timeBox.right, width: timeBox.width },
      lines: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right })),
    };
  });
  assert(geometry.controls.left >= geometry.player.left - 1 && geometry.controls.right <= geometry.player.right + 1, JSON.stringify(geometry));
  assert(geometry.time.left >= geometry.player.left - 1 && geometry.time.right <= geometry.player.right + 1, JSON.stringify(geometry));
  assert(geometry.lines.length > 1 && geometry.lines.every(line => line.left >= geometry.time.left - 1 && line.right <= geometry.time.right + 1),
    `long time label wraps inside the player: ${JSON.stringify(geometry)}`);
  for (const control of await narrow.locator('[data-audio-player-control]').all()) {
    const box = await control.boundingBox();
    assert(box && box.x >= geometry.player.left - 1 && box.x + box.width <= geometry.player.right + 1,
      `narrow control stays within player: ${JSON.stringify(box)}`);
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  assert.deepEqual(errors, []);
  console.log('PASS AudioPlayer stable callbacks, controlled proposals, source lifecycle and narrow container layout');
} finally {
  await page.evaluate(() => {
    window.audioPlayerRefinementFixture?.unmount();
    document.getElementById('audio-player-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
