import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, slowFont] of [[1305, false], [390, false], [1305, true]]) {
    const context = await browser.newContext({ viewport: { width, height: 954 } });
    await context.addInitScript(() => {
      window.textFrames = [];
      const sample = () => {
        const nodes = [...document.querySelectorAll('.inkra-pencil-text')].filter(node => {
          const box = node.getBoundingClientRect();
          for (let parent = node.parentElement; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            const clip = parent.getBoundingClientRect();
            if (style.overflowY !== 'visible' && (box.top >= clip.bottom || box.bottom <= clip.top)) return false;
            if (style.overflowX !== 'visible' && (box.left >= clip.right || box.right <= clip.left)) return false;
          }
          return node.textContent.trim() && box.width > 1 && box.height > 1
            && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth
            && node.checkVisibility({ visibilityProperty: true });
        });
        if (nodes.length && window.textFrames.length < 180) {
          // The docs deliberately show readable DOM text during font warm-up.
          // Once pencil rendering is enabled, ink must exist on its first frame.
          const pencil = nodes.filter(node => getComputedStyle(node).getPropertyValue('--inkra-letter-effect').trim() !== '0');
          const plain = nodes.filter(node => !pencil.includes(node));
          const unreadablePlain = plain.filter(node => {
            const source = node.querySelector('.inkra-pencil-text__source');
            if (!source) return true;
            const style = getComputedStyle(source);
            return style.visibility === 'hidden' || Number(style.opacity) === 0
              || style.color === 'transparent' || style.color === 'rgba(0, 0, 0, 0)';
          });
          window.textFrames.push({ time: performance.now(), total: nodes.length, pencil: pencil.length,
            unreadablePlain: unreadablePlain.map(node => node.textContent),
            missing: pencil.filter(node => node.dataset.pencilReady !== 'true').map(node => node.textContent) });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const page = await context.newPage();
    let releaseFont;
    if (slowFont) {
      const gate = new Promise(resolve => { releaseFont = resolve; });
      await page.route('**/*.woff2', async route => { await gate; await route.continue(); });
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/icon#preview`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.textFrames.length > 0);
    releaseFont?.();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.textFrames.length >= 30 && window.textFrames.some(frame => frame.pencil > 0));
    const frames = await page.evaluate(() => window.textFrames);
    assert.deepEqual(frames[0].missing, [], `first frame at ${width}px: ${JSON.stringify(frames[0])}`);
    assert(frames.every(frame => frame.unreadablePlain.length === 0), 'font warm-up must keep DOM text readable');
    assert(frames.some(frame => frame.pencil > 0), 'pencil rendering must be enabled after font warm-up');
    assert(frames.every(frame => frame.missing.length === 0), `enabled pencil text must paint without a blank frame: ${JSON.stringify(frames.filter(frame => frame.missing.length))}`);
    const config = page.locator('.playground-config-toggle');
    if (await config.getAttribute('aria-expanded') === 'false') {
      await page.evaluate(() => { window.textFrames = []; });
      await config.click();
      await page.waitForFunction(() => window.textFrames.length >= 30);
      const reveal = await page.evaluate(() => window.textFrames);
      assert(reveal.every(frame => frame.unreadablePlain.length === 0), 'revealed plain text remains readable');
      assert(reveal.every(frame => frame.missing.length === 0), `revealed controls must paint on their first visible frame: ${JSON.stringify(reveal.filter(frame => frame.missing.length))}`);
      await config.click();
    }
    await page.screenshot({ path: `/tmp/inkra-text-first-paint-${width}.png` });
    if (width > 768) await page.locator('.brand').click();
    else {
      await page.getByRole('button', { name: '打开文档目录', exact: true }).click();
      await page.locator('.drawer-brand').click();
    }
    await page.locator('#home-title[data-pencil-ready="true"]').waitFor();
    assert.deepEqual(errors, []);
    console.log(`${width}px${slowFont ? ' delayed font' : ''} first visible frame: ${frames[0].total} labels readable during warm-up; enabled pencil labels ready.`);
    await context.close();
  }

  const page = await browser.newPage();
  await page.goto(`${base}/docs/getting-started`);
  await page.evaluate(() => document.fonts.ready);
  const reuse = await page.evaluate(async () => {
    const { React, ReactDOM, ReactDOMClient, PencilText } = await import('/scripts/fixtures/text-rendering.mjs');
    const host = document.createElement('div');
    Object.assign(host.style, { position: 'fixed', top: '100px', left: '30px', zIndex: '9999', width: '600px' });
    document.body.append(host);
    const root = ReactDOMClient.createRoot(host);
    let glyphDraws = 0;
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (...args) {
      glyphDraws++;
      return fillText.apply(this, args);
    };
    const render = async (text, style = {}) => {
      glyphDraws = 0;
      ReactDOM.flushSync(() => root.render(React.createElement(PencilText, { seed: 'glyph-reuse-test', style }, text)));
      await Promise.resolve();
      const node = host.firstElementChild;
      const canvas = node.querySelector('canvas');
      return { draws: glyphDraws, ready: node.dataset.pencilReady,
        ink: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0) };
    };
    const first = await render('abcabc');
    const extended = await render('abcabcabc');
    const added = await render('abcabcabcd');
    const recolored = await render('abcabcabcd', { color: 'rgb(180, 20, 40)' });
    const changed = await render('abcabcabcd', { '--inkra-letter-grain': '0.9' });
    host.style.top = '3000px';
    ReactDOM.flushSync(() => root.render(React.createElement(PencilText, { key: 'offscreen' }, 'Offscreen text')));
    const offscreen = host.firstElementChild.dataset.pencilReady;
    host.style.top = '100px';
    for (let attempt = 0; attempt < 30 && host.firstElementChild.dataset.pencilReady !== 'true'; attempt++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const revealed = host.firstElementChild.dataset.pencilReady;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    ReactDOM.flushSync(() => root.render(React.createElement(PencilText, { key: 'failure' }, 'Readable fallback')));
    const fallback = { ready: host.firstElementChild.dataset.pencilReady,
      color: getComputedStyle(host.querySelector('.inkra-pencil-text__source')).color };
    HTMLCanvasElement.prototype.getContext = getContext;
    CanvasRenderingContext2D.prototype.fillText = fillText;
    root.unmount();
    host.remove();
    return { first, extended, added, recolored, changed, offscreen, revealed, fallback };
  });
  assert(reuse.first.draws > 0);
  assert.equal(reuse.extended.draws, 0, 'existing letters compose a new line without regenerating glyphs');
  assert.equal(reuse.added.draws, 1, 'only the new letter is generated');
  for (const result of [reuse.first, reuse.extended, reuse.added, reuse.recolored, reuse.changed]) {
    assert.equal(result.ready, 'true');
    assert(result.ink);
  }
  assert(reuse.recolored.draws > 0 && reuse.changed.draws > 0, 'color and material changes invalidate glyph sprites');
  assert.equal(reuse.fallback.ready, undefined);
  assert.equal(reuse.offscreen, undefined, 'distant content is not synchronously painted');
  assert.equal(reuse.revealed, 'true', 'revealed content becomes painted');
  assert.notEqual(reuse.fallback.color, 'rgba(0, 0, 0, 0)');
  console.log('Incremental Latin glyphs, parameter invalidation and readable canvas-failure fallback passed.');
} finally {
  await browser.close();
}
