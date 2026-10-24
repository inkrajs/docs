import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('inkra-docs-locale', 'zh-CN');
    localStorage.setItem('inkra-docs-theme', 'light');
  });
  await page.goto(`${baseUrl}/docs/components/layout#preview`);
  const preview = page.locator('.component-playground .preview-stage');
  const canvas = preview.locator('.layout-viewport__canvas');
  const frame = page.frameLocator('.layout-viewport__canvas');
  const notebook = frame.locator('.layout-notebook');
  await notebook.waitFor();

  const initialStyles = await frame.locator('head [data-preview-style]').evaluateAll(nodes => nodes.map((node, index) => {
    node.dataset.previewProbe = String(index);
    return node.dataset.previewProbe;
  }));
  assert(initialStyles.length > 0);
  assert.equal(await notebook.locator('.layout-notebook__paper, .layout-notebook__wash, .layout-notebook__accent').count(), 0);

  const heights = [];
  for (const width of [390, 768, 1024, 390, 1024]) {
    await preview.getByRole('radio', { name: String(width), exact: true }).check();
    await page.waitForFunction(({ width, direction }) => {
      const iframe = document.querySelector('.layout-viewport__canvas');
      const body = iframe?.contentDocument?.querySelector('.layout-notebook > .inkra-layout__body');
      return iframe?.dataset.previewWidth === String(width)
        && iframe.offsetWidth === width
        && body
        && getComputedStyle(body).flexDirection === direction;
    }, { width, direction: width === 390 ? 'column' : 'row' });
    await page.waitForFunction(() => new Promise(resolve => {
      const iframe = document.querySelector('.layout-viewport__canvas');
      if (!iframe) return resolve(false);
      const first = iframe.offsetHeight;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(first === iframe.offsetHeight)));
    }));
    const height = await canvas.evaluate(node => node.offsetHeight);
    assert(Number.isFinite(height) && height > 400 && height < 1200);
    heights.push(height);
  }
  assert(Math.max(...heights) - Math.min(...heights) < 400);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.inkraTheme = 'dark';
    document.documentElement.style.setProperty('--inkra-wash-strength', '.61');
    document.documentElement.style.overflow = 'hidden';
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('.layout-viewport__canvas')?.contentDocument?.documentElement;
    const styles = root?.ownerDocument.head.querySelectorAll('[data-preview-style]');
    return root?.dataset.theme === 'dark'
      && root.dataset.inkraTheme === 'dark'
      && root.style.getPropertyValue('--inkra-wash-strength') === '.61'
      && root.style.overflow !== 'hidden'
      && styles
      && [...styles].every(node => node.hasAttribute('data-preview-probe'));
  });
  assert.deepEqual(
    await frame.locator('head [data-preview-style]').evaluateAll(nodes => nodes.map(node => node.dataset.previewProbe)),
    initialStyles,
  );
  assert.equal(await frame.locator('html').evaluate(node => node.style.getPropertyValue('--inkra-wash-strength')), '.61');
  assert.notEqual(await frame.locator('html').evaluate(node => node.style.overflow), 'hidden');
  await page.waitForFunction(() => new Promise(resolve => {
    const iframe = document.querySelector('.layout-viewport__canvas');
    if (!iframe) return resolve(false);
    const first = iframe.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(first === iframe.offsetHeight)));
  }));
  assert.deepEqual(errors, []);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.inkraTheme = 'light';
    document.documentElement.style.removeProperty('--inkra-wash-strength');
    document.documentElement.style.removeProperty('overflow');
  });
  await page.waitForFunction(() => {
    const root = document.querySelector('.layout-viewport__canvas')?.contentDocument?.documentElement;
    return root?.dataset.theme === 'light'
      && root.dataset.inkraTheme === 'light'
      && !root.style.getPropertyValue('--inkra-wash-strength');
  });

  const darkPage = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  await darkPage.addInitScript(() => {
    localStorage.setItem('inkra-docs-locale', 'zh-CN');
    localStorage.setItem('inkra-docs-theme', 'dark');
  });
  await darkPage.goto(`${baseUrl}/docs/components/layout#preview`);
  await darkPage.waitForFunction(() => {
    const root = document.documentElement;
    const frameDocument = document.querySelector('.layout-viewport__canvas')?.contentDocument;
    const frameRoot = frameDocument?.documentElement;
    const notebook = frameDocument?.querySelector('.layout-notebook');
    return root.dataset.theme === 'dark' && root.dataset.inkraTheme === 'dark'
      && frameRoot?.dataset.theme === 'dark' && frameRoot.dataset.inkraTheme === 'dark'
      && notebook;
  });
  const darkFrame = darkPage.frameLocator('.layout-viewport__canvas');
  await darkFrame.locator('.layout-notebook').waitFor();
  await darkPage.waitForFunction(async () => {
    const frameDocument = document.querySelector('.layout-viewport__canvas')?.contentDocument;
    if (!frameDocument) return false;
    await frameDocument.fonts.ready;
    const FrameCanvas = frameDocument.defaultView?.HTMLCanvasElement;
    if (!FrameCanvas) return false;
    const text = [...frameDocument.querySelectorAll('.layout-notebook .inkra-pencil-text')];
    const drawings = [...frameDocument.querySelectorAll('.layout-notebook .inkra-pencil-icon, .layout-notebook .inkra-pencil-line')];
    return text.some(node => node.getAttribute('data-pencil-ready') === 'true')
      && drawings.length > 0
      && drawings.every(node => {
        const canvas = node;
        return canvas instanceof FrameCanvas
          && canvas.width > 0 && canvas.height > 0
          && getComputedStyle(canvas).color !== 'rgb(41, 61, 51)';
      });
  });
  assert.equal(await darkFrame.locator('.layout-notebook').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(25, 29, 30)');
  assert.notEqual(await darkFrame.locator('.layout-notebook h3').first().evaluate(node => getComputedStyle(node).color), 'rgb(41, 61, 51)');
  await darkPage.screenshot({ path: '/tmp/inkra-layout-perf-after.png', animations: 'disabled' });
  await darkPage.close();

  await page.goto(`${baseUrl}/docs/components/scroll-area#preview`);
  await page.evaluate(async () => {
    const { React: R, ReactDOM, ReactDOMClient, ScrollArea } = await import('/scripts/fixtures/layout-scroll.mjs');
    const host = document.createElement('div');
    host.id = 'layout-scroll-fixture';
    host.style.cssText = 'width:320px;height:220px;';
    document.querySelector('#root').style.display = 'none';
    document.body.prepend(host);
    const h = R.createElement;
    const cells = Array.from({ length: 36 }, (_, index) => h('div', { key: index }, `Cell ${index + 1}`));
    ReactDOM.flushSync(() => ReactDOMClient.createRoot(host).render(
      h(ScrollArea, {
        className: 'layout-scroll-test', dir: 'rtl', type: 'always', viewportLabel: 'Scrollable results', viewportProps: { tabIndex: 0 },
        style: { height: '100%', width: '100%' },
      }, h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(6, 120px)', minHeight: '720px' } }, cells)),
    ));
  });
  const root = page.locator('.layout-scroll-test');
  const viewport = root.locator('.inkra-scroll-area__viewport');
  const vertical = root.locator('.inkra-scroll-area__scrollbar[data-orientation="vertical"]');
  const horizontal = root.locator('.inkra-scroll-area__scrollbar[data-orientation="horizontal"]');
  assert.equal(await viewport.getAttribute('aria-label'), 'Scrollable results');
  await vertical.waitFor();
  await horizontal.waitFor();
  const verticalHandle = await vertical.elementHandle();
  const horizontalHandle = await horizontal.elementHandle();
  assert(verticalHandle && horizontalHandle);
  await page.waitForFunction(node => node.hasAttribute('data-has-overflow-y') && node.querySelector('.inkra-scroll-area__thumb'), verticalHandle);
  await page.waitForFunction(node => node.hasAttribute('data-has-overflow-x') && node.querySelector('.inkra-scroll-area__thumb'), horizontalHandle);
  await page.waitForFunction(node => {
    const canvas = node.querySelector('.inkra-scroll-area__thumb-surface .inkra-pencil-surface__ink');
    return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
  }, verticalHandle);
  assert.equal(await vertical.locator('.inkra-scroll-area__track .inkra-pencil-surface__ink').count(), 1);
  assert.equal(await vertical.locator('.inkra-scroll-area__thumb-surface .inkra-pencil-surface__ink').count(), 1);
  await page.waitForFunction(node => getComputedStyle(node).width === '14px', verticalHandle);
  await viewport.focus();
  await page.keyboard.press('End');
  await page.waitForFunction(node => node.scrollTop > 0, await viewport.elementHandle());
  await page.keyboard.press('Home');
  await page.waitForFunction(node => node.scrollTop === 0, await viewport.elementHandle());
  const horizontalThumb = horizontal.locator('.inkra-scroll-area__thumb');
  const horizontalThumbHandle = await horizontalThumb.elementHandle();
  assert(horizontalThumbHandle);
  const initialThumbX = await horizontalThumb.evaluate(node => node.getBoundingClientRect().x);
  await viewport.evaluate(node => { node.scrollLeft = -120; node.dispatchEvent(new Event('scroll')); });
  await page.waitForFunction(node => node.scrollLeft < 0, await viewport.elementHandle());
  await page.waitForFunction(({ node, initialX }) => node.getBoundingClientRect().x < initialX - 1,
    { node: horizontalThumbHandle, initialX: initialThumbX });
  const thumb = vertical.locator('.inkra-scroll-area__thumb');
  const box = await thumb.boundingBox();
  assert(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 90, { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction(node => node.scrollTop > 0, await viewport.elementHandle());

  const forced = await browser.newPage({ viewport: { width: 390, height: 844 }, forcedColors: 'active' });
  await forced.goto(`${baseUrl}/docs/components/scroll-area#preview`);
  const forcedRoot = forced.locator('.component-playground .inkra-scroll-area').first();
  await forcedRoot.waitFor();
  const forcedScrollbar = forcedRoot.locator('.inkra-scroll-area__scrollbar').first();
  const forcedTrack = forcedRoot.locator('.inkra-scroll-area__track').first();
  await forced.waitForFunction(node => getComputedStyle(node).opacity === '1', await forcedScrollbar.elementHandle());
  await forced.waitForFunction(node => getComputedStyle(node).borderTopStyle !== 'none', await forcedTrack.elementHandle());
  await forced.close();
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS bounded Layout resize/theme mirroring and ScrollArea keyboard/drag/RTL/reduced-motion/forced-colors');
} finally {
  await browser.close();
}
