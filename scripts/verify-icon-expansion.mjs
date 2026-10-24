import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/icon#preview');
  const catalog = await page.evaluate(async () => {
    const { docsIconCatalog, iconCategories } = await import('/src/components/iconCatalog.ts');
    return { icons: docsIconCatalog.map(({ key, category, paths }) => ({ key, category, paths })), categories: iconCategories.map(([key]) => key) };
  });
  assert.equal(new Set(catalog.icons.map(icon => icon.key)).size, catalog.icons.length, 'unique catalog keys');
  for (const icon of catalog.icons) {
    assert(icon.paths.length > 0 && icon.paths.every(path => path.d.length), icon.key);
    assert(catalog.categories.includes(icon.category), icon.key);
  }
  const categories = [
    ['files', '文件与文档', 'Files and documents'],
    ['media', '影音媒体', 'Audio and video'],
    ['communication', '沟通协作', 'Communication'],
    ['security', '安全与权限', 'Security and access'],
    ['data', '数据与系统', 'Data and systems'],
    ['commerce', '商业与交易', 'Commerce'],
    ['games', '游戏与奖励', 'Games and rewards'],
    ['navigation', '导航', 'Navigation'],
    ['editing', '编辑与排版', 'Editing and typography'],
    ['devices', '设备与连接', 'Devices and connectivity'],
    ['tools', '工具与测量', 'Tools and measurement'],
    ['nature', '天气与自然', 'Weather and nature'],
  ];
  for (const locale of ['zh-CN', 'en']) {
    await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    await page.reload();
    await page.locator('.icon-examples__catalog').waitFor();
    const grid = page.locator('.icon-examples__grid');
    const tabs = page.getByRole('tablist', { name: locale === 'en' ? 'Icon categories' : '图标分类' });
    for (const [key, zh, en] of categories) {
      await tabs.getByRole('tab', { name: locale === 'en' ? en : zh, exact: true }).click();
      const buttons = grid.getByRole('button');
      assert.equal(await buttons.count(), catalog.icons.filter(icon => icon.category === key).length, key);
      for (const button of await buttons.all()) {
        await button.scrollIntoViewIfNeeded();
        const canvas = button.locator('.icon-examples__choice-content > canvas');
        await canvas.waitFor();
        await page.waitForFunction(canvas => {
          const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          return data.some((alpha, index) => index % 4 === 3 && alpha > 0);
        }, await canvas.elementHandle());
        if (locale === 'en') assert(!/[\u3400-\u9fff]/.test(await button.innerText()), 'English labels are translated');
      }
      console.log('PASS painted category: ' + locale + ' / ' + key);
    }
    await tabs.getByRole('tab', { name: locale === 'en' ? 'All' : '全部', exact: true }).click();
    const search = page.locator('.icon-examples__catalog input[type="search"]');
    for (const query of ['宝石', 'gem']) {
      await search.fill(query);
      assert.equal(await grid.getByRole('button').count(), 1, query);
      await grid.getByRole('button').click();
      assert.equal(await grid.getByRole('button').getAttribute('aria-pressed'), 'true');
    }
    await search.fill('no-such-icon');
    assert.equal(await grid.getByRole('status').count(), 1);
    await search.fill('');
    assert.equal(await grid.getByRole('button').count(), catalog.icons.length);
    await tabs.getByRole('tab', { name: locale === 'en' ? 'Games and rewards' : '游戏与奖励', exact: true }).click();
    for (const width of [1305, 390]) {
      await page.setViewportSize({ width, height: 954 });
      await grid.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(250);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
      const geometry = await grid.evaluate(node => [node.clientWidth, node.scrollWidth]);
      assert(geometry[1] <= geometry[0] + 1, 'no grid overflow');
      await page.screenshot({ path: '/tmp/inkra-icons-' + locale + '-' + width + '.png' });
    }
    await page.setViewportSize({ width: 1305, height: 954 });
  }
  assert.deepEqual(errors, []);
  console.log('PASS ' + catalog.icons.length + ' icons; expanded categories have painted pixels, localized search and responsive layouts');
} finally {
  await browser.close();
}
