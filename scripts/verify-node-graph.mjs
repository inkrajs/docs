import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_NODE_GRAPH_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

function transformParts(value) {
  const match = value.match(/translate\(([-\d.]+)px,\s*([\-\d.]+)px\) scale\(([-\d.]+)\)/);
  assert(match, `unexpected viewport transform: ${value}`);
  return match.slice(1).map(Number);
}

async function alphaPixels(canvas) {
  return canvas.evaluate(node => {
    const context = node.getContext('2d');
    if (!context || !node.width || !node.height) return 0;
    const pixels = context.getImageData(0, 0, node.width, node.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count++;
    return count;
  });
}

async function dragBy(page, locator, delta) {
  const box = await locator.boundingBox();
  assert(box, 'drag source has a measurable box');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 12 });
  await page.mouse.up();
}

async function dragTo(page, source, target) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  assert(sourceBox && targetBox, 'connection endpoints have measurable boxes');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function openGraph(page) {
  await page.goto(`${base}/docs/components/node-graph#preview`);
  const graph = page.locator('.component-playground .inkra-node-graph').first();
  await graph.locator('[data-testid="rf__node-brief"]').waitFor();
  await graph.locator('.react-flow__edge .inkra-node-graph__edge-pencil[data-pencil-ready]').first().waitFor();
  await page.waitForFunction(() => {
    const root = document.querySelector('.component-playground .inkra-node-graph');
    if (!root) return false;
    const edges = root.querySelectorAll('.react-flow__edge');
    return edges.length > 0
      && edges.length === root.querySelectorAll('.react-flow__edge .inkra-node-graph__edge-pencil[data-pencil-ready]').length;
  });
  return graph;
}

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const graph = await openGraph(page);

  const initialEdgeCount = await graph.locator('.react-flow__edge').count();
  const edgePaths = await graph.locator('.react-flow__edge .inkra-node-graph__edge-measure').evaluateAll(paths => paths.map(path => ({
    d: path.getAttribute('d'),
    length: path.getTotalLength(),
  })));
  assert.equal(edgePaths.length, initialEdgeCount, 'each engine edge exposes one measurable geometry path');
  assert(edgePaths.every(path => path.d && path.length > 20), JSON.stringify(edgePaths));
  assert.equal(
    await graph.locator('.react-flow__edge .inkra-node-graph__edge-pencil[data-pencil-ready]').count(),
    initialEdgeCount,
    'each engine edge has a ready pencil canvas',
  );
  const edgeCanvas = graph.locator('.react-flow__edge .inkra-node-graph__edge-canvas').first();
  assert(await alphaPixels(edgeCanvas) > 0, 'edge pencil canvas contains visible pixels');
  const nodeCanvas = graph.locator('.inkra-node-graph__node-paper canvas.inkra-pencil-surface__ink').first();
  await page.waitForFunction(() => document.querySelector('.component-playground .inkra-node-graph__node-paper canvas.inkra-pencil-surface__ink')?.width > 0);
  assert(await alphaPixels(nodeCanvas) > 100, 'node paper canvas contains visible pixels');

  const viewport = graph.locator('.react-flow__viewport');
  const initialViewport = transformParts(await viewport.evaluate(node => node.style.transform));
  const pane = graph.locator('.react-flow__pane');
  const graphBox = await graph.boundingBox();
  assert(graphBox, 'graph has a measurable box');
  const panStart = await page.evaluate(box => {
    for (let y = box.y + 20; y < box.y + box.height - 20; y += 20) {
      for (let x = box.x + 20; x < box.x + box.width - 20; x += 20) {
        if (document.elementFromPoint(x, y)?.classList.contains('react-flow__pane')) return { x, y };
      }
    }
    return null;
  }, graphBox);
  assert(panStart, 'graph exposes a background point for panning');
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down();
  await page.mouse.move(panStart.x + 70, panStart.y + 50, { steps: 5 });
  await page.mouse.up();
  const pannedViewport = transformParts(await viewport.evaluate(node => node.style.transform));
  assert.notDeepEqual(pannedViewport.slice(0, 2), initialViewport.slice(0, 2), 'background drag pans the viewport');

  await pane.hover({ position: { x: 300, y: 220 } });
  await page.mouse.wheel(0, -280);
  await page.waitForTimeout(120);
  const zoomedViewport = transformParts(await viewport.evaluate(node => node.style.transform));
  assert(zoomedViewport[2] > pannedViewport[2], 'wheel zoom changes the viewport scale');
  await graph.locator('.inkra-node-graph__control').last().click();
  await page.waitForTimeout(220);
  const fittedViewport = transformParts(await viewport.evaluate(node => node.style.transform));
  assert(fittedViewport.every(Number.isFinite));

  const brief = graph.locator('[data-testid="rf__node-brief"]');
  const briefBefore = await brief.boundingBox();
  await dragBy(page, brief, { x: 80, y: 70 });
  const briefAfter = await brief.boundingBox();
  assert(Math.hypot(briefAfter.x - briefBefore.x, briefAfter.y - briefBefore.y) > 12, 'node drag changes its screen position');

  await brief.focus();
  const keyboardBefore = await brief.getAttribute('style');
  await page.keyboard.press('ArrowRight');
  const keyboardAfter = await brief.getAttribute('style');
  assert.notEqual(keyboardAfter, keyboardBefore, 'keyboard arrow moves a focused node');

  const edgeCount = await graph.locator('.react-flow__edge').count();
  const source = graph.locator('[data-nodeid="brief"][data-handleid="out"]');
  const target = graph.locator('[data-nodeid="ship"][data-handleid="in"]');
  await dragTo(page, source, target);
  await page.waitForTimeout(100);
  assert.equal(await graph.locator('.react-flow__edge').count(), edgeCount + 1, 'a valid connection adds an edge');
  await dragTo(page, source, target);
  await page.waitForTimeout(100);
  assert.equal(await graph.locator('.react-flow__edge').count(), edgeCount + 1, 'connection validation rejects a duplicate edge');

  const controls = page.getByRole('group', { name: '属性', exact: true });
  await controls.getByRole('switch', { name: '只读模式' }).click();
  const readOnlyBefore = await brief.getAttribute('style');
  await dragBy(page, brief, { x: 90, y: 40 });
  const readOnlyAfter = await brief.getAttribute('style');
  assert.equal(readOnlyAfter, readOnlyBefore, 'read-only mode preserves the node position while the viewport may pan');
  assert.equal(await source.getAttribute('class').then(value => value.includes('connectionindicator')), false, 'read-only mode disables connection handles');

  const lightEdgeImage = await edgeCanvas.evaluate(node => node.toDataURL());
  await page.screenshot({ path: `${outputDir}/node-graph-desktop-light.png`, fullPage: true });
  await page.getByRole('radio', { name: '深色主题' }).last().click();
  await page.waitForFunction(() => document.documentElement.dataset.inkraTheme === 'dark');
  await page.waitForFunction(previous => {
    const canvas = document.querySelector('.component-playground .inkra-node-graph .react-flow__edge .inkra-node-graph__edge-canvas');
    return canvas instanceof HTMLCanvasElement && canvas.toDataURL() !== previous;
  }, lightEdgeImage);
  const darkEdgeImage = await edgeCanvas.evaluate(node => node.toDataURL());
  assert.notEqual(darkEdgeImage, lightEdgeImage, 'theme switch repaints edge pigment');
  await page.screenshot({ path: `${outputDir}/node-graph-desktop-dark.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(error.message));
  const mobileGraph = await openGraph(mobile);
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile page has no horizontal overflow');
  const mobileSource = mobileGraph.locator('[data-nodeid="brief"][data-handleid="out"]');
  const mobileTarget = mobileGraph.locator('[data-nodeid="ship"][data-handleid="in"]');
  const sourceBox = await mobileSource.boundingBox();
  assert(sourceBox.width >= 44 && sourceBox.height >= 44, JSON.stringify(sourceBox));
  const mobileEdges = await mobileGraph.locator('.react-flow__edge').count();
  await mobileSource.tap();
  await mobileTarget.tap();
  await mobile.waitForTimeout(100);
  assert.equal(await mobileGraph.locator('.react-flow__edge').count(), mobileEdges + 1, 'touch tap-to-connect adds an edge');
  await mobile.screenshot({ path: `${outputDir}/node-graph-mobile.png`, fullPage: true });
  assert.deepEqual(mobileErrors, []);
  await mobile.close();

  const cleanLight = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const cleanLightGraph = await openGraph(cleanLight);
  await cleanLightGraph.locator('.inkra-node-graph__control').last().click();
  await cleanLight.waitForTimeout(220);
  await cleanLight.screenshot({ path: `${outputDir}/node-graph-desktop-light.png`, fullPage: true });
  await cleanLight.close();

  const cleanDark = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const cleanDarkGraph = await openGraph(cleanDark);
  await cleanDarkGraph.locator('.inkra-node-graph__control').last().click();
  await cleanDark.waitForTimeout(220);
  await cleanDark.getByRole('radio', { name: '深色主题' }).last().click();
  await cleanDark.waitForFunction(() => document.documentElement.dataset.inkraTheme === 'dark');
  await cleanDark.screenshot({ path: `${outputDir}/node-graph-desktop-dark.png`, fullPage: true });
  await cleanDark.close();

  const cleanMobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const cleanMobileGraph = await openGraph(cleanMobile);
  await cleanMobileGraph.locator('.inkra-node-graph__control').last().tap();
  await cleanMobile.waitForTimeout(220);
  await cleanMobile.screenshot({ path: `${outputDir}/node-graph-mobile.png`, fullPage: true });
  await cleanMobile.close();

  console.log('PASS NodeGraph drag, pan, zoom, fitView, connect, validation, read-only, keyboard, themes, touch and pencil canvas visuals');
} finally {
  await browser.close();
}
