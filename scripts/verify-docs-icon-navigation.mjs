import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/icon#preview');
    await page.locator('.icon-examples__grid').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const titleIcon = page.locator('.page-heading__title > canvas');
    await titleIcon.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.page-heading__title > canvas');
      return canvas && [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((v, i) => i % 4 === 3 && v);
    });
    assert.equal(await titleIcon.getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('.page-tabs .inkra-tabs__icon canvas').count(), 3);
    const categories = page.getByRole('tablist', { name: '图标分类' });
    assert.equal(await categories.locator('.inkra-tabs__icon canvas').count(), 6);
    await categories.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForFunction(() => [...document.querySelectorAll('.icon-examples__catalog .inkra-tabs__icon canvas')].every(canvas =>
      [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((v, i) => i % 4 === 3 && v)));

    const menu = page.getByRole('button', { name: '打开文档目录', exact: true });
    const drawer = await menu.isVisible();
    if (drawer) await menu.click();
    const nav = page.locator('.side-navigation:visible');
    await nav.locator('.nav-link').first().waitFor();
    const positions = await nav.locator('.nav-link').evaluateAll(links => links.map(link => ({
      icon: link.querySelector('.docs-pencil-icon').getBoundingClientRect().x,
      text: link.querySelector('.inkra-pencil-text').getBoundingClientRect().x,
      row: link.getBoundingClientRect().width,
      indentation: link.querySelector('.docs-pencil-icon').getBoundingClientRect().x
        - link.closest('.nav-group').querySelector('.nav-group-label .docs-pencil-icon').getBoundingClientRect().x,
    })));
    assert(positions.length > 20);
    for (const position of positions) {
      assert(Math.abs(position.icon - positions[0].icon) < 1, 'navigation icon column aligned');
      assert(Math.abs(position.text - positions[0].text) < 1, 'navigation label column aligned');
      assert(Math.abs(position.row - positions[0].row) < 1, 'navigation rows full width');
      assert(Math.abs(position.indentation - 16) < 1, 'child items keep a consistent 16px indent');
    }
    const selected = nav.locator('[aria-current="page"]');
    assert(Math.abs((await selected.boundingBox()).width - (await selected.locator('.selection-backdrop').boundingBox()).width) < 1);
    if (drawer) await page.keyboard.press('Escape');
    await page.screenshot({ path: `/tmp/inkra-docs-icons-heading-${width}.png` });

    const catalog = page.locator('.icon-examples__catalog');
    await catalog.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    const grid = catalog.locator('.icon-examples__grid');
    const geometry = await grid.evaluate(node => ({ height: node.clientHeight, content: node.scrollHeight, width: node.clientWidth, contentWidth: node.scrollWidth }));
    assert(geometry.height <= 416 && geometry.content > geometry.height);
    assert(geometry.contentWidth <= geometry.width + 1, 'catalog does not overflow horizontally');
    const beforeY = await categories.evaluate(node => node.getBoundingClientRect().y);
    await grid.hover();
    await page.mouse.wheel(0, 450);
    await page.waitForFunction(() => document.querySelector('.icon-examples__grid').scrollTop > 0);
    assert(Math.abs(await categories.evaluate(node => node.getBoundingClientRect().y) - beforeY) < 1, 'categories stay still while icons scroll');
    await categories.getByRole('tab', { name: '主题与语言', exact: true }).click();
    assert.equal(await grid.evaluate(node => node.scrollTop), 0);
    assert.equal(await grid.getByRole('button', { name: '语言', exact: true }).count(), 1);
    await categories.getByRole('tab', { name: '全部', exact: true }).click();
    const search = catalog.getByRole('searchbox', { name: '搜索图标', exact: true });
    await search.fill('monitor');
    assert.equal(await grid.getByRole('button').count(), 1);
    await grid.getByRole('button', { name: '跟随系统', exact: true }).click();
    assert.equal(await grid.getByRole('button').getAttribute('aria-pressed'), 'true');
    await search.fill('no-such-icon');
    assert.equal(await grid.getByRole('status').textContent(), '没有匹配的图标');
    await catalog.getByRole('button', { name: '清空搜索', exact: true }).click();
    assert.equal(await grid.getByRole('button').count(), 91);
    await grid.focus();
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('.icon-examples__grid').scrollTop > 0);
    await page.waitForTimeout(500);
    await grid.evaluate(node => { node.scrollTop = 0; node.blur(); });
    await catalog.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/tmp/inkra-docs-icons-catalog-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page has no horizontal overflow');
    for (const path of ['button', 'field']) {
      await page.goto(`http://127.0.0.1:4180/components/${path}#preview`);
      await page.locator('.page-heading__title > canvas').waitFor();
      assert.equal(await page.locator('.page-tabs .inkra-tabs__icon canvas').count(), 3);
    }
    const favicon = await page.request.get('http://127.0.0.1:4180/favicon.png');
    assert.equal(favicon.status(), 200);
    assert.match(favicon.headers()['content-type'], /image\/png/);
    console.log(`PASS ${width}px: navigation alignment, heading/tab icons, catalog scrolling/search/categories, shared pages, favicon`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
