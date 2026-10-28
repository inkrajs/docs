import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';

function changedPosition(before, after, minimum = 8) {
  return Math.abs(after.x - before.x) >= minimum || Math.abs(after.y - before.y) >= minimum;
}

async function currentTransform(root) {
  return root.locator('.react-transform-component').evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42, scale: matrix.a };
  });
}

async function settledTransform(page, root) {
  let previous = await currentTransform(root);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.waitForTimeout(50);
    const next = await currentTransform(root);
    if (Math.abs(next.x - previous.x) < 0.1 && Math.abs(next.y - previous.y) < 0.1 && Math.abs(next.scale - previous.scale) < 0.001) {
      return next;
    }
    previous = next;
  }
  return previous;
}

async function openFittedCanvas(page) {
  await page.goto(`${base}/docs/components/pan-zoom#preview`);
  const root = page.locator('.component-playground .inkra-pan-zoom').first();
  const viewport = root.locator('.react-transform-wrapper');
  await root.locator('img').waitFor();
  await viewport.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const content = document.querySelector('.component-playground .inkra-pan-zoom .react-transform-component');
    if (!content) return false;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(content).transform);
    return Number.isFinite(matrix.a) && matrix.a > 0 && matrix.a < 0.99;
  });
  return { root, viewport };
}

async function dragWithMouse(page, viewport, deltaX, deltaY) {
  const box = await viewport.boundingBox();
  assert(box && box.width > 0 && box.height > 0, JSON.stringify(box));
  const startX = box.x + box.width * 0.45;
  const startY = box.y + box.height * 0.7;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(80);
}

async function dragWithTouch(page, viewport, deltaX, deltaY) {
  const box = await viewport.boundingBox();
  assert(box && box.width > 0 && box.height > 0, JSON.stringify(box));
  const client = await page.context().newCDPSession(page);
  const startX = box.x + box.width * 0.45;
  const startY = box.y + box.height * 0.7;
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 1 }],
  });
  for (let step = 1; step <= 6; step += 1) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: startX + deltaX * step / 6,
        y: startY + deltaY * step / 6,
        id: 1,
      }],
    });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(80);
  await client.detach();
}

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);

try {
  const desktop = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const desktopErrors = [];
  desktop.on('pageerror', error => desktopErrors.push(error.message));
  const desktopCanvas = await openFittedCanvas(desktop);
  const initialPointerTransform = await currentTransform(desktopCanvas.root);
  assert(initialPointerTransform.scale < 1, JSON.stringify(initialPointerTransform));
  await dragWithMouse(desktop, desktopCanvas.viewport, 70, -40);
  const pointerTransform = await currentTransform(desktopCanvas.root);
  assert.equal(pointerTransform.scale, initialPointerTransform.scale, 'initial-fit pointer drag does not depend on zooming first');
  assert(changedPosition(initialPointerTransform, pointerTransform), JSON.stringify({ initialPointerTransform, pointerTransform }));

  const interactiveExample = desktop.locator('#pan-zoom-interactive-content');
  const interactiveCanvas = interactiveExample.locator('.inkra-pan-zoom');
  await interactiveCanvas.locator('.pan-zoom-examples__board').waitFor();
  await interactiveCanvas.scrollIntoViewIfNeeded();
  const beforeContentAction = await settledTransform(desktop, interactiveCanvas);
  const clicks = interactiveExample.locator('output');
  const clickCountBefore = Number((await clicks.textContent())?.match(/\d+$/)?.[0] ?? 0);
  await interactiveCanvas.getByRole('button', { name: /保留这个想法|Keep this idea/ }).click();
  const clickCountAfter = Number((await clicks.textContent())?.match(/\d+$/)?.[0] ?? 0);
  assert.equal(clickCountAfter, clickCountBefore + 1, 'content controls remain clickable');
  assert.deepEqual(await settledTransform(desktop, interactiveCanvas), beforeContentAction, 'content controls do not start a pan');

  const playground = desktop.locator('.component-playground');
  await setPlaygroundControls(playground, true);
  const controls = playground.locator('.preview-controls');
  await controls.getByRole('tab', { name: /布局|Layout/ }).click();
  const bounds = controls.getByRole('switch', { name: /限制平移边界|Limit pan bounds/ });
  assert.equal(await bounds.isChecked(), false, 'free canvas starts without pan bounds');
  await bounds.click();
  assert.equal(await bounds.isChecked(), true, 'pan bounds remain an explicit opt-in');
  await controls.getByRole('button', { name: /适配|Fit/ }).click();
  await desktop.waitForTimeout(240);
  const boundedTransform = await currentTransform(desktopCanvas.root);
  assert(Object.values(boundedTransform).every(Number.isFinite), JSON.stringify(boundedTransform));
  assert.deepEqual(desktopErrors, []);
  await desktop.close();

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const touchErrors = [];
  touch.on('pageerror', error => touchErrors.push(error.message));
  const touchCanvas = await openFittedCanvas(touch);
  const initialTouchTransform = await currentTransform(touchCanvas.root);
  assert(initialTouchTransform.scale < 1, JSON.stringify(initialTouchTransform));
  await dragWithTouch(touch, touchCanvas.viewport, 54, -36);
  const touchTransform = await currentTransform(touchCanvas.root);
  assert.equal(touchTransform.scale, initialTouchTransform.scale, 'initial-fit touch drag does not depend on pinching first');
  assert(changedPosition(initialTouchTransform, touchTransform), JSON.stringify({ initialTouchTransform, touchTransform }));
  assert.deepEqual(touchErrors, []);
  await touch.close();

  console.log('PASS PanZoom pointer and touch dragging move the initial fitted free canvas without a preceding zoom');
} finally {
  await browser.close();
}
