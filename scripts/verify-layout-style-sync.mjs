import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('crash', () => errors.push('Page crashed'));

async function expectValue(value) {
  await page.waitForFunction(expected => {
    const doc = document.querySelector('.layout-viewport__canvas')?.contentDocument;
    return doc && doc.defaultView.getComputedStyle(doc.documentElement)
      .getPropertyValue('--layout-sync-probe').trim() === expected;
  }, value);
}

try {
  await page.goto(`${base}/docs/components/layout#preview`);
  await page.frameLocator('.layout-viewport__canvas').locator('.layout-notebook').waitFor();
  await page.evaluate(() => {
    const doc = document.querySelector('.layout-viewport__canvas').contentDocument;
    window.originalPreviewStyles = [...doc.querySelectorAll('[data-preview-style]')];
    for (const [id, value] of [['a', 'first'], ['b', 'second']]) {
      const style = document.createElement('style');
      style.id = `layout-sync-${id}`;
      style.textContent = `:root { --layout-sync-probe: ${value}; }`;
      document.head.append(style);
    }
  });
  await expectValue('second');
  await page.evaluate(() => {
    const doc = document.querySelector('.layout-viewport__canvas').contentDocument;
    window.originalProbeStyle = doc.getElementById('layout-sync-a');
    document.head.append(document.getElementById('layout-sync-a'));
  });
  await expectValue('first');
  assert(await page.evaluate(() => {
    const doc = document.querySelector('.layout-viewport__canvas').contentDocument;
    return window.originalProbeStyle === doc.getElementById('layout-sync-a')
      && window.originalPreviewStyles.every(node => node.isConnected && node.ownerDocument === doc);
  }), 'reordering preserves the existing style nodes');

  await page.evaluate(() => {
    document.getElementById('layout-sync-a').textContent = ':root { --layout-sync-probe: edited; }';
  });
  await expectValue('edited');
  await page.evaluate(() => document.getElementById('layout-sync-a').remove());
  await expectValue('second');

  await page.evaluate(() => {
    const link = document.createElement('link');
    link.id = 'layout-sync-link';
    link.rel = 'stylesheet';
    link.href = 'data:text/css,:root%20%7B%20--layout-sync-probe:%20linked;%20%7D';
    document.head.append(link);
  });
  await expectValue('linked');
  await page.evaluate(() => { document.getElementById('layout-sync-link').rel = 'alternate'; });
  await expectValue('second');
  assert.equal(await page.frameLocator('.layout-viewport__canvas').locator('#layout-sync-link').count(), 0);
  await page.evaluate(() => { document.getElementById('layout-sync-link').rel = 'stylesheet'; });
  await expectValue('linked');
  await page.evaluate(() => document.getElementById('layout-sync-link').remove());
  await expectValue('second');

  await page.evaluate(() => {
    const group = document.createElement('div');
    group.id = 'layout-sync-subtree';
    const style = document.createElement('style');
    style.textContent = ':root { --layout-sync-probe: nested; }';
    group.append(style);
    document.head.append(group);
  });
  await expectValue('nested');
  await page.evaluate(() => document.getElementById('layout-sync-subtree').remove());
  await expectValue('second');
  await page.evaluate(() => document.getElementById('layout-sync-b').remove());
  await expectValue('');

  await page.waitForTimeout(300);
  const readRevision = () => page.frameLocator('.layout-viewport__canvas').locator('html')
    .evaluate(node => node.style.getPropertyValue('--inkra-preview-resource-revision'));
  const revision = await readRevision();
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-unrelated-probe', 'true');
    document.querySelector('title').textContent += ' ';
  });
  await page.waitForTimeout(300);
  assert.equal(await readRevision(), revision, 'unrelated changes and idle time do not invalidate preview resources');
  assert(await page.evaluate(() => {
    const doc = document.querySelector('.layout-viewport__canvas').contentDocument;
    return doc.querySelectorAll('[data-preview-style]').length === window.originalPreviewStyles.length;
  }), 'temporary stylesheet mirrors are removed');
  assert.deepEqual(errors, []);
  console.log('PASS Layout stylesheet cascade/order, retained nodes, rel transitions, subtree cleanup and idle stability');
} finally {
  await browser.close();
}
