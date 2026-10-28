import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_PAN_ZOOM_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

function parseTransform(value) {
  const matrix = value.match(/^matrix\(([-\d.e]+),\s*[-\d.e]+,\s*[-\d.e]+,\s*([-\d.e]+),\s*([-\d.e]+),\s*([-\d.e]+)\)$/);
  if (matrix) return { scale: Number(matrix[1]), x: Number(matrix[3]), y: Number(matrix[4]) };
  const match = value.match(/translate3d?\(([-\d.]+)px,\s*([-\d.]+)px(?:,\s*0px)?\) scale\(([-\d.]+)\)/);
  assert(match, `unexpected transform: ${value}`);
  return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
}

async function currentTransform(viewport) {
  return parseTransform(await viewport.locator('.react-transform-component').evaluate(node => getComputedStyle(node).transform));
}

async function assertContained(root) {
  const boxes = await root.evaluate(node => {
    const clip = node.querySelector('.inkra-pan-zoom__clip');
    const wrapper = node.querySelector('.react-transform-wrapper');
    if (!clip || !wrapper) return null;
    const rootRect = node.getBoundingClientRect();
    const clipRect = clip.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    return {
      root: { left: rootRect.left, top: rootRect.top, right: rootRect.right, bottom: rootRect.bottom },
      clip: { left: clipRect.left, top: clipRect.top, right: clipRect.right, bottom: clipRect.bottom },
      wrapper: { left: wrapperRect.left, top: wrapperRect.top, right: wrapperRect.right, bottom: wrapperRect.bottom },
      rootOverflow: getComputedStyle(node).overflow,
      clipOverflow: getComputedStyle(clip).overflow,
    };
  });
  assert(boxes, 'PanZoom renders its owned clip and engine wrapper');
  assert.equal(boxes.rootOverflow, 'hidden');
  assert.equal(boxes.clipOverflow, 'hidden');
  for (const edge of ['left', 'top']) assert(boxes.wrapper[edge] >= boxes.clip[edge] - 1, JSON.stringify(boxes));
  for (const edge of ['right', 'bottom']) assert(boxes.wrapper[edge] <= boxes.clip[edge] + 1, JSON.stringify(boxes));
  assert(boxes.clip.left >= boxes.root.left - 1 && boxes.clip.right <= boxes.root.right + 1, JSON.stringify(boxes));
}

async function assertControlledBoardFits(page) {
  const controlledRoot = page.locator('.component-example .inkra-pan-zoom').last();
  const geometry = await controlledRoot.evaluate(node => {
    const viewport = node.querySelector('.react-transform-wrapper');
    const board = node.querySelector('.pan-zoom-examples__coordinate-board');
    const anchor = node.querySelector('.pan-zoom-examples__anchor');
    if (!viewport || !board || !anchor) return null;
    const rect = element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    };
    return { viewport: rect(viewport), board: rect(board), anchor: rect(anchor) };
  });
  assert(geometry, 'controlled PanZoom renders its viewport, coordinate board and anchor');
  const { viewport, board, anchor } = geometry;
  assert(board.width > 0 && board.height > 0, JSON.stringify(geometry));
  assert(board.left >= viewport.left - 1 && board.top >= viewport.top - 1, JSON.stringify(geometry));
  assert(board.right <= viewport.right + 1 && board.bottom <= viewport.bottom + 1, JSON.stringify(geometry));
  assert(anchor.width > 0 && anchor.height > 0, JSON.stringify(geometry));
  assert(anchor.left >= viewport.left - 1 && anchor.top >= viewport.top - 1, JSON.stringify(geometry));
  assert(anchor.right <= viewport.right + 1 && anchor.bottom <= viewport.bottom + 1, JSON.stringify(geometry));
}

async function openExample(page) {
  await page.goto(`${base}/docs/components/pan-zoom#preview`);
  const viewport = page.locator('.component-playground .inkra-pan-zoom').first();
  await viewport.locator('img').waitFor();
  await page.waitForFunction(node => node.complete && node.naturalWidth > 0, await viewport.locator('img').elementHandle());
  assert.equal(await viewport.getByRole('button').count(), 0, 'basic PanZoom contains only the artwork');
  return viewport;
}

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const root = await openExample(page);
  const viewport = root.locator('.react-transform-wrapper');
  assert(await viewport.evaluate(node => node.classList.contains('inkra-pan-zoom__viewport')), 'installed TransformComponent preserves the Inkra viewport class');
  await assertContained(root);

  const interactive = page.locator('#pan-zoom-interactive-content');
  const clicksBefore = Number((await interactive.locator('output').textContent())?.match(/\d+$/)?.[0] ?? 0);
  await interactive.getByRole('button', { name: /保留这个想法|Keep this idea/ }).click();
  const clicksAfter = Number((await interactive.locator('output').textContent())?.match(/\d+$/)?.[0] ?? 0);
  assert.equal(clicksAfter, clicksBefore + 1, 'content button remains clickable without starting a pan');

  await viewport.hover({ position: { x: 260, y: 220 } });
  const beforeWheel = await currentTransform(root);
  await page.mouse.wheel(0, -260);
  await page.waitForTimeout(100);
  assert.deepEqual(await currentTransform(root), beforeWheel, 'plain wheel remains available to the page in modifier mode');
  await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
  await page.mouse.wheel(0, -60);
  await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
  await page.waitForTimeout(160);
  const afterWheel = await currentTransform(root);
  assert(afterWheel.scale > beforeWheel.scale, 'modifier + wheel zooms around the pointer');

  await viewport.hover({ position: { x: 160, y: 180 } });
  await page.mouse.down();
  await page.mouse.move(230, 230, { steps: 5 });
  await page.mouse.up();
  const afterPan = await currentTransform(root);
  assert.notDeepEqual([afterPan.x, afterPan.y], [afterWheel.x, afterWheel.y], 'background drag pans content');

  await page.keyboard.press('Tab');
  await viewport.focus();
  assert.equal(await viewport.evaluate(node => getComputedStyle(node).outlineStyle), 'none', 'normal theme uses the pencil focus surface instead of a solid CSS outline');
  assert.equal(await root.locator('.inkra-pan-zoom__focus-ring').evaluate(node => getComputedStyle(node).opacity), '1', 'keyboard focus reveals the PencilSurface focus ring');
  const beforeKeyboard = await currentTransform(root);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(140);
  const afterKeyboard = await currentTransform(root);
  assert.notEqual(afterKeyboard.x, beforeKeyboard.x, 'keyboard arrows provide a pan alternative');
  await page.keyboard.press('=');
  await page.waitForTimeout(140);
  assert((await currentTransform(root)).scale > afterKeyboard.scale, 'keyboard plus provides a zoom alternative');

  await setPlaygroundControls(page.locator('.component-playground'), true);
  const controls = page.getByRole('group', { name: '属性', exact: true });
  await controls.getByRole('tab', { name: /布局|Layout/ }).click();
  await controls.getByRole('button', { name: /适配|Fit/ }).click();
  await page.waitForTimeout(240);
  const fitted = await currentTransform(root);
  assert(fitted.scale >= 0.2 && fitted.scale <= 4, JSON.stringify(fitted));
  await controls.getByRole('button', { name: /复位|Reset/ }).click();
  await page.waitForTimeout(240);
  const reset = await currentTransform(root);
  assert(Math.abs(reset.scale - beforeWheel.scale) < 0.01, JSON.stringify({ beforeWheel, reset }));

  await controls.getByRole('tab', { name: /状态|State/ }).click();
  await controls.getByRole('switch', { name: /只读手势|Read-only gestures/ }).click();
  const beforeReadOnly = await currentTransform(root);
  await viewport.hover({ position: { x: 150, y: 150 } });
  await page.mouse.down();
  await page.mouse.move(250, 230, { steps: 4 });
  await page.mouse.up();
  assert.deepEqual(await currentTransform(root), beforeReadOnly, 'read-only prevents gestures');
  await controls.getByRole('tab', { name: /布局|Layout/ }).click();
  await controls.getByRole('button', { name: /放大|Zoom in/ }).click();
  await page.waitForTimeout(220);
  assert((await currentTransform(root)).scale > beforeReadOnly.scale, 'read-only still allows explicit controls');
  await controls.getByRole('button', { name: /适配|Fit/ }).click();
  await page.waitForTimeout(240);

  await page.screenshot({ path: `${outputDir}/pan-zoom-desktop-light.png`, fullPage: true });
  await page.getByRole('radio', { name: '深色主题' }).last().click();
  await page.waitForFunction(() => document.documentElement.dataset.inkraTheme === 'dark');
  await page.screenshot({ path: `${outputDir}/pan-zoom-desktop-dark.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(error.message));
  const mobileRoot = await openExample(mobile);
  await assertContained(mobileRoot);
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile page has no horizontal overflow');
  const mobileViewport = mobileRoot.locator('.react-transform-wrapper');
  const box = await mobileViewport.boundingBox();
  assert(box.width > 300 && box.height > 300, JSON.stringify(box));
  await assertControlledBoardFits(mobile);
  await mobile.screenshot({ path: `${outputDir}/pan-zoom-mobile.png`, fullPage: true });
  assert.deepEqual(mobileErrors, []);
  await mobile.close();

  console.log('PASS PanZoom modifier wheel policy, drag, keyboard, content actions, fit/reset, read-only controls, themes, controlled fit and mobile layout');
} finally {
  await browser.close();
}
