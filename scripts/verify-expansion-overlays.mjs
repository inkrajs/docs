import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function expectFocused(locator) {
  const handle = await locator.elementHandle();
  assert(handle, 'focus target must exist');
  await locator.page().waitForFunction(node => document.activeElement === node, handle);
}

async function chooseOption(scope, label, option) {
  await scope.getByRole('combobox', { name: label }).click();
  await scope.page().getByRole('option', { name: option, exact: true }).click();
}

try {
  for (const [width, height] of [[1280, 900], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${baseUrl}/components/alert-dialog#preview`);
    const alertPlayground = page.locator('.component-playground').first();
    const alertTrigger = page.getByRole('button', { name: /归档项目|Archive project/ });
    await alertTrigger.waitFor();
    const alertControls = alertPlayground.locator('.preview-controls');
    await alertPlayground.locator('.property-tabs').getByRole('tab', { name: /交互|Interaction/ }).click();
    await chooseOption(alertControls, /异步时长|Async duration/, '300 ms');
    const basicTrigger = page.getByRole('button', { name: /删除草稿|Delete draft/ });
    await basicTrigger.click();
    const basicAlert = page.getByRole('alertdialog');
    await basicAlert.getByRole('button', { name: /^(删除|Delete)$/ }).click();
    await basicAlert.waitFor({ state: 'hidden' });
    await expectFocused(basicTrigger);

    await alertTrigger.click();
    const alert = page.getByRole('alertdialog');
    await alert.waitFor();
    const cancel = alert.getByRole('button', { name: /取消|Cancel/ });
    await expectFocused(cancel);
    await page.mouse.click(2, 2);
    assert(await alert.isVisible(), 'outside pointer interaction must not close AlertDialog');
    await alert.getByRole('button', { name: /确认归档|Confirm archive/ }).click();
    assert.equal(await alert.getAttribute('aria-busy'), 'true');
    await page.keyboard.press('Escape');
    assert(await alert.isVisible(), 'pending AlertDialog ignores Escape');
    await alert.waitFor({ state: 'hidden' });
    await expectFocused(alertTrigger);

    await page.goto(`${baseUrl}/components/drawer#preview`);
    const drawerPlayground = page.locator('.component-playground').first();
    const trigger = page.getByRole('button', { name: /打开任务抽屉|Open task drawer/ });
    await trigger.waitFor();
    const drawerControls = drawerPlayground.locator('.preview-controls');
    await drawerPlayground.locator('.property-tabs').getByRole('tab', { name: /布局|Layout/ }).click();
    await chooseOption(drawerControls, /尺寸|Size/, 'lg');
    for (const direction of ['top', 'right', 'bottom', 'left']) {
      await chooseOption(drawerControls, /方向|Direction/, direction);
      await trigger.click();
      const drawer = page.getByRole('dialog', { name: /任务详情|Task details/ });
      await drawer.waitFor();
      await drawer.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
      assert.equal(await drawer.getAttribute('data-direction'), direction);
      assert.equal(await drawer.locator('.inkra-drawer__edge').count(), 1);
      const paper = drawer.locator('.inkra-drawer__surface');
      assert.ok(await paper.evaluate(node => node.classList.contains('inkra-pencil-surface--full')), 'drawer paper has no second perimeter outline');
      const rect = await drawer.boundingBox();
      if (direction === 'right' || direction === 'left') {
        assert.ok(Math.abs(rect.y) < 1 && Math.abs(rect.height - height) < 1);
        assert.ok(direction === 'right' ? Math.abs(rect.x + rect.width - width) < 1 : Math.abs(rect.x) < 1);
      } else {
        assert.ok(Math.abs(rect.x) < 1 && Math.abs(rect.width - width) < 1);
        assert.ok(direction === 'bottom' ? Math.abs(rect.y + rect.height - height) < 1 : Math.abs(rect.y) < 1);
      }
      assert.equal(await paper.locator(':scope > .inkra-pencil-surface__ink').evaluate(canvas => {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, 1, 1).data[3];
      }), 255, 'paper fills the outer corner without inset gaps');
      const body = drawer.locator('.inkra-drawer__body');
      assert(await body.evaluate(node => node.scrollHeight > node.clientHeight), 'Drawer body should own long-content scrolling');
      assert(await drawer.evaluate(node => node.getBoundingClientRect().left >= -1 && node.getBoundingClientRect().right <= innerWidth + 1));
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      await expectFocused(trigger);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}x${height}: AlertDialog safety and Drawer directions/focus/scroll`);
  }
} finally {
  await browser.close();
}
