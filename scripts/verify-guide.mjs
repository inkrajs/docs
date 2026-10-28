import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { chooseDocsOption, setPlaygroundControls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

async function expectInsideViewport(locator, page) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert(box && viewport);
  assert(box.x >= -0.5 && box.y >= -0.5, JSON.stringify(box));
  assert(box.x + box.width <= viewport.width + 0.5, JSON.stringify(box));
  assert(box.y + box.height <= viewport.height + 0.5, JSON.stringify(box));
}

async function clickInsideViewport(locator, page) {
  await locator.waitFor();
  await expectInsideViewport(locator, page);
  const box = await locator.boundingBox();
  assert(box);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  assert(await locator.evaluate((node, position) => node.contains(document.elementFromPoint(position.x, position.y)), point),
    `Guide action is occluded at ${JSON.stringify(point)}`);
  await page.mouse.click(point.x, point.y);
}

try {
  for (const viewport of [{ width: 1305, height: 900 }, { width: 390, height: 760 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'en');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    await page.goto(`${base}/docs/components/guide#preview`);
    await page.getByRole('heading', { name: 'Guide', exact: true }).waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0, 'Guide does not open on page load');

    const playground = page.locator('.component-playground').first();
    const inheritedTrigger = playground.getByRole('button', { name: 'Start guide', exact: true });
    await inheritedTrigger.waitFor();
    assert.equal(await inheritedTrigger.count(), 1, 'basic guide initially inherits the English docs locale');
    await setPlaygroundControls(playground, true);
    await chooseDocsOption(playground, 'Language', '简体中文', { exact: true, optionExact: true });
    await setPlaygroundControls(playground, false);
    const trigger = playground.getByRole('button', { name: '开始引导', exact: true });
    await trigger.click();
    let dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute('data-target-missing'), null);
    assert(await dialog.evaluate(node => document.activeElement === node), 'opening focuses the guide panel');
    assert.equal(await page.locator('.inkra-guide__spotlight').count(), 1);
    await expectInsideViewport(dialog, page);
    let cornerSkip = page.locator('.inkra-guide__skip');
    await cornerSkip.waitFor();
    assert.equal(await cornerSkip.getAttribute('data-placement'), 'top-end');
    assert.equal(await cornerSkip.getAttribute('data-appearance'), 'icon');
    assert.equal(await cornerSkip.getAttribute('aria-label'), '跳过引导');
    assert.equal(await cornerSkip.getAttribute('title'), '跳过引导');
    await expectInsideViewport(cornerSkip, page);
    const [dialogBox, skipBox] = await Promise.all([dialog.boundingBox(), cornerSkip.boundingBox()]);
    assert(dialogBox && skipBox);
    assert(skipBox.x + skipBox.width <= dialogBox.x || skipBox.x >= dialogBox.x + dialogBox.width
      || skipBox.y + skipBox.height <= dialogBox.y || skipBox.y >= dialogBox.y + dialogBox.height,
    JSON.stringify({ dialogBox, skipBox }));
    await dialog.getByRole('button', { name: '关闭引导', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    assert(await cornerSkip.evaluate(node => document.activeElement === node), 'Shift+Tab reaches corner skip without leaving Guide');
    await page.keyboard.press('Shift+Tab');
    assert(await dialog.getByRole('button', { name: '下一步', exact: true }).evaluate(node => document.activeElement === node), 'corner skip loops back into dialog');

    await clickInsideViewport(dialog.getByRole('button', { name: '下一步', exact: true }), page);
    await page.getByRole('heading', { name: '整理看板', exact: true }).waitFor();
    assert.equal(await playground.getAttribute('data-guide-event'), null);
    await clickInsideViewport(cornerSkip, page);
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await playground.locator('.guide-demo').getAttribute('data-guide-event'), 'skip');
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());

    const properties = playground.locator('.preview-controls');
    const choose = async (label, option) => {
      await setPlaygroundControls(playground, true);
      const behaviorTab = properties.getByRole('tab').nth(1);
      if (await behaviorTab.getAttribute('aria-selected') !== 'true') await behaviorTab.click();
      await chooseDocsOption(properties, label, option, { exact: true, optionExact: true });
      await setPlaygroundControls(playground, false);
    };
    for (const [placement, label] of [['top-start', '左上角'], ['bottom-start', '左下角'], ['bottom-end', '右下角'], ['top-end', '右上角']]) {
      await choose('跳过位置', label);
      await trigger.click();
      cornerSkip = page.locator('.inkra-guide__skip');
      await cornerSkip.waitFor();
      const actualPlacement = await cornerSkip.getAttribute('data-placement');
      assert(['top-start', 'top-end', 'bottom-start', 'bottom-end'].includes(actualPlacement));
      if (viewport.width > 480) assert.equal(actualPlacement, placement);
      const [configuredDialogBox, configuredSkipBox] = await Promise.all([page.getByRole('dialog').boundingBox(), cornerSkip.boundingBox()]);
      assert(configuredDialogBox && configuredSkipBox);
      assert(configuredSkipBox.x + configuredSkipBox.width <= configuredDialogBox.x || configuredSkipBox.x >= configuredDialogBox.x + configuredDialogBox.width
        || configuredSkipBox.y + configuredSkipBox.height <= configuredDialogBox.y || configuredSkipBox.y >= configuredDialogBox.y + configuredDialogBox.height,
      JSON.stringify({ placement, actualPlacement, configuredDialogBox, configuredSkipBox }));
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
    }
    await choose('跳过外观', 'Text');
    await trigger.click();
    cornerSkip = page.locator('.inkra-guide__skip');
    await cornerSkip.waitFor();
    assert.equal(await cornerSkip.getAttribute('data-appearance'), 'text');
    assert.equal((await cornerSkip.textContent()).trim(), '跳过引导');
    await clickInsideViewport(cornerSkip, page);
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await playground.locator('.guide-demo').getAttribute('data-guide-event'), 'skip');
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());
    await choose('跳过外观', 'Icon');

    await trigger.click();
    dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());

    const callbackExample = page.locator('#guide-skip-and-finish');
    await callbackExample.scrollIntoViewIfNeeded();
    const callbackStart = callbackExample.getByRole('button', { name: 'Start', exact: true });
    await callbackStart.click();
    dialog = page.getByRole('dialog');
    assert.equal(await page.locator('.inkra-guide__skip').count(), 0, 'panel placement removes the screen-corner action');
    await clickInsideViewport(dialog.getByRole('button', { name: 'Skip tour', exact: true }), page);
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await callbackExample.locator('[data-guide-result]').getAttribute('data-guide-result'), 'skip');

    await callbackStart.click();
    dialog = page.getByRole('dialog');
    await dialog.press('ArrowRight');
    await page.getByRole('heading', { name: 'Final step', exact: true }).waitFor();
    await dialog.press('ArrowLeft');
    await page.getByRole('heading', { name: 'First step', exact: true }).waitFor();
    await clickInsideViewport(dialog.getByRole('button', { name: 'Next', exact: true }), page);
    await clickInsideViewport(dialog.getByRole('button', { name: 'Finish', exact: true }), page);
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await callbackExample.locator('[data-guide-result]').getAttribute('data-guide-result'), 'finish');

    await callbackExample.getByRole('switch', { name: '显示跳过', exact: true }).click();
    await callbackStart.click();
    dialog = page.getByRole('dialog');
    assert.equal(await dialog.getByRole('button', { name: 'Skip tour', exact: true }).count(), 0, 'showSkip=false removes the skip action');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });

    const missingExample = page.locator('#guide-missing-target');
    await missingExample.scrollIntoViewIfNeeded();
    const missingStart = missingExample.getByRole('button', { name: 'Start missing-target guide', exact: true });
    await missingStart.click();
    dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute('data-target-missing'), 'true');
    assert.equal(await page.locator('.inkra-guide__spotlight').count(), 0);
    assert.equal(await page.locator('.inkra-guide__backdrop').count(), 1);
    await expectInsideViewport(dialog, page);
    await clickInsideViewport(dialog.getByRole('button', { name: 'Next', exact: true }), page);
    await page.getByRole('heading', { name: 'Target available', exact: true }).waitFor();
    assert.equal(await page.getByRole('dialog').getAttribute('data-target-missing'), null);
    assert.equal(await page.locator('.inkra-guide__spotlight').count(), 1);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `/tmp/inkra-guide-${viewport.width}.png`, animations: 'disabled', fullPage: false });
    await page.close();
    console.log(`PASS Guide behavior, focus, missing target and narrow layout: ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
