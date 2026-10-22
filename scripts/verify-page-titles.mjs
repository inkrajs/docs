import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const expectTitle = title => page.waitForFunction(expected => document.title === expected, title);
  for (const [path, title] of [
    ['/', 'Inkra'],
    ['/docs', '快速开始 · Inkra'],
    ['/docs/design-standard', '设计规范 · Inkra'],
    ['/docs/usage-guide', '使用指南 · Inkra'],
    ['/docs/components/input-number#api', 'InputNumber · Inkra'],
    ['/components/data-table#preview', 'DataTable · Inkra'],
    ['/blog', '博客 · Inkra'],
    ['/ecosystem', '生态 · Inkra'],
  ]) {
    await page.goto(base + path);
    await expectTitle(title);
  }

  const navigation = page.locator('.site-navigation');
  await navigation.getByRole('link', { name: '文档', exact: true }).click();
  await expectTitle('快速开始 · Inkra');
  await page.locator('.desktop-sidebar .language-control').getByRole('combobox').click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expectTitle('Getting started · Inkra');
  await navigation.getByRole('link', { name: 'Blog', exact: true }).click();
  await expectTitle('Blog · Inkra');
  await navigation.getByRole('link', { name: 'Ecosystem', exact: true }).click();
  await expectTitle('Ecosystem · Inkra');
  await page.goBack();
  await expectTitle('Blog · Inkra');
  await page.goForward();
  await expectTitle('Ecosystem · Inkra');
  await page.locator('.brand').click();
  await expectTitle('Inkra');
  await page.reload();
  await expectTitle('Inkra');
  await page.goto(base + '/docs/usage-guide');
  await expectTitle('Usage guide · Inkra');
  await page.locator('.desktop-sidebar .language-control').getByRole('combobox').click();
  await page.getByRole('option', { name: '中文', exact: true }).click();
  await expectTitle('使用指南 · Inkra');
  assert.deepEqual(errors, []);
  console.log('PASS page titles: direct entries, legacy URLs, navigation, history, reload and live locale changes');
} finally {
  await browser.close();
}
