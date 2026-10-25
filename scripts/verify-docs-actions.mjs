import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.copied = '';
    window.opened = [];
    window.failCopy = false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      if (window.failCopy) throw new Error('Denied');
      window.copied = text;
    } } });
    window.open = (...args) => { window.opened.push(args); return null; };
  });
  await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/docs/components/input#preview');
  const coverage = await page.evaluate(async () => {
    const { foundationNames } = await import('/src/components/FoundationPages.tsx');
    const { componentIntroductions } = await import('/src/components/componentIntroductions.ts');
    const { feedbackDocs } = await import('/src/components/expansion/FeedbackExamples.tsx');
    const { overlaysDocs } = await import('/src/components/expansion/OverlaysExamples.tsx');
    const { datesDocs } = await import('/src/components/expansion/DatesExamples.tsx');
    const { navigationDocs } = await import('/src/components/expansion/NavigationExamples.tsx');
    const { dataDocs } = await import('/src/components/expansion/DataExamples.tsx');
    const { flowsDocs } = await import('/src/components/expansion/FlowsExamples.tsx');
    const { layoutDocs } = await import('/src/components/expansion/LayoutExamples.tsx');
    const { inventoryGridDoc } = await import('/src/components/expansion/InventoryGridExamples.tsx');
    const introductions = { ...componentIntroductions };
    introductions[inventoryGridDoc.name] = inventoryGridDoc.intro;
    for (const doc of Object.values({ ...feedbackDocs, ...overlaysDocs, ...datesDocs, ...navigationDocs, ...dataDocs, ...flowsDocs, ...layoutDocs })) {
      introductions[doc.name] = doc.intro;
    }
    return ['Button', ...Object.values(foundationNames)].map(name => ({ name, ...introductions[name] }));
  });
  assert.equal(new Set(coverage.map(component => component.name)).size, coverage.length);
  for (const name of ['Button', 'Breadcrumb', 'Stack', 'Flex', 'Grid', 'Container', 'Layout', 'InventoryGrid']) {
    assert(coverage.some(component => component.name === name), `Introduction coverage includes ${name}`);
  }
  for (const intro of coverage) assert(intro.zh && intro.en, `Bilingual introduction: ${intro.name}`);
  await page.locator('.page-heading > p').waitFor();
  await page.locator('.preview-stage:visible input').first().fill('PRIVATE-DEMO-SENTINEL');
  await page.getByRole('button', { name: '复制页面', exact: true }).click();
  await page.waitForFunction(() => window.copied.includes('# Input'));
  const copied = await page.evaluate(() => window.copied);
  assert.match(copied, /```tsx/);
  assert(!copied.includes('PRIVATE-DEMO-SENTINEL'), 'Export uses initial samples, not live input values');
  assert(!copied.includes('搜索目录'));

  for (const [name, origin, path] of [['v0', 'https://v0.dev', '/'], ['ChatGPT', 'https://chatgpt.com', '/'], ['Claude', 'https://claude.ai', '/new'], ['Scira', 'https://scira.ai', '/']]) {
    await page.getByRole('button', { name: '更多页面操作', exact: true }).click();
    await page.getByRole('menuitem', { name: `在 ${name} 中打开（新标签页打开）`, exact: true }).click();
    const [url, target, features] = await page.evaluate(() => window.opened.at(-1));
    const parsed = new URL(url);
    assert.equal(parsed.origin, origin);
    assert.equal(parsed.pathname, path);
    assert.match(parsed.searchParams.get('q'), /Inkra.*Input/);
    assert(!url.includes('127.0.0.1') && !url.includes('PRIVATE-DEMO-SENTINEL'));
    assert.equal(target, '_blank');
    assert.equal(features, 'noopener,noreferrer');
    await page.waitForFunction(() => window.copied.includes('# Input'));
  }
  await page.getByRole('button', { name: '更多页面操作', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: '下载 Markdown', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'Input.md');
  await page.evaluate(() => { window.failCopy = true; });
  await page.getByRole('button', { name: '复制页面', exact: true }).click();
  const fallback = page.getByRole('dialog', { name: 'Input · Markdown', exact: true });
  await fallback.waitFor();
  assert.match(await fallback.locator('pre').textContent(), /# Input/);
  console.log(`PASS all ${coverage.length} bilingual descriptions; Markdown, download, clipboard fallback and four assistant destinations (intercepted, no external data sent)`);
} finally { await browser.close(); }
