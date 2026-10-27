import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

// The default mode verifies the installed consumer package. --source runs an
// isolated library-source fixture before packing; it never aliases the docs app.
const docs = fileURLToPath(new URL('../', import.meta.url));
const library = resolve(docs, '../..');
const source = process.argv.includes('--source');
const fixtureId = resolve(docs, 'scripts/__slider-endpoints-fixture__.js');
const imports = source
  ? `import { Slider } from ${JSON.stringify(`/@fs${library}/packages/inkra/src/slider/index.tsx`)};
     import { RangeSlider } from ${JSON.stringify(`/@fs${library}/packages/inkra/src/range-slider/index.tsx`)};
     import ${JSON.stringify(`/@fs${library}/packages/inkra/src/styles.css`)};
     import ${JSON.stringify(`/@fs${library}/packages/inkra/src/slider/styles.css`)};`
  : `import { Slider, RangeSlider } from '@inkra/react'; import '@inkra/react/styles.css';`;
const fixture = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
${imports}
const cases = [];
for (const alignment of ['edge', 'contain']) for (const orientation of ['horizontal', 'vertical'])
for (const dir of ['ltr', 'rtl']) for (const inverted of [false, true]) for (const range of [false, true]) {
  cases.push({ alignment, orientation, dir, inverted, range });
}
window.sliderEndpointCases = cases;
window.sliderEndpointCommits = {};
createRoot(document.getElementById('root')).render(h('main', {style:{display:'grid',gap:40,padding:40}},
  cases.map((item, index) => h('form', {key:index, 'data-case':index, style:{padding:24}},
    h(item.range ? RangeSlider : Slider, {
      name:'level', min:-20, max:80, step:5,
      defaultValue:item.range ? [5,55] : [30],
      ...(item.alignment === 'contain' ? {thumbAlignment:'contain'} : {}),
      orientation:item.orientation, dir:item.dir, inverted:item.inverted,
      variant:index % 2 ? 'inset' : 'standard',
      ...(item.range ? {minDistance:10,thumbLabels:['Low','High']} : {'aria-label':'Level'}),
      style:item.orientation === 'horizontal' ? {width:240} : {height:160},
      onValueCommit:value => { window.sliderEndpointCommits[index] = value; },
    }), h('button',{type:'reset',style:{display:'block',marginTop:32}},'Reset')))));
`;
const server = await createServer({
  configFile: false, root: docs, logLevel: 'error',
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '127.0.0.1', port: 0, fs: { allow: [library] } },
  plugins: [{ name: 'slider-endpoint-fixture',
    resolveId(id) { if (id === '/slider-endpoints-fixture.js') return fixtureId; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(dev) { dev.middlewares.use((req, res, next) => {
      if (req.url !== '/') return next();
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/slider-endpoints-fixture.js"></script></body></html>');
    }); },
  }],
});
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 650, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
  await page.locator('[data-case="31"] [role="slider"]').first().waitFor();
  const cases = await page.evaluate(() => window.sliderEndpointCases);
  const waitValue = async (thumb, expected) => {
    await page.waitForFunction(({ element, expected }) => Number(element.getAttribute('aria-valuenow')) === expected,
      { element: await thumb.elementHandle(), expected });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const geometry = form => form.evaluate(node => ({
    track: node.querySelector('.inkra-slider__track').getBoundingClientRect().toJSON(),
    thumbs: [...node.querySelectorAll('[role="slider"]')].map(thumb => ({
      hit: thumb.getBoundingClientRect().toJSON(),
      visual: thumb.querySelector('.inkra-slider__thumb-surface').getBoundingClientRect().toJSON(),
      value: Number(thumb.getAttribute('aria-valuenow')),
    })),
  }));
  function assertPosition(state, item, index) {
    const vertical = item.orientation === 'vertical';
    const reversed = vertical ? !item.inverted : (item.dir === 'rtl') !== item.inverted;
    for (const thumb of state.thumbs) {
      const fraction = (thumb.value + 20) / 100;
      const physical = reversed ? 1 - fraction : fraction;
      const trackStart = vertical ? state.track.y : state.track.x;
      const trackSize = vertical ? state.track.height : state.track.width;
      const hitSize = vertical ? thumb.hit.height : thumb.hit.width;
      const center = vertical ? thumb.visual.y + thumb.visual.height / 2 : thumb.visual.x + thumb.visual.width / 2;
      const expected = trackStart + physical * trackSize + (item.alignment === 'contain' ? (0.5 - physical) * hitSize : 0);
      assert(Math.abs(center - expected) < 0.6, `case ${index}: visual center ${center}, expected ${expected}`);
      assert(thumb.hit.width >= 44 && thumb.hit.height >= 44, `case ${index}: hit target remains at least 44px`);
    }
  }
  for (const [index, item] of cases.entries()) {
    const form = page.locator(`[data-case="${index}"]`);
    await form.scrollIntoViewIfNeeded();
    const thumbs = form.getByRole('slider');
    const low = thumbs.first(); const high = thumbs.last();
    assert.equal(await form.locator('.inkra-slider').getAttribute('data-thumb-alignment'), item.alignment);
    await low.focus(); await page.keyboard.press('Home'); await waitValue(low, -20);
    assertPosition(await geometry(form), item, index);
    await high.focus(); await page.keyboard.press('End'); await waitValue(high, 80);
    assertPosition(await geometry(form), item, index);
    await form.getByRole('button', { name: 'Reset' }).click();
    await waitValue(low, item.range ? 5 : 30);
    for (const [thumb, expected] of [[low, -20], [high, 80]]) {
      await form.scrollIntoViewIfNeeded();
      const state = await geometry(form);
      const hit = await thumb.boundingBox();
      const vertical = item.orientation === 'vertical';
      const reversed = vertical ? !item.inverted : (item.dir === 'rtl') !== item.inverted;
      const physical = reversed ? 1 - (expected + 20) / 100 : (expected + 20) / 100;
      const x = vertical ? state.track.x + state.track.width / 2 : state.track.x + physical * state.track.width;
      const y = vertical ? state.track.y + physical * state.track.height : state.track.y + state.track.height / 2;
      await page.mouse.move(hit.x + hit.width / 2, hit.y + hit.height / 2);
      await page.mouse.down(); await page.mouse.move(x, y, { steps: 8 }); await page.mouse.up();
      await waitValue(thumb, expected);
      assertPosition(await geometry(form), item, index);
    }
    assert.deepEqual(await form.evaluate(node => new FormData(node).getAll(node.querySelectorAll('[role="slider"]').length > 1 ? 'level[]' : 'level')),
      item.range ? ['-20', '80'] : ['80']);
    assert.deepEqual(await page.evaluate(index => window.sliderEndpointCommits[index], index), item.range ? [-20, 80] : [80]);
    await form.getByRole('button', { name: 'Reset' }).click();
    await waitValue(low, item.range ? 5 : 30);
    assertPosition(await geometry(form), item, index);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${source ? 'source' : 'installed package'}: 32 Slider/RangeSlider endpoint cases, edge/contain, RTL/inverted, horizontal/vertical, 44px targets, pointer/keyboard and forms.`);
} finally {
  await browser.close(); await server.close();
}
