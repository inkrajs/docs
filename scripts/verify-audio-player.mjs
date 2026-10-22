import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_AUDIO_PLAYER_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/audio-player#preview`);
    const playground = page.locator('.component-playground').first();
    const audio = playground.locator('.inkra-audio-player');
    await audio.waitFor();
    assert.equal(await audio.locator('audio').count(), 1);
    assert.equal(await audio.getByRole('slider', { name: '进度' }).count(), 1);
    assert.equal(await audio.getByRole('slider', { name: '音量' }).count(), 1);
    assert.equal(await audio.getByRole('combobox', { name: '倍速' }).count(), 1);
    const defaultRate = audio.getByRole('combobox', { name: '倍速' });
    assert.equal((await defaultRate.textContent())?.trim(), '1x', 'default playback-rate value remains visible');
    assert((await defaultRate.boundingBox())?.width >= 88, 'default playback-rate trigger remains at least 88px wide');
    await page.screenshot({ path: `${outputDir}/audio-player-default-${viewport.width}.png`, fullPage: true });
    const media = audio.locator('audio');
    await page.waitForFunction(node => node.readyState >= 1 && Number.isFinite(node.duration) && node.duration > 0, await media.elementHandle(), { timeout: 5000 });
    const duration = await media.evaluate(node => node.duration);
    assert(duration > 0, `expected a real audio duration, got ${duration}`);
    await audio.getByRole('button', { name: '播放' }).click();
    await page.waitForFunction(node => node.paused === false, await media.elementHandle(), { timeout: 5000 });
    assert.equal(await media.evaluate(node => node.paused), false);
    const seek = audio.getByRole('slider', { name: '进度' });
    await seek.focus();
    await page.keyboard.press('End');
    assert((await media.evaluate(node => node.currentTime)) > 0);
    const rate = audio.getByRole('combobox', { name: '倍速' });
    await rate.click();
    await page.getByRole('option', { name: '1.5x' }).click();
    assert.equal(await media.evaluate(node => node.playbackRate), 1.5);
    await audio.getByRole('button', { name: '静音' }).click();
    assert.equal(await media.evaluate(node => node.muted), true);
    const controls = playground.getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('tab', { name: '组合', exact: true }).click();
    await controls.getByRole('switch', { name: '自定义控制区' }).click();
    assert.equal(await playground.getByRole('button', { name: '回到开头' }).count(), 1);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${outputDir}/audio-player-${viewport.width}.png`, fullPage: true });
    await page.close();
  }
  console.log('PASS AudioPlayer native element, controls, custom render, responsive layout and error-free docs page');
} finally {
  await browser.close();
}
