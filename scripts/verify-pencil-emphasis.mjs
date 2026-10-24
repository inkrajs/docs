import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 954 }, reducedMotion: 'reduce' });
  await page.goto(`${base}/docs/components/markdown#preview`);
  await page.evaluate(async () => {
    const { React: R, ReactDOM, ReactDOMClient, PencilText } = await import('/scripts/fixtures/markdown.mjs');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('main');
    host.id = 'emphasis-fixture';
    host.style.padding = '20px';
    document.body.prepend(host);
    const root = ReactDOMClient.createRoot(host);
    ReactDOM.flushSync(() => root.render(R.createElement('div', {},
      ...['normal', 'bold', 'italic', 'both', 'dynamic'].map(kind => R.createElement('p', {
        key: kind, id: `style-${kind}`,
        style: { margin: '16px 0', fontSize: '20px', fontWeight: ['bold', 'both'].includes(kind) ? 700 : 400, fontStyle: ['italic', 'both'].includes(kind) ? 'italic' : 'normal' },
      }, R.createElement(PencilText, { seed: 'same-glyphs' }, 'Sample text'))))));
    await document.fonts.ready;
  });
  const hash = kind => page.locator(`#style-${kind} canvas`).evaluate(node => {
    const data = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    let value = 2166136261;
    for (const byte of data) value = Math.imul(value ^ byte, 16777619);
    return `${node.width}:${node.height}:${value >>> 0}`;
  });
  const samples = {};
  for (const kind of ['normal', 'bold', 'italic', 'both', 'dynamic']) {
    await page.locator(`#style-${kind} [data-pencil-ready="true"]`).waitFor();
    samples[kind] = await hash(kind);
  }
  assert.equal(new Set(Object.values(samples).slice(0, 4)).size, 4, 'regular, bold, italic and combined actually paint differently');
  assert.equal(samples.normal, samples.dynamic, 'identical styles reuse consistent glyphs');
  await page.locator('#style-dynamic').evaluate(node => { node.style.fontWeight = '700'; node.style.fontStyle = 'italic'; });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#style-dynamic .inkra-pencil-text')).fontWeight === '700');
  await page.locator('#style-dynamic [data-pencil-ready="true"]').waitFor();
  assert.equal(await hash('dynamic'), samples.both, 'style change invalidates cached paint');
  await page.locator('#style-dynamic').evaluate(node => { node.style.fontWeight = '400'; node.style.fontStyle = 'normal'; });
  await page.locator('#style-dynamic [data-pencil-ready="true"]').waitFor();
  assert.equal(await hash('dynamic'), samples.normal, 'restoring style does not reuse styled glyphs');
  await page.screenshot({ path: '/tmp/inkra-pencil-emphasis.png' });
  console.log('PASS actual regular/bold/italic/combined pixels, inherited-style updates and glyph-cache separation');
} finally { await browser.close(); }
