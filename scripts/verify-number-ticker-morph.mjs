import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const glyphSelector = '.inkra-number-ticker__morph [data-token-id]';
const fixturePath = './fixtures/NumberTickerMorphFixture.tsx';

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/docs/components/number-ticker#preview');
    await page.locator('.page-heading h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async fixturePath => {
      document.getElementById('root').hidden = true;
      const container = document.createElement('main');
      document.body.append(container);
      const { mount } = await import(new URL(fixturePath, new URL('/scripts/', location.href)).href);
      window.numberTickerMorphFixture = mount(container);
      window.scrollTo(0, 0);
    }, fixturePath);
    const ticker = page.getByTestId('morph-number');
    const set = props => page.evaluate(props => window.numberTickerMorphFixture.update(props), props);
    const settled = async expected => {
      await page.waitForFunction(expected => {
        const ticker = document.querySelector('[data-testid="morph-number"]');
        return ticker && !ticker.hasAttribute('data-animating')
          && ticker.querySelector('.inkra-number-ticker__value').textContent === expected;
      }, expected);
      assert.equal(await ticker.locator('[aria-live]').textContent(), expected);
    };
    const reset = async (value, props = {}) => {
      await set({ value, duration: 0, ...props });
      await page.waitForFunction(() => !document.querySelector('[data-testid="morph-number"]').hasAttribute('data-animating'));
    };
    const moving = async () => {
      await page.waitForFunction(() => document.querySelector('[data-testid="morph-number"]')?.hasAttribute('data-animating'));
      await page.waitForTimeout(110);
    };
    const capture = async () => ticker.evaluate((root, selector) => {
      const viewport = root.querySelector('.inkra-number-ticker__morph');
      const clip = viewport?.getBoundingClientRect();
      return {
        clip: clip && { left: clip.left, right: clip.right, width: clip.width },
        overflow: viewport && getComputedStyle(viewport).overflowX,
        glyphs: [...root.querySelectorAll(selector)].map(node => {
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          const transform = new DOMMatrixReadOnly(style.transform);
          return { id: node.dataset.tokenId, text: node.textContent, face: node.dataset.face,
            x: box.x, y: box.y, width: box.width, opacity: Number(style.opacity),
            dx: transform.m41, dy: transform.m42, scaleX: transform.a, scaleY: transform.d,
            clipPath: style.clipPath, visibility: style.visibility };
        }),
      };
    }, glyphSelector);
    const keep = (state, text) => state.glyphs.find(glyph => glyph.text === text && glyph.opacity > .999);
    const hasVerticalMotion = state => state.glyphs.some(glyph => Math.abs(glyph.dy) > .1);

    await settled('10');
    await set({ value: 1000, duration: 1200 });
    await moving();
    const first = await capture();
    assert.equal(first.overflow, 'hidden', 'one shared viewport clips incoming glyphs at its right edge');
    assert(first.glyphs.some(glyph => glyph.x >= first.clip.right && glyph.opacity < 1), 'new zeroes start outside the right edge');
    assert(first.glyphs.some(glyph => glyph.opacity > 0 && glyph.opacity < 1), 'fade starts while retained digits are moving');
    const original = keep(first, '1');
    assert(original, 'the original 1 remains fully opaque');
    assert.equal(original.dy, 0, 'a decimal shift has no vertical rolling');
    assert.equal(await ticker.locator('[aria-live]').textContent(), '10', 'intermediate frames are not announced');
    await page.waitForTimeout(110);
    const second = await capture();
    const continued = second.glyphs.find(glyph => glyph.id === original.id);
    assert(continued && continued.x < original.x, 'the same original glyph moves left');
    assert.equal(continued.opacity, 1);
    assert(Math.abs(continued.width - original.width) < .1, 'retained digits keep their natural width');
    for (const glyph of second.glyphs) {
      assert.equal(glyph.scaleX, 1, 'glyphs are not horizontally scaled');
      assert.equal(glyph.scaleY, 1);
      assert.equal(glyph.clipPath, 'none', 'individual digits are not squeezed through a changing clip');
    }
    await ticker.screenshot({ path: `/tmp/inkra-number-ticker-morph-expansion-${width}.png`, animations: 'allow' });
    await settled('1000');
    await ticker.locator('[data-pencil-ready="true"]').first().waitFor();
    assert(await ticker.locator('canvas').evaluateAll(canvases => canvases.some(canvas => canvas.width > 0 && canvas.height > 0
      && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0))), 'morph values retain real pencil-rendered pixels');

    for (const [from, to, direction] of [[12.34, 123.4, 1], [123.4, 12.34, -1]]) {
      await reset(from);
      await set({ value: to, duration: 1000 });
      await moving();
      const before = await capture();
      const dot = keep(before, '.');
      assert(dot, 'the existing decimal point is preserved');
      await page.waitForTimeout(110);
      const after = await capture();
      const nextDot = after.glyphs.find(glyph => glyph.id === dot.id);
      assert(nextDot, 'decimal point identity survives the move');
      assert((nextDot.x - dot.x) * direction > .1, 'the point slides in the appropriate horizontal direction');
      assert(Math.abs(nextDot.y - dot.y) < .1 && nextDot.dy === 0, 'the decimal point stays on its baseline');
      assert.equal(nextDot.opacity, 1);
      await settled(String(to));
    }

    for (const [from, to, expected, dotRole] of [[1.2, 120, '120', 'exit'], [12, .12, '0.12', 'enter']]) {
      await reset(from);
      await set({ value: to, duration: 1000 });
      await moving();
      const state = await capture();
      const dot = state.glyphs.find(glyph => glyph.text === '.');
      assert(dot && dot.opacity > 0 && dot.opacity < 1, 'an appearing/departing decimal point fades concurrently');
      assert.equal(dot.dy, 0, dotRole + ' point does not roll vertically');
      await settled(expected);
    }

    // Synchronous fixture updates expose the first committed retarget frame,
    // so this compares actual glyph positions without an elapsed animation tick.
    await reset(1);
    await set({ value: 100, duration: 1200 });
    await moving();
    const continuity = await page.evaluate(selector => {
      const read = () => {
        const clip = document.querySelector('[data-testid="morph-number"] .inkra-number-ticker__morph').getBoundingClientRect();
        return [...document.querySelectorAll('[data-testid="morph-number"] ' + selector)].map(node => {
        const box = node.getBoundingClientRect();
        return { id: node.dataset.tokenId, x: box.x, y: box.y, right: box.right, opacity: Number(getComputedStyle(node).opacity) };
        }).filter(glyph => glyph.opacity > .01 && glyph.right > clip.left && glyph.x < clip.right);
      };
      const before = read();
      window.numberTickerMorphFixture.update({ value: 12, duration: 1200 });
      return { before, after: read() };
    }, glyphSelector);
    for (const glyph of continuity.before) {
      const next = continuity.after.find(item => item.id === glyph.id);
      assert(next, 'retarget keeps each currently visible glyph identity');
      assert(Math.abs(next.x - glyph.x) < .5 && Math.abs(next.y - glyph.y) < .5, 'retarget starts at the current x/y');
      assert(Math.abs(next.opacity - glyph.opacity) < .01, 'retarget starts at the current opacity');
    }
    await settled('12');

    for (const [from, to, options] of [[999, 1000, {}], [1, 101, {}], [0, 12, {}],
      [1.249, 124.9, { maximumFractionDigits: 2, useGrouping: false }]]) {
      await reset(from, { formatOptions: options });
      await set({ value: to, duration: 1000, formatOptions: options });
      await moving();
      assert(hasVerticalMotion(await capture()), 'ordinary changes, carries and rounded mismatches retain place-aligned rolling');
      await settled(new Intl.NumberFormat('en-US', options).format(to));
    }

    for (const locale of ['zh-CN', 'en-US', 'ja', 'ko', 'fr', 'ar-EG']) {
      const formatOptions = { style: 'currency', currency: 'EUR', maximumFractionDigits: 4 };
      await reset(-12.34, { locale, formatOptions, dir: locale === 'ar-EG' ? 'rtl' : 'ltr' });
      await set({ value: -123.4, locale, formatOptions, dir: locale === 'ar-EG' ? 'rtl' : 'ltr' });
      await settled(new Intl.NumberFormat(locale, formatOptions).format(-123.4));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'localized/RTL content fits the page');
    }

    await reset('9007199254740993');
    await set({ value: '900719925474099300' });
    await settled('900719925474099300');
    await reset('10');
    await set({ value: '1' + '0'.repeat(30), duration: 1000 });
    await moving();
    const long = await capture();
    assert.equal(long.overflow, 'hidden');
    const frame = await page.getByTestId('morph-number-frame').boundingBox();
    assert(long.clip.width > 0, 'the bounded viewport remains visible');
    assert(long.clip.width <= frame.width + 1, 'many appended zeros do not expand the clipping viewport beyond its frame');
    assert(Math.abs(long.clip.right - frame.x - frame.width) < 1, 'the same fixed right edge anchors the long animation');
    assert(long.glyphs.length <= 256, 'glyph work remains bounded');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'incoming long content causes no page overflow');
    await ticker.screenshot({ path: `/tmp/inkra-number-ticker-morph-long-${width}.png`, animations: 'allow' });
    await settled('1' + '0'.repeat(30));

    await set({ value: '1e200' });
    await settled('1' + '0'.repeat(200));
    assert.equal(await ticker.getAttribute('data-animating'), null, 'oversized displays settle without constructing a motion graph');
    assert.equal(await ticker.locator(glyphSelector).count(), 0);
    await reset(10);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await set({ value: 1000 });
    await settled('1000');
    assert.equal(await ticker.getAttribute('data-animating'), null);
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await set({ value: 10 });
    await settled('10');
    await ticker.screenshot({ path: `/tmp/inkra-number-ticker-morph-forced-${width}.png` });

    await page.evaluate(() => window.numberTickerMorphFixture.update({ value: 1000, animation: 'morph', renderValue: () => 'custom number' }));
    assert.equal(await ticker.locator('.inkra-number-ticker__value').textContent(), 'custom number');
    assert.equal(await ticker.locator(glyphSelector).count(), 0, 'custom rendering takes precedence');
    await page.evaluate(() => window.numberTickerMorphFixture.unmount());
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS morph shifts/decimal/fade/clipping/retarget/fallback/exact/locales/reduced motion: ${width}px`);
  }
} finally {
  await browser.close();
}
