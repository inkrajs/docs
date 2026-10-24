import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
async function configure(page, open) {
  const toggle = page.locator('.component-playground .playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
}
async function choose(page, name, option) {
  await page.getByRole('combobox', { name, exact: true }).click();
  const portalRoot = typeof page.page === 'function' ? page.page() : page;
  await portalRoot.getByRole('option', { name: option, exact: true }).click();
}
async function loadedImage(page) {
  await page.waitForFunction(() => {
    const image = document.querySelector('.inkra-image-viewer__image');
    return image?.complete && image.naturalWidth > 0;
  });
}
async function capture(page, target, name) {
  await target.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/inkra-round10-${name}.png`, animations: 'disabled' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
}
try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const zh = locale === 'zh-CN';
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });

    await page.goto(`${base}/docs/components/audio-player#preview`);
    const audio = page.getByTestId('audio-player-playground');
    await audio.waitFor();
    await configure(page, false);
    await page.waitForFunction(node => node.querySelector('audio')?.duration === 12, await audio.elementHandle());
    await audio.getByRole('button', { name: zh ? '播放' : 'Play', exact: true }).click();
    await page.waitForFunction(node => !node.querySelector('audio').paused, await audio.elementHandle());
    await audio.getByRole('button', { name: zh ? '暂停' : 'Pause', exact: true }).click();
    const seek = audio.getByRole('slider', { name: zh ? '进度' : 'Seek', exact: true });
    await seek.focus();
    await seek.press('End');
    assert((await audio.locator('audio').evaluate(node => node.currentTime)) > 11, 'real audio seeks');
    assert.match(await audio.locator('.audio-player-examples__status').textContent(), zh ? /状态：[\u4e00-\u9fff]+/ : /Status: /);
    const controlled = page.getByTestId('audio-player-controlled');
    await controlled.getByRole('button', { name: zh ? '静音' : 'Mute', exact: true }).click();
    assert(await controlled.locator('audio').evaluate(node => node.muted));
    await choose(controlled, zh ? '倍速' : 'Speed', '1.5x');
    assert.equal(await controlled.locator('audio').evaluate(node => node.playbackRate), 1.5);
    const volume = controlled.getByRole('slider', { name: zh ? '音量' : 'Volume', exact: true });
    await volume.focus();
    await volume.press('End');
    assert.equal(await controlled.locator('audio').evaluate(node => node.volume), 1);
    await controlled.getByRole('button', { name: zh ? '重置播放设置' : 'Reset playback settings', exact: true }).click();
    assert.deepEqual(await controlled.locator('audio').evaluate(node => [node.volume, node.muted, node.playbackRate]), [0.5, false, 1]);
    await capture(page, audio, `audio-${width}`);
    await configure(page, true);
    await page.locator('.component-playground').getByRole('tab', { name: zh ? '组合' : 'Composition', exact: true }).click();
    await page.getByRole('switch', { name: zh ? '自定义控制区' : 'Custom controls', exact: true }).check();
    await configure(page, false);
    await audio.getByRole('button', { name: zh ? '回到开头' : 'Restart', exact: true }).click();
    assert.equal(await audio.locator('audio').evaluate(node => node.currentTime), 0);
    console.log(`PASS live AudioPlayer loaded WAV, playback, seek, controlled settings and custom controls: ${width}`);

    await page.goto(`${base}/docs/components/carousel#preview`);
    const carousel = page.getByTestId('carousel-playground').locator('.inkra-carousel');
    await carousel.waitFor();
    await configure(page, false);
    const geometry = await carousel.evaluate(node => {
      const viewport = node.querySelector('.inkra-carousel__viewport');
      const style = getComputedStyle(viewport);
      return { width: node.clientWidth, visible: Number(style.getPropertyValue('--inkra-carousel-visible')), slide: node.querySelector('.inkra-carousel__slide').getBoundingClientRect().width, viewport: viewport.clientWidth };
    });
    assert.equal(geometry.visible, geometry.width >= 768 ? 3 : geometry.width >= 480 ? 2 : 1, JSON.stringify(geometry));
    assert(Math.abs(geometry.slide * geometry.visible + 16 * (geometry.visible - 1) - geometry.viewport) < 2, JSON.stringify(geometry));
    const project = carousel.getByRole('button', { name: zh ? '打开笔记' : 'Open notes', exact: true }).first();
    await project.click();
    const details = page.getByRole('dialog');
    await details.waitFor();
    await details.getByRole('button', { name: zh ? '关闭' : 'Close', exact: true }).click();
    await page.waitForFunction(node => node === document.activeElement, await project.elementHandle());
    await carousel.focus();
    await carousel.press('End');
    await page.waitForFunction(node => node.querySelectorAll('.inkra-carousel__page')[node.querySelectorAll('.inkra-carousel__page').length - 1]?.getAttribute('aria-current') === 'true', await carousel.elementHandle());
    await carousel.press('Home');
    assert.equal(await carousel.locator('.inkra-carousel__page').first().getAttribute('aria-current'), 'true');
    const links = page.getByRole('link', { name: zh ? '查看细节' : 'View details', exact: true });
    assert.equal(await links.count(), 3);
    for (const link of await links.all()) assert.match(await link.getAttribute('href'), /^\/favicon(?:-dark)?\.png$/);
    await capture(page, carousel, `carousel-${width}`);
    console.log(`PASS live Carousel responsive geometry, actual project action, keyboard and image links: ${width}`);

    await page.goto(`${base}/docs/components/image-viewer#preview`);
    const gallery = page.getByTestId('image-viewer-playground');
    await gallery.waitFor();
    await configure(page, true);
    await choose(page, zh ? '阅读方向' : 'Reading direction', zh ? '从右到左' : 'RTL');
    await configure(page, false);
    const open = gallery.getByRole('button', { name: zh ? '打开图片查看器' : 'Open image viewer', exact: true });
    await open.click();
    await loadedImage(page);
    const viewer = page.locator('.inkra-image-viewer');
    for (const name of [zh ? '缩小图片' : 'Zoom out', zh ? '放大图片' : 'Zoom in']) {
      const icon = viewer.getByRole('button', { name, exact: true }).locator('canvas.inkra-pencil-icon');
      await page.waitForFunction(canvas => {
        if (!canvas.width || !canvas.height) return false;
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return data.some((value, index) => index % 4 === 3 && value > 0);
      }, await icon.elementHandle());
    }
    await viewer.getByRole('button', { name: zh ? '下一张图片' : 'Next image', exact: true }).click();
    await loadedImage(page);
    assert.match(await viewer.locator('.inkra-image-viewer__counter').textContent(), /2/);
    await viewer.getByRole('button', { name: zh ? '顺时针旋转' : 'Rotate clockwise', exact: true }).click();
    assert.equal(await viewer.locator('.inkra-image-viewer__image-transform').evaluate(node => node.style.transform), 'rotate(90deg)');
    await viewer.getByRole('button', { name: zh ? '放大图片' : 'Zoom in', exact: true }).click();
    const toolbarBounds = await viewer.evaluate(node => {
      const frame = node.getBoundingClientRect();
      const stage = node.querySelector('.inkra-image-viewer__stage').getBoundingClientRect();
      const tools = node.querySelector('.inkra-image-viewer__tools').getBoundingClientRect();
      return { inside: tools.left >= frame.left && tools.right <= frame.right && tools.bottom <= frame.bottom, below: tools.top >= stage.bottom - 1 };
    });
    assert(toolbarBounds.inside && toolbarBounds.below, `RTL bottom toolbar: ${JSON.stringify(toolbarBounds)}`);
    await capture(page, viewer, `viewer-${width}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(node => node === document.activeElement, await open.elementHandle());
    const recovery = page.getByTestId('image-viewer-recovery');
    const reopen = recovery.getByRole('button', { name: zh ? '查看恢复状态' : 'View recovery state', exact: true });
    await reopen.click();
    await viewer.getByRole('alert').waitFor();
    await page.keyboard.press('Escape');
    await recovery.getByRole('button', { name: zh ? '恢复图片源' : 'Restore image source', exact: true }).click();
    await reopen.click();
    await loadedImage(page);
    assert.equal(await viewer.getByRole('alert').count(), 0);
    await page.keyboard.press('Escape');
    console.log(`PASS live ImageViewer bitmap, navigation, rotation, RTL tools, focus and source recovery: ${width}`);
    const mixed = page.getByTestId('media-viewer-mixed');
    const mixedTrigger = mixed.getByRole('button', { name: zh ? '浏览图片与视频' : 'Browse images and video', exact: true });
    await mixedTrigger.click();
    await loadedImage(page);
    const rect = await viewer.boundingBox();
    assert(rect && Math.abs(rect.x) < 1 && Math.abs(rect.y) < 1 && Math.abs(rect.width - width) < 1 && Math.abs(rect.height - 954) < 1, JSON.stringify(rect));
    assert.equal(await viewer.locator('.inkra-overlay__header').count(), 0, 'no visible overlay header');
    await viewer.getByRole('option').nth(1).click();
    const video = viewer.locator('video');
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer video')?.readyState >= 2);
    assert.equal(await viewer.locator('.inkra-image-viewer__tools').count(), 0, 'no image tools on video');
    assert.equal(await video.evaluate(node => node.paused && !node.autoplay && !node.controls && node.playsInline), true);
    await viewer.getByRole('button', { name: zh ? '播放视频' : 'Play video', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer video')?.currentTime > 0.1);
    await viewer.getByRole('button', { name: zh ? '暂停视频' : 'Pause video', exact: true }).click();
    assert(await video.evaluate(node => node.paused));
    const videoSeek = viewer.getByRole('slider', { name: zh ? '视频进度' : 'Seek video', exact: true });
    await videoSeek.focus();
    await videoSeek.press('End');
    assert((await video.evaluate(node => node.currentTime)) > 5, 'video timeline seeks');
    await videoSeek.press('Home');
    await choose(page, zh ? '播放速度' : 'Playback speed', '1.5x');
    assert.equal(await video.evaluate(node => node.playbackRate), 1.5);
    await viewer.getByRole('button', { name: zh ? '静音' : 'Mute video', exact: true }).click();
    assert(await video.evaluate(node => node.muted));
    await capture(page, viewer, `mixed-video-${width}`);
    const previousVideo = await video.elementHandle();
    await viewer.getByRole('button', { name: zh ? '播放视频' : 'Play video', exact: true }).click();
    await viewer.getByRole('option').nth(2).click();
    await loadedImage(page);
    assert(await previousVideo.evaluate(node => node.paused), 'switching resource pauses the removed video');
    await page.keyboard.press('Escape');
    await page.waitForFunction(node => node === document.activeElement, await mixedTrigger.elementHandle());
    console.log(`PASS mixed MediaViewer fullscreen, no header, localized video controls, playback, seek and resource cleanup: ${width}`);
    for (const [component, expected, obsolete] of [
      ['audio-player', 'onTimeChange', 'playing / defaultPlaying'],
      ['carousel', 'currentIndex / defaultIndex / onCurrentIndexChange', 'index / onIndexChange'],
      ['image-viewer', 'Root.activeId / defaultActiveId', 'index / defaultIndex / onIndexChange'],
    ]) {
      await page.goto(`${base}/docs/components/${component}#api`);
      const api = page.locator('.component-api');
      await api.waitFor();
      assert((await api.textContent()).includes(expected));
      assert(!(await api.textContent()).includes(obsolete));
      await page.goto(`${base}/docs/components/${component}#accessibility`);
      const guidance = page.locator('.component-api p');
      await guidance.waitFor();
      const copy = await guidance.textContent();
      assert(zh ? /[\u4e00-\u9fff]/.test(copy) : !/[\u4e00-\u9fff]/.test(copy), `${component} localized accessibility: ${copy}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
