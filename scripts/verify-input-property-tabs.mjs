import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 1100, 1024, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/components/input#preview');
    const playground = page.locator('.component-playground').first();
    const controls = playground.locator('.preview-controls');
    const tabs = controls.getByRole('tablist', { name: '属性分类', exact: true });
    const input = playground.locator('.preview-stage input[name="title"]');
    await input.waitFor();
    assert.equal(await tabs.getByRole('tab').count(), 3);
    assert.equal(await controls.locator('.property-tabs > [role="tabpanel"]:visible').count(), 1);
    assert.equal(await tabs.getByRole('tab', { name: '基础', exact: true }).getAttribute('aria-selected'), 'true');
    const panelBox = await controls.boundingBox();
    const displayBox = await playground.locator('.preview-display').boundingBox();
    if (width > 1024) {
      assert(Math.abs(panelBox.width - displayBox.width) < 1, 'preview and properties have equal width');
      assert(Math.abs(panelBox.y - displayBox.y) < 1, 'desktop properties beside preview');
      assert(displayBox.width >= 390, 'preview retains usable width');
      const tabTop = (await tabs.boundingBox()).y;
      await controls.locator('.property-tabs > [role="tabpanel"]:visible').evaluate(node => { node.scrollTop = node.scrollHeight; });
      assert(Math.abs((await tabs.boundingBox()).y - tabTop) < 1, 'category tabs stay visible when fields scroll');
      await controls.locator('.property-tabs > [role="tabpanel"]:visible').evaluate(node => { node.scrollTop = 0; });
    } else {
      assert(panelBox.y >= displayBox.y + displayBox.height, 'compact properties below preview');
      assert.equal(await controls.evaluate(node => getComputedStyle(node).contain), 'none');
    }
    await tabs.getByRole('tab', { name: '内容', exact: true }).click();
    await controls.getByRole('textbox', { name: '名称', exact: true }).fill('Saved across tabs');
    await controls.getByRole('textbox', { name: '前缀文字', exact: true }).fill('https://');
    await controls.getByRole('switch', { name: '后置图标', exact: true }).click();
    assert.equal(await input.inputValue(), 'Saved across tabs');
    await tabs.getByRole('tab', { name: '状态', exact: true }).click();
    await controls.getByRole('switch', { name: '只读', exact: true }).click();
    assert.equal(await input.getAttribute('readonly'), '');
    await tabs.getByRole('tab', { name: '内容', exact: true }).click();
    assert.equal(await controls.getByRole('textbox', { name: '前缀文字', exact: true }).inputValue(), 'https://');
    assert.equal(await controls.getByRole('switch', { name: '后置图标', exact: true }).isChecked(), true);
    const height = (await playground.boundingBox()).height;
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    const code = await playground.locator('code').textContent();
    assert.match(code, /prefix="https:\/\/"/);
    assert.match(code, /readOnly/);
    assert.match(code, /endIcon=/);
    assert(Math.abs((await playground.boundingBox()).height - height) < 1, 'preview/code keeps layout stable');
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    await tabs.getByRole('tab', { name: '基础', exact: true }).click();
    await tabs.getByRole('tab', { name: '基础', exact: true }).focus();
    await page.keyboard.press('End');
    await tabs.locator('[role="tab"][aria-selected="true"]').filter({ hasText: '状态' }).waitFor();
    assert.equal(await tabs.getByRole('tab', { name: '状态', exact: true }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    await tabs.locator('[role="tab"][aria-selected="true"]').filter({ hasText: '基础' }).waitFor();
    assert.equal(await tabs.getByRole('tab', { name: '基础', exact: true }).getAttribute('aria-selected'), 'true');
    await playground.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/inkra-input-property-tabs-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    await page.goto((process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180') + '/components/select#preview');
    await page.locator('.property-tabs').getByRole('tab', { name: '基础', exact: true }).waitFor();
    assert.equal(await page.locator('.property-tabs [role="tab"]').count(), 4);
    await page.locator('.property-tabs').getByRole('tab', { name: '状态', exact: true }).click();
    assert(await page.locator('.property-tabs').getByRole('switch', { name: '禁用', exact: true }).isVisible());
    console.log(`PASS ${width}px: property categories, responsive width, persistent values, live code, keyboard tabs, Select regression`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
