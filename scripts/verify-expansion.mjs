import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const names = ['toast', 'alert-dialog', 'drawer', 'date-picker', 'time-picker', 'pagination', 'empty', 'toggle-group', 'command', 'upload', 'data-table', 'tree', 'steps', 'timeline'];
const directory = new URL('../.local/expansion/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const results = [];
try {
  for (const width of [1305, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'en');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const name of names) {
      await page.goto(`${base}/docs/components/${name}#preview`);
      const playground = page.locator('.component-playground').first();
      await playground.waitFor();
      assert.ok((await page.locator('.page-heading > p').textContent()).trim().length > 15, `${name}: introduction`);
      assert.ok(await page.locator('.component-example').count(), `${name}: simple example`);
      assert.ok(await page.locator('.component-example').first().evaluate(element => {
        const playground = document.querySelector('.component-playground');
        return Boolean(playground && element.compareDocumentPosition(playground) & Node.DOCUMENT_POSITION_PRECEDING);
      }), `${name}: playground precedes supporting examples`);
      const properties = playground.locator('.property-tabs');
      assert.ok(await properties.getByRole('tab').count(), `${name}: property tabs`);
      const bounds = await playground.evaluate(element => {
        const display = element.querySelector('.preview-display').getBoundingClientRect();
        const controls = element.querySelector('.preview-controls').getBoundingClientRect();
        return { display: { x: display.x, y: display.y, width: display.width }, controls: { x: controls.x, y: controls.y, width: controls.width } };
      });
      if (width > 1024) assert.ok(Math.abs(bounds.display.width - bounds.controls.width) <= 2, `${name}: equal panels`);
      else assert.ok(bounds.controls.y > bounds.display.y, `${name}: stacked panels`);
      for (const tab of await properties.getByRole('tab').all()) {
        await tab.click();
        assert.ok(await properties.locator('[role="tabpanel"]:visible').count(), `${name}: visible property panel`);
        assert.ok(await tab.locator('canvas').count(), `${name}: category icon`);
      }
      await playground.getByRole('tab', { name: 'Code', exact: true }).click();
      assert.ok((await playground.locator('code').textContent()).trim().length > 20, `${name}: sample code`);
      await playground.getByRole('tab', { name: 'Preview', exact: true }).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: page overflow at ${width}`);
      assert.equal(await page.locator('button button, a a').count(), 0, `${name}: nested interactive elements`);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width !== 320) await page.screenshot({ path: new URL(`${name}-${width}.png`, directory).pathname });
      await page.locator('.page-tabs').getByRole('tab', { name: 'API', exact: true }).click();
      assert.ok(await page.locator('.component-api tbody tr').count() >= 2, `${name}: API coverage`);
      await page.locator('.page-tabs').getByRole('tab', { name: 'Accessibility', exact: true }).click();
      assert.ok((await page.locator('.component-api p').textContent()).trim().length > 30, `${name}: accessibility guidance`);
      results.push({ component: name, width, result: 'passed' });
      console.log(`PASS ${name} ${width}px: docs, property tabs, code, layout, API and accessibility`);
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(new URL('summary.json', directory), JSON.stringify({ base, results, errors }, null, 2));
  await browser.close();
}
