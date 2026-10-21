import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
async function expectFocus(locator) {
  await locator.page().waitForFunction(node => document.activeElement === node, await locator.elementHandle());
}
try {
  for (const [width, height] of [[1305, 954], [390, 844], [320, 568], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/overlay#preview');
    const playground = page.locator('.component-playground').first();
    const trigger = playground.getByRole('button', { name: '编辑笔记', exact: true });
    const dialog = page.getByRole('dialog', { name: '编辑笔记', exact: true });
    await trigger.click();
    await dialog.waitFor();
    await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    assert.equal(await dialog.getAttribute('data-layout'), 'sections');
    assert.equal(await dialog.locator('.inkra-overlay__section-divider').count(), 2);
    const close = dialog.getByRole('button', { name: '关闭', exact: true });
    const closeBox = await close.boundingBox();
    assert(closeBox.width >= 44 && closeBox.height >= 44);
    const header = await dialog.locator('.inkra-overlay__header').boundingBox();
    const body = await dialog.locator('.inkra-overlay__body').boundingBox();
    const footer = await dialog.locator('.inkra-overlay__footer').boundingBox();
    assert(header.y + header.height <= body.y + 1);
    assert(body.y + body.height <= footer.y + 1);
    assert(footer.y + footer.height <= height && header.y >= 0);
    await close.click();
    await dialog.waitFor({ state: 'hidden' });
    await expectFocus(trigger);

    await trigger.click();
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await expectFocus(trigger);

    await trigger.click();
    const input = dialog.getByRole('textbox', { name: '名称', exact: false });
    await input.fill('');
    await dialog.getByRole('button', { name: '保存更改', exact: true }).click();
    assert(await dialog.isVisible(), 'Footer submit preserves required validation');
    await input.fill('Section form');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/tmp/inkra-overlay-sections-${width}.png` });
    await dialog.getByRole('button', { name: '保存更改', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await playground.locator('output').textContent(), '{"name":"Section form"}');
    await expectFocus(trigger);

    await playground.getByRole('switch', { name: '显示关闭按钮', exact: true }).uncheck();
    await playground.getByRole('switch', { name: '分割线', exact: true }).uncheck();
    await trigger.click();
    await dialog.waitFor();
    assert.equal(await dialog.locator('.inkra-overlay__close-button').count(), 0);
    assert.equal(await dialog.locator('.inkra-overlay__section-divider').count(), 0);
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });

    const batchTrigger = page.getByRole('button', { name: '批量编辑', exact: true });
    await batchTrigger.click();
    const batch = page.getByRole('dialog', { name: '批量编辑', exact: true });
    await batch.waitFor();
    await batch.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    const scroll = batch.locator('.inkra-overlay__body');
    assert(await scroll.evaluate(node => node.scrollHeight > node.clientHeight), 'Long body scrolls');
    const top = await batch.locator('.inkra-overlay__header').boundingBox();
    const bottom = await batch.locator('.inkra-overlay__footer').boundingBox();
    assert(top.y >= 0 && bottom.y + bottom.height <= height, 'Fixed sections fit viewport');
    await scroll.evaluate(node => { node.scrollTop = node.scrollHeight; });
    assert(await scroll.evaluate(node => node.scrollTop > 0));
    assert.equal((await batch.locator('.inkra-overlay__header').boundingBox()).y, top.y);
    assert.equal((await batch.locator('.inkra-overlay__footer').boundingBox()).y, bottom.y);
    await batch.getByRole('textbox').last().focus();
    await page.keyboard.press('Tab');
    assert(await batch.getByRole('button', { name: '完成', exact: true }).evaluate(node => document.activeElement === node));
    await page.keyboard.press('Tab');
    assert(await batch.getByRole('button', { name: '关闭', exact: true }).evaluate(node => document.activeElement === node));
    await page.screenshot({ path: `/tmp/inkra-overlay-scroll-${width}.png` });
    await batch.getByRole('button', { name: '完成', exact: true }).click();
    await batch.waitFor({ state: 'hidden' });
    await expectFocus(batchTrigger);
    const nestedTrigger = page.getByRole('button', { name: '更多设置', exact: true });
    await nestedTrigger.click();
    const outer = page.getByRole('dialog', { name: '更多设置', exact: true });
    const innerTrigger = outer.getByRole('button', { name: '提醒设置', exact: true });
    await innerTrigger.click();
    const inner = page.getByRole('dialog', { name: '提醒设置', exact: true });
    await inner.waitFor();
    await page.keyboard.press('Escape');
    await inner.waitFor({ state: 'hidden' });
    assert(await outer.isVisible());
    await expectFocus(innerTrigger);
    await page.keyboard.press('Escape');
    await outer.waitFor({ state: 'hidden' });
    await expectFocus(nestedTrigger);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}x${height}: sections, close/focus, separators, form validation/submission, fixed actions and scroll`);
  }
} finally {
  await browser.close();
}
