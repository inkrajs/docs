import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const config of [
    { width: 1305, height: 954, locale: 'zh-CN', theme: 'light' },
    { width: 390, height: 844, locale: 'en', theme: 'dark' },
  ]) {
    const page = await browser.newPage({ viewport: config });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, config);
    await page.goto(`${base}/docs/components/number-ticker#preview`);
    const zh = config.locale === 'zh-CN';
    const properties = page.getByRole('group', { name: zh ? '属性' : 'Properties', exact: true });
    const ticker = page.locator('.preview-display .inkra-number-ticker');
    const visual = ticker.locator('.inkra-number-ticker__value .inkra-pencil-text__source');
    await visual.waitFor();
    assert.equal(await visual.textContent(), '12,840');
    const toggle = page.locator('.playground-config-toggle');
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    const select = async (label, option) => {
      await chooseDocsOption(properties, label, option, { exact: true, optionExact: true });
    };
    for (const [option, expected] of [
      ['K / M / B / T', '12.8 K'], ['千 / 万 / 亿 / 兆', '1.3 万'],
      [zh ? '自动单位（跟随语言）' : 'Compact (locale)', zh ? '1.3 万' : '12.8 K'],
    ]) {
      await select(zh ? '格式' : 'Format', option);
      assert.equal(await visual.textContent(), expected);
      assert.match(await ticker.locator('[aria-live]').textContent(), /12,840/);
    }
    await select(zh ? '格式' : 'Format', 'K / M / B / T');
    await select(zh ? '最多小数位' : 'Maximum decimals', '2');
    assert.equal(await visual.textContent(), '12.84 K');
    await select(zh ? '最多小数位' : 'Maximum decimals', '1');
    const input = properties.getByLabel(zh ? '数值' : 'Value', { exact: true });
    await input.fill('999950');
    await input.blur();
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-number-ticker__value .inkra-pencil-text__source')?.textContent === '1 M');
    assert.match(await ticker.locator('[aria-live]').textContent(), /999,950/);
    await select(zh ? '格式' : 'Format', '千 / 万 / 亿 / 兆');
    await input.fill('1000000000000');
    await input.blur();
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-number-ticker__value .inkra-pencil-text__source')?.textContent === '1 兆');
    await properties.getByRole('tab', { name: zh ? '内容' : 'Content', exact: true }).click();
    await select(zh ? '最大单位' : 'Maximum unit', '万');
    assert.equal(await visual.textContent(), '100,000,000 万');
    await select(zh ? '前缀' : 'Prefix', zh ? '图标' : 'Icon');
    await select(zh ? '后缀' : 'Suffix', zh ? '图标与文字' : 'Icon and text');
    assert.equal(await ticker.locator('.inkra-pencil-icon').count(), 2);
    await select(zh ? '最大单位' : 'Maximum unit', zh ? '不限制' : 'Unrestricted');
    await properties.getByRole('tab', { name: zh ? '基础' : 'Foundations', exact: true }).click();
    await select(zh ? '数值样本' : 'Value preset', '1e+68');
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-number-ticker__value .inkra-pencil-text__source')?.textContent === '1 无量大数');
    await select(zh ? '格式' : 'Format', zh ? '科学计数法' : 'Scientific notation');
    assert.equal(await visual.textContent(), '1E68');
    await select(zh ? '数值样本' : 'Value preset', '12840');
    await select(zh ? '最多小数位' : 'Maximum decimals', '2');
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-number-ticker__value .inkra-pencil-text__source')?.textContent === '1.28E4');
    await select(zh ? '格式' : 'Format', zh ? '工程计数法' : 'Engineering notation');
    assert.equal(await visual.textContent(), '12.84E3');
    await select(zh ? '格式' : 'Format', 'K / M / B / T');
    await select(zh ? '舍入方式' : 'Rounding', zh ? '直接截断' : 'Truncate');
    await select(zh ? '最多小数位' : 'Maximum decimals', '1');
    await input.fill('12999');
    await input.blur();
    await page.waitForFunction(() => document.querySelector('.preview-display .inkra-number-ticker__value .inkra-pencil-text__source')?.textContent === '12.9 K');
    await properties.getByRole('tab', { name: zh ? '内容' : 'Content', exact: true }).click();
    await select(zh ? '切换阈值倍率' : 'Promotion threshold multiplier', '100');
    assert.equal(await visual.textContent(), '12,999');
    await select(zh ? '切换阈值倍率' : 'Promotion threshold multiplier', '1');
    if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
    await page.locator('.component-playground').getByRole('tab', { name: zh ? '代码' : 'Code', exact: true }).click();
    assert.match(await page.locator('.component-playground pre').textContent(), /compact=\{"en"\}/);
    assert.match(await page.locator('.component-playground pre').textContent(), /roundingMode.*trunc/);
    await page.locator('.component-playground').getByRole('tab', { name: zh ? '预览' : 'Preview', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.component-playground').scrollIntoViewIfNeeded();
    const [icon, valueBox] = await Promise.all([ticker.locator('.inkra-number-ticker__prefix').boundingBox(), ticker.locator('.inkra-number-ticker__value').boundingBox()]);
    assert(Math.abs(icon.y + icon.height / 2 - valueBox.y - valueBox.height / 2) < 5, 'icon affix is vertically centered');
    await page.screenshot({ path: `/tmp/inkra-compact-${config.width}.png`, fullPage: true });

    if (!zh) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    const nav = page.locator(zh ? '.desktop-sidebar .side-navigation' : '.mobile-drawer .side-navigation');
    const search = nav.locator('input[type="search"]');
    await search.fill(zh ? '数据展示' : 'Data display');
    for (const route of ['calendar', 'day-agenda', 'journey-map']) {
      assert.equal(await nav.locator(`a[href="/docs/components/${route}"]`).count(), 1);
    }
    assert.equal(await nav.getByRole('button', { name: /日期与地图|Dates and maps/ }).count(), 0);
    await nav.locator('a[href="/docs/components/day-agenda"]').click();
    await page.waitForURL(url => url.pathname === '/docs/components/day-agenda');
    if (!zh) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    assert.equal(await nav.getByRole('button', { name: zh ? '数据展示' : 'Data display', exact: true }).getAttribute('aria-expanded'), 'true');
    assert.equal(await nav.locator('a[aria-current="page"]').getAttribute('href'), '/docs/components/day-agenda');
    assert.deepEqual(errors, []);
    console.log(`PASS compact units, precision, rounding, accessible value and navigation: ${config.width}px ${config.locale}`);
    await page.close();
  }
} finally {
  await browser.close();
}
