import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
import { chromium } from 'playwright';

const source = await readFile(new URL('../src/componentRoutes.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { foundationComponents, componentNavigationGroups } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const components = ['button', ...foundationComponents];
const categorized = componentNavigationGroups.flatMap(group => group.components);
assert.equal(new Set(categorized).size, components.length);
assert.deepEqual([...categorized].sort(), [...components].sort());
const base = process.env.INKRA_DOCS_URL || process.env.BASE_URL || 'http://127.0.0.1:4180';
const directory = new URL('../.local/navigation/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function assertAlignment(nav) {
  assert(await nav.locator('.nav-group + .nav-group').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).marginTop === '0px')), 'navigation groups do not add gaps');
  const positions = await nav.locator('.nav-group-label:visible, .nav-link:visible').evaluateAll(nodes => nodes.map(node => {
    const group = node.closest('.nav-group');
    const parent = node.classList.contains('nav-link') ? group : group.parentElement.closest('.nav-group');
    const parentTrigger = parent?.querySelector('.nav-group-label');
    return {
      label: node.textContent,
      icon: node.querySelector('.docs-pencil-icon').getBoundingClientRect().x,
      parentText: parentTrigger?.querySelector('.inkra-pencil-text').getBoundingClientRect().x,
    };
  }));
  for (const position of positions) {
    if (position.parentText !== undefined) assert.ok(Math.abs(position.icon - position.parentText) < 1, `${position.label}: child icon aligns with parent text`);
  }
  assert.ok(await nav.locator('.side-navigation__groups').evaluate(node => {
    node.scrollLeft = 100;
    return node.scrollWidth <= node.clientWidth && node.scrollLeft === 0;
  }), 'navigation has no horizontal scroll');
}

try {
  for (const [width, locale] of [[1305, 'zh-CN'], [390, 'zh-CN'], [320, 'zh-CN'], [1305, 'en']]) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await context.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/data-table#preview`);
    await page.locator('.component-playground').waitFor();
    if (width < 769) await page.getByRole('button', { name: /打开文档目录|Open documentation navigation/ }).click();
    const nav = page.locator(width < 769 ? '.drawer-layer .side-navigation' : '.desktop-sidebar .side-navigation');
    const top = nav.getByRole('button', { name: /^(组件|Components)$/ });
    const category = nav.getByRole('button', { name: /^(数据展示|Data display)$/ });
    assert.equal(await top.getAttribute('aria-expanded'), 'true');
    assert.equal(await category.getAttribute('aria-expanded'), 'true');
    assert.equal(await nav.locator('a[aria-current="page"]').innerText(), 'DataTable');
    await assertAlignment(nav);
    await top.press('Enter');
    assert.equal(await top.getAttribute('aria-expanded'), 'false');
    await top.press('Enter');
    assert.equal(await category.getAttribute('aria-expanded'), 'true');
    await category.press('Space');
    assert.equal(await category.getAttribute('aria-expanded'), 'false');
    const search = nav.locator('input[type="search"]');
    await search.fill('DropdownMenu');
    assert.equal(await nav.locator('.nav-link:visible').count(), 1);
    await assertAlignment(nav);
    await page.screenshot({ path: new URL(`sidebar-${locale}-${width}.png`, directory).pathname });
    await search.press('Escape');
    assert.equal(await category.getAttribute('aria-expanded'), 'false', 'clearing search restores expansion');
    await search.fill(locale === 'en' ? 'Data display' : '数据展示');
    const dataComponents = componentNavigationGroups.find(group => group.label === '数据展示').components;
    assert.deepEqual(await nav.locator('.nav-link:visible').evaluateAll(nodes => nodes.map(node => node.getAttribute('href').split('/').at(-1))), dataComponents);
    await search.fill('/components/');
    assert.equal(await nav.locator('.nav-link:visible').count(), components.length);
    assert.deepEqual(await nav.locator('.nav-link:visible').evaluateAll(nodes => nodes.map(node => node.getAttribute('href').split('/').at(-1))), categorized);
    await assertAlignment(nav);
    await search.fill('no-such-component-xyz');
    assert.equal(await nav.locator('.nav-link').count(), 0);
    assert.ok(await nav.getByRole('status').isVisible());
    await search.fill('Progress');
    await search.press('Enter');
    await page.waitForURL('**/docs/components/progress#preview');
    if (width < 769) await page.getByRole('button', { name: /打开文档目录|Open documentation navigation/ }).click();
    assert.equal(await nav.locator('a[aria-current="page"]').innerText(), 'Progress');
    await assertAlignment(nav);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
    console.log(`PASS navigation hierarchy, alignment, search, collapse and overflow: ${locale} ${width}px`);
  }

  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/docs/getting-started`);
  const routeSearch = page.locator('.desktop-sidebar input[type="search"]');
  for (const component of components) {
    // Exercise real client navigation without repainting the entire shell 80 times.
    await routeSearch.fill(`/components/${component}`);
    await page.locator(`.desktop-sidebar .nav-link[href="/docs/components/${component}"]`).click();
    await page.locator(`#${component}-panel-preview`).waitFor();
    const primarySelector = component === 'markdown'
      ? '.markdown-examples > .component-example:first-child'
      : '.component-playground, .playground';
    const primary = page.locator(primarySelector).first();
    await primary.waitFor().catch(error => {
      throw new Error(`${component}: main playground did not appear; page errors: ${errors.join('; ')}`, { cause: error });
    });
    if (component === 'markdown') await primary.locator('.inkra-markdown').waitFor();
    assert.ok(await primary.evaluate(playground => {
      return [...document.querySelectorAll('.component-example')].every(example => playground.contains(example) || Boolean(playground.compareDocumentPosition(example) & Node.DOCUMENT_POSITION_FOLLOWING));
    }), `${component}: main playground precedes supporting examples`);
  }
  console.log(`PASS main playground first on all ${components.length} component pages`);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
