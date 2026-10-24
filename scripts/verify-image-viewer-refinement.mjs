import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-features=OverlayScrollbar,OverlayScrollbars'],
  ...(executablePath ? { executablePath } : {}),
});

async function mount(page, id) {
  await page.goto(`${base}/docs/components/image-viewer#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async fixtureId => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = fixtureId;
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/ImageViewerRefinementFixture.tsx');
    window.imageViewerRefinementFixture = fixture.mount(container);
  }, id);
}

async function assertNotClipped(element, boundary, message) {
  const result = await element.evaluate((node, boundaryNode) => {
    const item = node.getBoundingClientRect();
    const failures = [];
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
        const clip = ancestor.getBoundingClientRect();
        if (item.left < clip.left - 1 || item.right > clip.right + 1 || item.top < clip.top - 1 || item.bottom > clip.bottom + 1) {
          failures.push({ className: ancestor.className, clip: { bottom: clip.bottom, left: clip.left, right: clip.right, top: clip.top } });
        }
      }
      if (ancestor === boundaryNode) break;
    }
    return { failures, item: { bottom: item.bottom, left: item.left, right: item.right, top: item.top } };
  }, await boundary.elementHandle());
  assert.deepEqual(result.failures, [], `${message}: ${JSON.stringify(result)}`);
}

async function assertIconPixels(control, message) {
  const pixels = await control.locator('.inkra-pencil-icon').evaluate(canvas => {
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.width || !canvas.height) return 0;
    const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
    let visible = 0;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 0) visible += 1;
    return visible;
  });
  assert(pixels > 0, `${message}: ${pixels} painted pixels`);
}

async function assertPanZoomFitsStage(stage, message) {
  const geometry = await stage.evaluate(node => {
    const height = selector => node.querySelector(selector)?.getBoundingClientRect().height ?? null;
    return {
      clip: height('.inkra-pan-zoom__clip'),
      imageFit: getComputedStyle(node.querySelector('.inkra-image-viewer__image')).objectFit,
      root: height('.inkra-image-viewer__pan-zoom'),
      stage: node.getBoundingClientRect().height,
      viewport: height('.inkra-pan-zoom__viewport'),
      wrapper: height('.react-transform-wrapper'),
    };
  });
  for (const layer of ['root', 'clip', 'wrapper', 'viewport']) {
    assert(geometry[layer] !== null && geometry[layer] <= geometry.stage + 1 && geometry[layer] >= geometry.stage - 1,
      `${message} ${layer}: ${JSON.stringify(geometry)}`);
  }
  assert.equal(geometry.imageFit, 'contain');
}

async function waitStableFrame(page, stage) {
  await page.waitForFunction(node => new Promise(resolve => {
    const first = node.getBoundingClientRect().height;
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(node.isConnected && first === node.getBoundingClientRect().height)));
  }), await stage.elementHandle());
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 320 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page, 'image-viewer-refinement-fixture');
  const trigger = page.getByRole('button', { name: 'Open refined image viewer', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const viewer = page.locator('.inkra-image-viewer');
  const stage = viewer.locator('.inkra-image-viewer__stage');
  const bottom = viewer.locator('.inkra-image-viewer__bottom');
  const tools = viewer.locator('.inkra-image-viewer__tools');
  const close = viewer.getByRole('button', { name: 'Close refined image viewer', exact: true });
  await viewer.waitFor();
  await stage.waitFor();
  await page.waitForFunction(node => node.querySelector('img')?.complete, await stage.elementHandle());

  const geometry = await viewer.evaluate(node => {
    const viewer = node.getBoundingClientRect();
    const stage = node.querySelector('.inkra-image-viewer__stage').getBoundingClientRect();
    const bottom = node.querySelector('.inkra-image-viewer__bottom').getBoundingClientRect();
    const tools = node.querySelector('.inkra-image-viewer__tools').getBoundingClientRect();
    return {
      bottomTop: bottom.top,
      stageBottom: stage.bottom,
      stageHeight: stage.height,
      toolsBottom: tools.bottom,
      toolsTop: tools.top,
      viewer: { bottom: viewer.bottom, height: viewer.height, left: viewer.left, right: viewer.right, top: viewer.top, width: viewer.width },
      viewport: { height: innerHeight, width: innerWidth },
    };
  });
  assert(Math.abs(geometry.viewer.left) <= 1 && Math.abs(geometry.viewer.top) <= 1
    && Math.abs(geometry.viewer.width - geometry.viewport.width) <= 1
    && Math.abs(geometry.viewer.height - geometry.viewport.height) <= 1, JSON.stringify(geometry));
  assert.equal(await viewer.locator('.inkra-overlay__header').count(), 0, 'fullscreen viewer has no visible header');
  assert.equal(await viewer.locator('.inkra-image-viewer__accessible-label').count(), 2, 'dialog keeps hidden title and description');
  assert(geometry.stageHeight >= 44 && geometry.stageBottom <= geometry.bottomTop + 1, JSON.stringify(geometry));
  assert(geometry.toolsTop >= geometry.bottomTop - 1 && geometry.toolsBottom <= geometry.viewer.bottom + 1, JSON.stringify(geometry));
  const shellInk = viewer.locator(':scope > .inkra-overlay__surface > .inkra-pencil-surface__ink');
  assert.equal(await shellInk.evaluate(node => getComputedStyle(node).display), 'none');
  assert(await shellInk.evaluate(node => node.width * node.height <= 300 * 150), 'fullscreen shell never allocates a viewport-sized decorative bitmap');
  await assertNotClipped(close, viewer, 'corner close remains inside the fullscreen viewer');
  await assertPanZoomFitsStage(stage, 'initial image');
  await assertNotClipped(tools, bottom, 'all viewer tools remain inside bottom chrome');
  const thumbnailGeometry = await viewer.locator('.inkra-image-viewer__thumbnails').evaluate(node => {
    const items = [...node.querySelectorAll('.inkra-image-viewer__thumbnail')].map(item => item.getBoundingClientRect());
    const rect = node.getBoundingClientRect();
    return {
      center: items.length ? (items[0].left + items.at(-1).right) / 2 : null,
      overflow: node.scrollWidth > node.clientWidth + 1,
      viewportCenter: rect.left + rect.width / 2,
      viewerCenter: innerWidth / 2,
    };
  });
  if (!thumbnailGeometry.overflow && thumbnailGeometry.center !== null) {
    assert(Math.abs(thumbnailGeometry.center - thumbnailGeometry.viewportCenter) <= 1, JSON.stringify(thumbnailGeometry));
    assert(Math.abs(thumbnailGeometry.center - thumbnailGeometry.viewerCenter) <= 1, JSON.stringify(thumbnailGeometry));
  }
  for (const thumbnail of await viewer.locator('.inkra-image-viewer__thumbnail').all()) {
    await assertNotClipped(thumbnail, bottom, 'thumbnail remains fully visible inside bottom chrome');
  }

  await stage.focus();
  const stageFocus = stage.locator(':scope > .inkra-image-viewer__stage-focus');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await stageFocus.elementHandle());
  assert(await stageFocus.evaluate(node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
  }));
  await page.getByTestId('toggle-rejection').evaluate(node => node.click());
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual((await page.evaluate(() => window.imageViewerRefinementFixture.events)).active.slice(-2), [
    { id: 'two', reason: 'next' }, { id: 'two', reason: 'next' },
  ], 'controlled rejection permits repeated requests');
  assert.match(await viewer.locator('.inkra-image-viewer__counter').textContent(), /1 \/ 3/);
  await page.getByTestId('toggle-rejection').evaluate(node => node.click());
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__counter')?.textContent?.includes('2 / 3'));
  assert.deepEqual((await page.evaluate(() => window.imageViewerRefinementFixture.events)).active.at(-1), { id: 'two', reason: 'next' });

  const rotate = viewer.getByRole('button', { name: 'Rotate refined image', exact: true });
  await rotate.click();
  await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__image-transform')?.style.transform === 'rotate(90deg)');
  await page.getByTestId('refresh-same').evaluate(node => node.click());
  assert.equal(await viewer.locator('.inkra-image-viewer__image-transform').evaluate(node => node.style.transform), 'rotate(90deg)', 'same id object refresh preserves transform state');
  await page.getByRole('button', { name: 'Previous refined image', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__counter')?.textContent?.includes('1 / 3'));
  assert.equal(await viewer.locator('.inkra-image-viewer__image-transform').evaluate(node => node.style.transform), 'rotate(0deg)', 'different id resets rotation state');

  for (const name of ['Zoom out refined image', 'Reset refined zoom', 'Zoom in refined image', 'Rotate refined image']) {
    const control = viewer.getByRole('button', { name, exact: true });
    await control.focus();
    await assertNotClipped(control, bottom, `${name} remains keyboard reachable`);
    await control.press('Enter');
  }
  for (const name of ['Zoom out refined image', 'Zoom in refined image', 'Rotate refined image', 'Previous refined image', 'Next refined image']) {
    await assertIconPixels(viewer.getByRole('button', { name, exact: true }), `${name} icon is non-empty`);
  }
  const thumbnails = viewer.getByRole('listbox', { name: 'Refined thumbnails', exact: true });
  await thumbnails.getByRole('option', { name: 'Show broken', exact: true }).click();
  await viewer.getByRole('alert').waitFor();
  await assertIconPixels(viewer.getByRole('alert'), 'image failure icon is non-empty');
  const retry = viewer.getByRole('button', { name: 'Retry refined image', exact: true });
  await retry.click();
  await viewer.getByRole('alert').waitFor();
  await page.getByTestId('repair-source').evaluate(node => node.click());
  await page.waitForFunction(() => {
    const image = document.querySelector('.inkra-image-viewer__image');
    return image?.complete && image.naturalWidth > 0 && !document.querySelector('.inkra-image-viewer__state[role="alert"]');
  });
  await page.getByTestId('reset-source').evaluate(node => node.click());
  await viewer.getByRole('alert').waitFor();

  await page.getByTestId('clear-images').evaluate(node => node.click());
  await viewer.getByText('Refined empty', { exact: true }).waitFor();
  const emptyState = viewer.locator('.inkra-image-viewer__state');
  await close.focus();
  await page.keyboard.press('Tab');
  assert(await emptyState.evaluate(node => node === document.activeElement), 'Tab reaches the empty state from the close action');
  await page.waitForFunction(node => getComputedStyle(node.querySelector('.inkra-image-viewer__stage-focus')).opacity === '1', await emptyState.elementHandle());
  await page.getByTestId('restore-images').evaluate(node => node.click());
  await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__counter')?.textContent?.includes('1 / 3'));
  await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__image')?.complete
    && document.querySelector('.inkra-image-viewer__tools')
    && document.querySelectorAll('.inkra-image-viewer__navigation > .inkra-button').length === 2);
  const restoredStage = viewer.locator('.inkra-image-viewer__stage');
  await assertPanZoomFitsStage(restoredStage, 'restored image');
  await assertNotClipped(viewer.locator('.inkra-image-viewer__tools'), viewer.locator('.inkra-image-viewer__bottom'), 'restored tools remain visible');
  for (const control of await viewer.locator('.inkra-image-viewer__navigation > .inkra-button').all()) {
    await assertNotClipped(control, restoredStage, 'restored navigation remains visible');
  }
  for (const thumbnail of await viewer.locator('.inkra-image-viewer__thumbnail').all()) {
    await assertNotClipped(thumbnail, viewer.locator('.inkra-image-viewer__bottom'), 'restored thumbnail remains fully visible');
  }
  assert.equal(await viewer.evaluate(node => getComputedStyle(node).animationName), 'none');
  assert.equal(await viewer.getAttribute('data-inkra-theme'), 'dark');
  await page.waitForFunction(() => [...document.querySelectorAll('.inkra-image-viewer__tools-paper .inkra-pencil-surface__ink')]
    .every(canvas => canvas.width > 0 && canvas.height > 0));
  await waitStableFrame(page, restoredStage);
  await page.screenshot({ path: '/tmp/inkra-image-viewer-refinement-390.png', animations: 'disabled' });

  await page.keyboard.press('Escape');
  await page.waitForFunction(node => node === document.activeElement, await trigger.elementHandle());
  assert.deepEqual(errors, []);
  await page.close();

  const forced = await browser.newPage({ viewport: { width: 390, height: 320 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await mount(forced, 'image-viewer-refinement-forced');
    const forcedTrigger = forced.getByRole('button', { name: 'Open refined image viewer', exact: true });
    await forcedTrigger.focus();
    await forcedTrigger.press('Enter');
    const forcedStage = forced.locator('.inkra-image-viewer__stage');
    await forcedStage.waitFor();
    await forcedStage.focus();
    assert.equal(await forcedStage.locator(':scope > .inkra-image-viewer__stage-focus').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedStage.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
  } finally {
    await forced.close();
  }

  console.log('PASS ImageViewer RTL tools, short viewport, pencil focus, keyboard controls, id state reset, failure/retry, empty/restore and forced colors');
} finally {
  await browser.close();
}
