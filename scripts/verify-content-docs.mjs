import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function configure(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
}

async function capture(page, locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/inkra-round9-${name}.png`, animations: 'disabled' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

try {
  for (const [width, locale, theme] of [[1305, 'zh-CN', 'light'], [390, 'en', 'dark']]) {
    const zh = locale === 'zh-CN';
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });

    await page.goto(`${base}/docs/components/data-table#preview`);
    const tableStage = page.getByTestId('data-table-playground');
    await tableStage.locator('tbody tr').first().waitFor();
    await configure(page.locator('.component-playground'), false);
    assert.equal(await tableStage.locator('tbody tr').count(), 3);
    await tableStage.getByRole('checkbox').nth(1).check();
    assert(await tableStage.getByRole('checkbox').nth(1).isChecked());
    await tableStage.getByRole('button', { name: zh ? '下一页' : 'Next page', exact: true }).click();
    await page.waitForFunction(node => node.querySelectorAll('tbody tr').length === 2, await tableStage.elementHandle());
    await tableStage.getByRole('button', { name: zh ? '上一页' : 'Previous page', exact: true }).click();
    await page.waitForFunction(node => node.querySelectorAll('tbody tr').length === 3, await tableStage.elementHandle());
    assert(await tableStage.getByRole('checkbox').nth(1).isChecked(), 'selection survives pagination');
    const sort = tableStage.locator('.inkra-data-table__sort').first();
    await sort.click();
    assert.equal(await sort.locator('xpath=..').getAttribute('aria-sort'), 'ascending');
    await sort.click();
    assert.equal(await sort.locator('xpath=..').getAttribute('aria-sort'), 'descending');
    if (zh) assert.doesNotMatch(await sort.textContent(), /name|sorted/);
    const filter = tableStage.getByRole('searchbox');
    await filter.fill(zh ? '设计' : 'Design');
    await page.waitForFunction(node => node.querySelectorAll('tbody tr').length === 1, await tableStage.elementHandle());
    assert.match(await tableStage.locator('tbody').textContent(), /设计清单|Design checklist/);
    await filter.fill('');
    await capture(page, tableStage, `table-${width}`);
    console.log(`PASS live table sorting/filter/selection/pagination and locale: ${width} ${locale}`);

    await page.goto(`${base}/docs/components/log#preview`);
    const log = page.getByTestId('log-playground');
    await log.waitFor();
    const playground = page.locator('.component-playground');
    await configure(playground, false);
    const initialHeight = (await log.boundingBox()).height;
    const append = page.locator('.log-examples__stack > button');
    await append.click();
    await append.click();
    await page.waitForFunction(node => node.querySelectorAll('.inkra-log__item').length === 6, await log.elementHandle());
    assert((await log.boundingBox()).height > initialHeight + 30, 'natural log grows with appended content');
    assert(await log.locator('.inkra-log__viewport').evaluate(node => node.scrollHeight <= node.clientHeight + 1), 'natural log does not clip records');
    await configure(playground, true);
    await playground.getByRole('switch', { name: zh ? '限制滚动高度' : 'Bound scroll height', exact: true }).check();
    await configure(playground, false);
    assert(Math.abs((await log.boundingBox()).height - 352) < 1, 'explicit bounded log retains its viewport');
    assert(await log.locator('.inkra-log__viewport').evaluate(node => node.scrollHeight > node.clientHeight));
    await log.getByRole('button', { name: zh ? '暂停跟随' : 'Pause follow', exact: true }).click();
    assert.equal(await log.getAttribute('data-paused'), 'true');
    const logGeometry = await log.evaluate(node => {
      const root = node.getBoundingClientRect();
      return {
        width: root.width,
        scrollLeft: node.scrollLeft,
        children: [...node.querySelectorAll('.inkra-log__toolbar, .inkra-log__viewport-frame, .inkra-log__viewport, .inkra-log__latest')]
          .map(child => ({ className: child.className, width: child.getBoundingClientRect().width })),
      };
    });
    assert.equal(logGeometry.scrollLeft, 0);
    assert(logGeometry.children.every(child => child.width <= logGeometry.width + 1), JSON.stringify(logGeometry));
    await capture(page, log, `log-${width}`);
    await configure(playground, true);
    await playground.getByRole('tab', { name: zh ? '交互' : 'Interaction', exact: true }).click();
    await playground.getByRole('button', { name: zh ? '清空记录' : 'Clear records', exact: true }).click();
    await configure(playground, false);
    assert.equal(await log.locator('.inkra-log__item').count(), 0);
    assert.match(await log.textContent(), /暂无记录|No records/);
    await append.click();
    assert.equal(await log.locator('.inkra-log__item').count(), 1);
    assert.match(await log.locator('.inkra-log__content').textContent(), /7/);
    console.log(`PASS natural/bounded log, append, pause and clear: ${width} ${locale}`);

    await page.goto(`${base}/docs/components/pagination#preview`);
    const basic = page.getByTestId('pagination-basic');
    await basic.waitFor();
    assert((await basic.boundingBox()).width >= 200, 'natural-width basic pagination does not collapse in its flex preview');
    const changing = page.getByTestId('pagination-changing-total');
    const paging = changing.locator('.inkra-pagination').first();
    await paging.waitFor();
    assert.equal(await paging.locator('[aria-current="page"]').textContent(), '9');
    const select = changing.getByRole('combobox', { name: zh ? '结果页数' : 'Result pages', exact: true });
    for (const [total, current] of [['3', '3'], ['12', '3'], ['0', null], ['12', '1']]) {
      await select.click();
      await page.getByRole('option', { name: total, exact: true }).click();
      if (current === null) {
        assert.equal(await paging.locator('[aria-current="page"]').count(), 0);
        assert(await paging.getByRole('button').evaluateAll(nodes => nodes.every(node => node.disabled)));
      } else {
        await page.waitForFunction(({ node, current }) => node.querySelector('[aria-current="page"]')?.textContent === current,
          { node: await paging.elementHandle(), current });
      }
    }
    await capture(page, changing, `pagination-${width}`);
    console.log(`PASS live pagination total shrink/empty/recovery: ${width} ${locale}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
