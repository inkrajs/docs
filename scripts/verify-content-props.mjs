import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function choose(label, option) {
  await chooseDocsOption(page.getByRole('group', { name: '属性', exact: true }), label, option, { exact: true, optionExact: true });
  await page.getByRole('listbox').waitFor({ state: 'hidden' });
}
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const name of ['card', 'alert', 'avatar', 'table']) {
      await page.goto(`http://127.0.0.1:4180/components/${name}`);
      const pg = page.locator('.component-playground');
      const preview = pg.locator('.preview-display');
      await pg.waitFor();
      if (name === 'card') {
        await choose('尺寸', 'Large');
        assert.equal(await preview.locator('.inkra-card__content').evaluate(el => getComputedStyle(el).paddingTop), '24px');
        await pg.getByRole('switch', { name: '显示分割线' }).click();
        assert.equal(await preview.locator('.inkra-card__divider').count(), 0);
        await pg.getByRole('switch', { name: '头部操作' }).click();
        await choose('页脚对齐', 'End');
        await choose('标题层级', 'H2');
        assert.equal(await preview.locator('h2.inkra-card__title').count(), 1);
        await preview.locator('.inkra-card__action button').click();
        assert.equal(await preview.getByRole('status').textContent(), '已保存');
        await choose('内容内边距', '无');
        assert.equal(await preview.locator('.inkra-card__content').evaluate(el => getComputedStyle(el).paddingTop), '0px');
        await preview.locator('.inkra-card').evaluate(el => el.dir = 'rtl');
        assert.equal(await preview.locator('.inkra-card__footer').evaluate(el => getComputedStyle(el).justifyContent), 'flex-end');
        await choose('纸面', '描边');
        await choose('头部内边距', 'Small');
        await choose('头部垂直对齐', 'Center');
        await choose('页脚内边距', 'Large');
        await choose('页脚排列', '纵向');
        assert(await preview.locator('.inkra-card.inkra-pencil-surface--outline').count());
        assert.equal(await preview.locator('.inkra-card__header').evaluate(el => getComputedStyle(el).paddingTop), '12px');
        assert.equal(await preview.locator('.inkra-card__header').evaluate(el => getComputedStyle(el).alignItems), 'center');
        assert.equal(await preview.locator('.inkra-card__footer').evaluate(el => getComputedStyle(el).paddingTop), '24px');
        assert.equal(await preview.locator('.inkra-card__footer').evaluate(el => getComputedStyle(el).flexDirection), 'column');
      } else if (name === 'alert') {
        await choose('外观', '描边');
        await choose('尺寸', 'Small');
        await pg.getByRole('switch', { name: '显示操作' }).click();
        await preview.getByRole('button', { name: '确认', exact: true }).click();
        assert(await preview.getByRole('button', { name: '已确认', exact: true }).isVisible());
        assert.equal(await preview.locator('.inkra-alert').getAttribute('data-appearance'), 'outline');
        assert.equal(await preview.locator('.inkra-alert').evaluate(el => getComputedStyle(el).paddingTop), '12px');
      } else if (name === 'avatar') {
        await pg.getByRole('switch', { name: '显示边框' }).click();
        assert.equal(await preview.locator('.inkra-avatar__outline').count(), 0);
        await pg.getByRole('slider', { name: '圆角' }).fill('0');
        assert.equal(await preview.locator('.inkra-avatar__fallback').evaluate(el => getComputedStyle(el).borderRadius), '0px');
        await choose('图片适配', '完整显示');
      } else {
        await pg.getByRole('switch', { name: '隔行底色' }).click();
        await pg.getByRole('switch', { name: '固定表头' }).click();
        await choose('数值对齐', 'End');
        await choose('标题位置', '下');
        assert.equal(await preview.locator('td').last().evaluate(el => getComputedStyle(el).textAlign), 'end');
        const container = preview.locator('.inkra-table-container');
        await container.evaluate(el => { el.style.maxHeight = '120px'; el.scrollTop = 80; });
        const head = await preview.locator('thead').boundingBox();
        const box = await container.boundingBox();
        assert(Math.abs(head.y - box.y) < 2, 'sticky header stays at scroll boundary');
        await choose('列布局', '固定');
        await choose('单元格垂直对齐', '上');
        await pg.getByRole('switch', { name: '单元格换行' }).click();
        assert.equal(await preview.locator('table').evaluate(el => getComputedStyle(el).tableLayout), 'fixed');
        assert.equal(await preview.locator('td').first().evaluate(el => getComputedStyle(el).verticalAlign), 'top');
        assert.equal(await preview.locator('td').first().getAttribute('data-wrap'), 'false');
        await preview.locator('.inkra-table__nowrap').first().evaluate(el => { el.textContent = 'A very long description without wrapping to verify keyboard scrolling'; });
        await preview.locator('.inkra-table__nowrap').first().focus();
        await page.keyboard.press('End');
      }
      const before = await pg.boundingBox();
      await pg.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs(before.height - (await pg.boundingBox()).height) < 1);
      assert.match(await pg.locator('code').textContent(), name === 'card' ? /divided=\{false\}/ : name === 'alert' ? /appearance="outline"/ : name === 'avatar' ? /bordered=\{false\}/ : /stickyHeader=\{true\}/);
      if (name === 'card') assert.match(await pg.locator('code').textContent(), /orientation="vertical"/);
      if (name === 'table') assert.match(await pg.locator('code').textContent(), /verticalAlign="top" wrap=\{false\}/);
      await pg.getByRole('tab', { name: '预览', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at ${width}`);
      const visibleTop = await preview.evaluate(el => {
        const stage = el.querySelector('.preview-stage'); stage.scrollTop = 0;
        const child = stage.firstElementChild;
        return child.getBoundingClientRect().top >= stage.getBoundingClientRect().top - 1;
      });
      assert(visibleTop, `${name} top clipped at ${width}`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `/tmp/inkra-props-${name}-${width}.png`, fullPage: true });
    }
    console.log(`PASS expanded content props at ${width}: controls, native actions, layout and live code`);
  }
  await page.evaluate(() => localStorage.setItem('inkra-docs-theme', 'dark'));
  await page.setViewportSize({ width: 1302, height: 954 });
  for (const name of ['card', 'alert', 'avatar', 'table']) {
    await page.goto(`http://127.0.0.1:4180/components/${name}`);
    await page.locator('.component-playground').waitFor();
    if (name === 'alert') await choose('外观', '描边');
    await page.waitForTimeout(350);
    await page.screenshot({ path: `/tmp/inkra-props-${name}-dark.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
