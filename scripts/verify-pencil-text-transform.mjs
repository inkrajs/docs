import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_PENCIL_TEXT_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);

function canvasMetric(elements, text) {
    const element = elements.find(node => node.querySelector('.inkra-pencil-text__source')?.textContent === text);
    if (!element) return null;
    const canvas = element.querySelector('canvas');
    const source = element.querySelector('.inkra-pencil-text__source');
    const style = getComputedStyle(element);
    const canvasStyle = getComputedStyle(canvas);
    const px = value => Number.parseFloat(value) || 0;
    const localWidth = px(style.width) + (style.boxSizing === 'border-box' ? 0
      : px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth));
    const localHeight = px(style.height) + (style.boxSizing === 'border-box' ? 0
      : px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth));
    const rect = element.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    return {
      canvasCssHeight: px(canvasStyle.height),
      canvasCssWidth: px(canvasStyle.width),
      canvasScreenHeight: canvasRect.height,
      canvasScreenWidth: canvasRect.width,
      dataUrl: canvas.toDataURL(),
      domText: element.textContent,
      localHeight,
      localWidth,
      bitmapHeight: canvas.height,
      bitmapWidth: canvas.width,
      lines: Number(canvas.dataset.lines),
      screenHeight: rect.height,
      screenWidth: rect.width,
      sourceText: source.textContent,
    };
}

async function metric(root, text) {
  return root.locator('.pan-zoom-examples__board .inkra-pencil-text').evaluateAll(canvasMetric, text);
}

async function nativeLocalLineCount(root, text) {
  return root.locator('.pan-zoom-examples__board .inkra-pencil-text').evaluateAll((elements, wanted) => {
    const element = elements.find(node => node.querySelector('.inkra-pencil-text__source')?.textContent === wanted);
    if (!element) return null;
    const liveSource = element.querySelector('.inkra-pencil-text__source');
    const hostStyle = getComputedStyle(element);
    const sourceStyle = getComputedStyle(liveSource);
    const px = value => Number.parseFloat(value) || 0;
    const width = px(hostStyle.width) + (hostStyle.boxSizing === 'border-box' ? 0
      : px(hostStyle.paddingLeft) + px(hostStyle.paddingRight) + px(hostStyle.borderLeftWidth) + px(hostStyle.borderRightWidth));
    const height = px(hostStyle.height) + (hostStyle.boxSizing === 'border-box' ? 0
      : px(hostStyle.paddingTop) + px(hostStyle.paddingBottom) + px(hostStyle.borderTopWidth) + px(hostStyle.borderBottomWidth));
    const probe = document.createElement(element.tagName.toLowerCase());
    const source = document.createElement('span');
    for (const property of hostStyle) probe.style.setProperty(property, hostStyle.getPropertyValue(property), hostStyle.getPropertyPriority(property));
    for (const property of sourceStyle) source.style.setProperty(property, sourceStyle.getPropertyValue(property), sourceStyle.getPropertyPriority(property));
    probe.setAttribute('aria-hidden', 'true');
    probe.inert = true;
    Object.assign(probe.style, {
      boxSizing: 'border-box', contain: 'layout style paint', height: `${height}px`, left: '-100000px', margin: '0',
      maxHeight: `${height}px`, maxWidth: `${width}px`, minHeight: `${height}px`, minWidth: `${width}px`,
      overflow: 'visible', pointerEvents: 'none', position: 'fixed', rotate: 'none', scale: 'none', top: '0',
      transform: 'none', translate: 'none', visibility: 'hidden', width: `${width}px`,
    });
    source.textContent = wanted;
    probe.append(source);
    document.body.append(probe);
    try {
      const range = document.createRange();
      const tops = [];
      let offset = 0;
      for (const character of wanted) {
        range.setStart(source.firstChild, offset);
        offset += character.length;
        range.setEnd(source.firstChild, offset);
        const top = range.getBoundingClientRect().top;
        if (!tops.some(value => Math.abs(value - top) <= 1)) tops.push(top);
      }
      return tops.length;
    } finally {
      probe.remove();
    }
  }, text);
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
  await page.goto(`${base}/docs/components/pan-zoom#preview`);
  const root = page.locator('.component-playground .inkra-pan-zoom').first();
  await root.locator('.pan-zoom-examples__board').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  const controls = page.getByRole('group', { name: '属性', exact: true });
  await controls.getByRole('tab', { name: '布局', exact: true }).click();
  await controls.getByRole('button', { name: '适配', exact: true }).click();
  await page.waitForTimeout(300);

  const transform = await root.locator('.react-transform-component').evaluate(node => getComputedStyle(node).transform);
  const fittedScale = Number(transform.match(/^matrix\(([-\d.e]+)/)?.[1] ?? 1);
  assert(fittedScale < 1, `expected a fitted transform below 1, got ${fittedScale}`);

  const title = await metric(root, '秋日工作台');
  assert(title);
  assert.equal(title.domText, title.sourceText);
  assert(Math.abs(title.canvasCssWidth - (title.localWidth + 10)) < 0.2, JSON.stringify(title));
  assert(Math.abs(title.canvasCssHeight - (title.localHeight + 10)) < 0.2, JSON.stringify(title));
  assert(Math.abs(title.canvasScreenWidth - title.canvasCssWidth * fittedScale) < 0.5, JSON.stringify(title));

  const rotatedText = '把相近的想法放在一起';
  const rotated = await metric(root, rotatedText);
  const rotatedNativeLines = await nativeLocalLineCount(root, rotatedText);
  assert.equal(rotated.lines, rotatedNativeLines, 'rotated card uses transform-free native line layout');
  assert.equal(rotatedNativeLines, 1, 'the full-width rotated example is locally one line');

  const wrappedText = '照片、便签与参考材料';
  const wrappedLocator = root.locator('.pan-zoom-examples__board .inkra-pencil-text').filter({ hasText: wrappedText }).first();
  await wrappedLocator.evaluate(node => {
    node.style.inlineSize = '60px';
    node.style.maxInlineSize = '60px';
  });
  await page.waitForFunction(text => {
    const elements = [...document.querySelectorAll('.component-playground .pan-zoom-examples__board .inkra-pencil-text')];
    const element = elements.find(node => node.querySelector('.inkra-pencil-text__source')?.textContent === text);
    return Number(element?.querySelector('canvas')?.dataset.lines) > 1;
  }, wrappedText);
  const wrapped = await metric(root, wrappedText);
  const wrappedNativeLines = await nativeLocalLineCount(root, wrappedText);
  assert(wrappedNativeLines > 1, 'narrow local fixture wraps onto multiple native lines');
  assert.equal(wrapped.lines, wrappedNativeLines, 'transformed PencilText follows the narrow transform-free native wrap');

  const normal = await page.locator('.page-heading .inkra-pencil-text').first().evaluate(element => {
    const canvas = element.querySelector('canvas');
    const style = getComputedStyle(element);
    const canvasStyle = getComputedStyle(canvas);
    const px = value => Number.parseFloat(value) || 0;
    return { localWidth: px(style.width), canvasWidth: px(canvasStyle.width), screenWidth: element.getBoundingClientRect().width };
  });
  assert(Math.abs(normal.canvasWidth - (normal.localWidth + 10)) < 0.2, JSON.stringify(normal));
  assert(Math.abs(normal.screenWidth - normal.localWidth) < 0.2, JSON.stringify(normal));

  const observed = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('.component-playground .pan-zoom-examples__board .inkra-pencil-text canvas')];
    window.__inkraPencilTextCanvasMutations = 0;
    window.__inkraPencilTextObserver = new MutationObserver(entries => {
      window.__inkraPencilTextCanvasMutations += entries.filter(entry => entry.attributeName === 'width' || entry.attributeName === 'height').length;
    });
    canvases.forEach(canvas => window.__inkraPencilTextObserver.observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] }));
    return canvases.length;
  });
  assert(observed > 0);
  const beforeZoom = await metric(root, '秋日工作台');
  await controls.getByRole('button', { name: '放大', exact: true }).click();
  await page.waitForTimeout(300);
  const afterZoom = await metric(root, '秋日工作台');
  assert.equal(afterZoom.dataUrl, beforeZoom.dataUrl, 'zoom preserves painted title bytes');
  assert.equal(afterZoom.bitmapWidth, beforeZoom.bitmapWidth, 'zoom preserves title bitmap width');
  assert.equal(afterZoom.bitmapHeight, beforeZoom.bitmapHeight, 'zoom preserves title bitmap height');
  assert.equal(await page.evaluate(() => window.__inkraPencilTextCanvasMutations), 0, 'pure viewport zoom does not repaint PencilText canvases');
  await page.evaluate(() => window.__inkraPencilTextObserver?.disconnect());

  const titleLocator = root.locator('.pan-zoom-examples__board-heading .inkra-pencil-text').first();
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await titleLocator.locator('canvas').evaluate(node => getComputedStyle(node).display), 'none', 'forced colors hides PencilText canvas');
  assert.notEqual(await titleLocator.locator('.inkra-pencil-text__source').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)', 'forced colors restores source text');
  await page.emulateMedia({ forcedColors: 'none', media: 'print' });
  assert.equal(await titleLocator.locator('canvas').evaluate(node => getComputedStyle(node).display), 'none', 'print hides PencilText canvas');
  assert.notEqual(await titleLocator.locator('.inkra-pencil-text__source').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)', 'print restores source text');
  await page.emulateMedia({ media: 'screen' });

  await controls.getByRole('button', { name: '适配', exact: true }).click();
  await page.waitForTimeout(240);
  await root.locator('.react-transform-wrapper').screenshot({ path: `${outputDir}/pencil-text-fit.png`, animations: 'disabled' });
  console.log(`PASS PencilText local canvas geometry, native wrap/rotation comparison, normal-scale rendering and transform-stable paint (${fittedScale.toFixed(3)}x fit)`);
} finally {
  await browser.close();
}
