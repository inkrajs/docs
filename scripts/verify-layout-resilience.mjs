import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function navigate(page, path) {
  await page.evaluate(next => {
    history.pushState(null, '', next);
    dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function releaseRoutes(pending, action) {
  const routes = pending.splice(0);
  await Promise.all(routes.map(async ({ route, resolve }) => {
    try { await action(route); } finally { resolve(); }
  }));
}

try {
  {
    const context = await browser.newContext({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    const pendingStyles = [];
    let releaseNewStyles = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/button#preview`);
    await page.route('**/__layout-resilience-hang.css', route => {
      if (releaseNewStyles) return route.fulfill({ contentType: 'text/css', body: 'html{--layout-resilience-recovered:1}' });
      return new Promise(resolve => pendingStyles.push({ route, resolve }));
    });
    await page.evaluate(() => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/__layout-resilience-hang.css';
      link.dataset.layoutResilience = 'hang';
      document.head.append(link);
    });
    await navigate(page, '/docs/components/layout#preview');
    const frameElement = page.locator('.layout-viewport__canvas');
    const frame = page.frameLocator('.layout-viewport__canvas');
    await frame.locator('.layout-notebook').waitFor();
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas')?.dataset.previewReadiness?.startsWith('timed-out/'));
    assert(await frame.getByText('笔记空间', { exact: true }).isVisible(), 'timeout mounts readable fallback content');
    assert(pendingStyles.length >= 2, 'source and mirrored stylesheets are both pending');
    releaseNewStyles = true;
    await releaseRoutes(pendingStyles, route => route.fulfill({ contentType: 'text/css', body: 'html{--layout-resilience-recovered:1}' }));
    await page.waitForFunction(() => {
      const doc = document.querySelector('.layout-viewport__canvas')?.contentDocument;
      return doc && getComputedStyle(doc.documentElement).getPropertyValue('--layout-resilience-recovered').trim() === '1'
        && doc.documentElement.style.getPropertyValue('--inkra-preview-resource-revision');
    });
    assert((await frameElement.getAttribute('data-preview-readiness')).startsWith('timed-out/'), 'late recovery does not rewrite timeout as initial success');
    await page.evaluate(() => document.querySelector('link[data-layout-resilience="hang"]')?.remove());
    await page.unroute('**/__layout-resilience-hang.css');
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
    const pendingFonts = [];
    let releaseNewFonts = false;
    await context.route('**/*.woff2', route => {
      if (releaseNewFonts) return route.continue();
      return new Promise(resolve => pendingFonts.push({ route, resolve }));
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-theme', 'dark');
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
    });
    await page.goto(`${base}/docs/components/layout#preview`, { waitUntil: 'domcontentloaded' });
    const frameElement = page.locator('.layout-viewport__canvas');
    const frame = page.frameLocator('.layout-viewport__canvas');
    await frame.locator('.layout-notebook').waitFor();
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas')?.dataset.previewReadiness?.includes('/timed-out/'));
    assert(await frame.getByText('笔记空间', { exact: true }).isVisible(), 'font timeout retains readable DOM fallback');
    const timedOutReadiness = await frameElement.getAttribute('data-preview-readiness');
    releaseNewFonts = true;
    await releaseRoutes(pendingFonts, route => route.continue());
    await frame.locator('html').evaluate(async node => { await node.ownerDocument.fonts.ready; });
    await page.waitForFunction(() => {
      const doc = document.querySelector('.layout-viewport__canvas')?.contentDocument;
      return [...(doc?.querySelectorAll('.layout-notebook .inkra-pencil-text') ?? [])]
        .some(node => node.getAttribute('data-pencil-ready') === 'true');
    });
    assert.equal(await frameElement.getAttribute('data-preview-readiness'), timedOutReadiness, 'font timeout is not relabeled as initial success');
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/button#preview`);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await navigate(page, '/docs/components/layout#preview');
      await page.locator('.layout-viewport__canvas').waitFor();
      await navigate(page, '/docs/components/button#preview');
      await page.waitForFunction(() => !document.querySelector('.layout-viewport__canvas'));
    }
    await navigate(page, '/docs/components/layout#preview');
    const frameElement = page.locator('.layout-viewport__canvas');
    const frame = page.frameLocator('.layout-viewport__canvas');
    await frame.locator('.layout-notebook').waitFor();
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas')?.dataset.previewReadiness);
    const sourceStyleCount = await page.locator('head style, head link[rel="stylesheet"]').count();
    assert.equal(await frame.locator('head [data-preview-style]').count(), sourceStyleCount, 'rapid remount does not duplicate mirrored styles');
    for (const size of [390, 768, 1024, 390, 1024]) {
      await page.getByRole('radio', { name: String(size), exact: true }).check();
      await page.waitForFunction(value => {
        const iframe = document.querySelector('.layout-viewport__canvas');
        return iframe?.offsetWidth === value && iframe.dataset.previewWidth === String(value);
      }, size);
      assert(await frame.getByText('笔记空间', { exact: true }).isVisible());
    }
    assert(await frameElement.getAttribute('data-preview-readiness'));
    assert.deepEqual(errors, []);
    await context.close();
  }

  console.log('PASS Layout bounded stylesheet/font fallback, late recovery, rapid remount cleanup and repeated size switching');
} finally {
  await browser.close();
}
