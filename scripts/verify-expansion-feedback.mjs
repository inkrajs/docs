import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const baseUrl = process.env.BASE_URL || process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];

try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${baseUrl}/components/toast#preview`);
    await page.getByRole('heading', { name: 'Toast', exact: true }).waitFor();
    const toastExamples = page.locator('.feedback-examples');
    const basicToast = toastExamples.locator(':scope > .component-example').first();
    const toastPlayground = toastExamples.locator(':scope > .component-playground').first();
    assert(await basicToast.getByRole('heading', { name: /基础通知|Basic notification/ }).isVisible());
    assert(await basicToast.evaluate((node, playground) => Boolean(node.compareDocumentPosition(playground) & Node.DOCUMENT_POSITION_PRECEDING), await toastPlayground.elementHandle()), 'playground precedes the basic toast example');
    assert.equal(await toastExamples.locator('select').count(), 0, 'feedback docs use DocsSelect instead of native select');
    await basicToast.getByRole('button', { name: /显示通知|Show notification/ }).click();
    const notification = page.locator('.inkra-toast__root').last();
    await notification.waitFor();
    assert.match(await notification.textContent(), /保存好了|Saved/);
    assert.equal(await notification.getAttribute('data-tone'), 'neutral');
    await notification.hover();
    await notification.getByRole('button', { name: /关闭通知|Close notification/ }).click();
    await notification.waitFor({ state: 'detached' });
    await toastPlayground.getByRole('tab', { name: /交互|Interaction/ }).click();
    assert(await toastPlayground.getByLabel(/播报优先级|Announcement priority/).isVisible());
    assert(await toastPlayground.getByRole('switch', { name: /显示撤销操作|Show undo action/ }).isVisible());
    await toastPlayground.getByRole('button', { name: /保存草稿|Save draft/ }).click();
    await page.locator('.inkra-toast__root').filter({ hasText: /正在保存|Saving/ }).waitFor();
    await page.locator('.inkra-toast__root').filter({ hasText: /已保存|saved/ }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'toast docs do not overflow');

    await page.goto(`${baseUrl}/components/empty#preview`);
    await page.getByRole('heading', { name: 'Empty', exact: true }).waitFor();
    const emptyExamples = page.locator('.feedback-examples');
    const basicEmpty = emptyExamples.locator(':scope > .component-example').first();
    const emptyPlayground = emptyExamples.locator(':scope > .component-playground').first();
    assert(await basicEmpty.getByRole('heading', { name: /最小空态|Minimal empty state/ }).isVisible());
    assert(await basicEmpty.evaluate((node, playground) => Boolean(node.compareDocumentPosition(playground) & Node.DOCUMENT_POSITION_PRECEDING), await emptyPlayground.elementHandle()), 'playground precedes the basic empty example');
    for (const tab of [/基础|Basic/, /内容|Content/, /布局|Layout/]) assert(await emptyPlayground.getByRole('tab', { name: tab }).count() === 1);
    await emptyPlayground.getByRole('button', { name: /新建笔记|Create note/ }).click();
    assert(await emptyPlayground.getByRole('heading', { name: /第一条笔记已就位|Your first note is ready/ }).isVisible());
    await emptyPlayground.getByRole('button', { name: /重置|Reset/ }).click();
    assert(await emptyPlayground.getByRole('heading', { name: /还没有笔记|No notes yet/ }).isVisible());
    assert(await page.getByRole('heading', { name: /收件箱是空的|Your inbox is empty/ }).isVisible());
    assert(await page.getByRole('button', { name: /写一条消息|Write a message/ }).isVisible());
    const detailedEmpty = emptyExamples.locator(':scope > .component-example').filter({ hasText: /说明与操作|Description and actions/ });
    await detailedEmpty.getByRole('button', { name: /写一条消息|Write a message/ }).click();
    assert.match(await detailedEmpty.locator('output').textContent(), /已打开编辑器|Composer opened/);
    assert.equal(await page.locator('.inkra-empty').first().getAttribute('role'), null);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'empty docs do not overflow');

    await page.goto(`${baseUrl}/components/toggle-group#preview`);
    await page.getByRole('heading', { name: 'ToggleGroup', exact: true }).waitFor();
    const toggleExamples = page.locator('.feedback-examples');
    const basicToggle = toggleExamples.locator(':scope > .component-example').first();
    const togglePlayground = toggleExamples.locator(':scope > .component-playground').first();
    assert(await basicToggle.getByRole('heading', { name: /基础单选|Basic single selection/ }).isVisible());
    assert(await basicToggle.evaluate((node, playground) => Boolean(node.compareDocumentPosition(playground) & Node.DOCUMENT_POSITION_PRECEDING), await togglePlayground.elementHandle()), 'playground precedes the basic toggle example');
    const group = togglePlayground.getByRole('group', { name: /文字对齐|Text alignment/ });
    const items = group.getByRole('button');
    await items.nth(0).focus();
    await items.nth(0).press('ArrowRight');
    assert(await items.nth(1).evaluate(node => node === document.activeElement), 'horizontal arrow key moves roving focus');
    await items.nth(1).press('Enter');
    assert.equal(await items.nth(1).getAttribute('aria-pressed'), 'true');
    assert.equal(await group.getAttribute('role'), 'group');
    assert.equal(await group.locator('[role="tab"]').count(), 0);

    await togglePlayground.getByRole('tab', { name: /布局|Layout/ }).click();
    await togglePlayground.getByRole('switch', { name: 'RTL' }).check();
    assert.equal(await group.getAttribute('dir'), 'rtl');
    await items.nth(0).focus();
    await items.nth(0).press('ArrowLeft');
    assert(await items.nth(1).evaluate(node => node === document.activeElement), 'RTL reverses horizontal arrow navigation');

    await togglePlayground.getByRole('tab', { name: /状态|State/ }).click();
    await togglePlayground.getByRole('switch', { name: /允许多选|Multiple/ }).check();
    await items.nth(1).click();
    assert.equal(await items.nth(0).getAttribute('aria-pressed'), 'true');
    assert.equal(await items.nth(1).getAttribute('aria-pressed'), 'true');
    await togglePlayground.getByRole('switch', { name: /整体禁用|Disabled/ }).check();
    assert(await items.nth(0).isDisabled());
    assert(await items.nth(1).isDisabled());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'toggle group docs do not overflow');

    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    assert.equal(await items.nth(1).getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `/tmp/inkra-expansion-feedback-${width}.png`, fullPage: true });
    await page.close();
    console.log(`PASS feedback expansion interactions and responsive layout at ${width}px`);
  }

  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
