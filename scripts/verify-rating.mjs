import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_RATING_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

async function choose(page, scope, label, value) {
  await chooseDocsOption(scope, label, value, { exact: true, optionExact: true });
}

async function toggle(scope, label) {
  await scope.getByRole('switch', { name: label, exact: true }).click();
}

async function expectValue(rating, expected) {
  assert.equal(Number(await rating.getAttribute('aria-valuenow')), expected);
  assert.match(await rating.getAttribute('aria-valuetext'), new RegExp(`^${String(expected).replace('.', '\\.')} \\/`));
}

async function iconPixels(canvas) {
  return canvas.evaluate(node => {
    const context = node.getContext('2d');
    if (!context || !node.width || !node.height) return 0;
    const pixels = context.getImageData(0, 0, node.width, node.height).data;
    let visible = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) visible++;
    return visible;
  });
}

const browser = await chromium.launch();
try {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 900, touch: false },
    { name: 'mobile', width: 390, height: 844, touch: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/rating#preview`);

    const playground = page.locator('.component-playground').first();
    const stage = playground.locator('.preview-stage');
    const rating = stage.getByRole('slider', { name: '绘图质量', exact: true });
    await rating.waitFor();
    await expectValue(rating, 3.5);
    assert.equal(await rating.locator('.inkra-rating__symbol-target').count(), 5);
    const targetBox = await rating.locator('.inkra-rating__symbol-target').first().boundingBox();
    assert(targetBox.width >= 44 && targetBox.height >= 44, JSON.stringify(targetBox));
    assert(await iconPixels(rating.locator('canvas').first()) > 20, 'default PencilIcon paints visible pixels');

    await rating.focus();
    await page.keyboard.press('ArrowRight');
    await expectValue(rating, 4);
    await page.keyboard.press('Home');
    await expectValue(rating, 0);
    await page.keyboard.press('End');
    await expectValue(rating, 5);
    await page.keyboard.press('Delete');
    await expectValue(rating, 0);

    const third = rating.locator('.inkra-rating__symbol-target').nth(2);
    const thirdBox = await third.boundingBox();
    if (viewport.touch) {
      await third.tap({ position: { x: thirdBox.width * 0.25, y: thirdBox.height / 2 } });
    } else {
      await page.mouse.click(thirdBox.x + thirdBox.width * 0.25, thirdBox.y + thirdBox.height / 2);
    }
    await expectValue(rating, 2.5);

    if (!viewport.touch) {
      const fifth = rating.locator('.inkra-rating__symbol-target').nth(4);
      const fifthBox = await fifth.boundingBox();
      await page.mouse.move(fifthBox.x + fifthBox.width * 0.75, fifthBox.y + fifthBox.height / 2);
      assert.equal(await rating.getAttribute('data-previewing'), 'true');
      await expectValue(rating, 2.5);
      await page.mouse.move(fifthBox.x + fifthBox.width + 20, fifthBox.y + fifthBox.height + 20);
      assert.equal(await rating.getAttribute('data-previewing'), null);
      await expectValue(rating, 2.5);
    }

    await choose(page, playground, '阅读方向', 'RTL');
    await rating.focus();
    await page.keyboard.press('ArrowRight');
    await expectValue(rating, 2);
    await page.keyboard.press('ArrowLeft');
    await expectValue(rating, 2.5);

    const controls = playground.getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('tab', { name: '交互', exact: true }).click();
    await choose(page, playground, '清除策略', '不可清除');
    await rating.focus();
    await page.keyboard.press('Home');
    await expectValue(rating, 0.5);
    await page.keyboard.press('ArrowDown');
    await expectValue(rating, 0.5);
    await page.keyboard.press('Delete');
    await expectValue(rating, 0.5);
    await choose(page, playground, '清除策略', '重复选择或键盘');
    const first = rating.locator('.inkra-rating__symbol-target').first();
    const firstBox = await first.boundingBox();
    if (viewport.touch) {
      await first.tap({ position: { x: firstBox.width * 0.75, y: firstBox.height / 2 } });
    } else {
      await page.mouse.click(firstBox.x + firstBox.width * 0.75, firstBox.y + firstBox.height / 2);
    }
    await expectValue(rating, 0);
    await rating.focus();
    await page.keyboard.press('End');
    await expectValue(rating, 5);

    await controls.getByRole('tab', { name: '状态', exact: true }).click();
    await toggle(playground, '只读');
    await rating.focus();
    await page.keyboard.press('Home');
    await expectValue(rating, 5);
    assert.equal(await rating.getAttribute('aria-readonly'), 'true');
    await toggle(playground, '只读');
    await toggle(playground, '禁用');
    assert.equal(await rating.getAttribute('aria-disabled'), 'true');
    assert.equal(await rating.getAttribute('tabindex'), null);
    await toggle(playground, '禁用');

    const custom = page.getByRole('slider', { name: '收藏优先级', exact: true });
    await custom.waitFor();
    assert.equal(await custom.locator('canvas').count(), 8);
    assert(await iconPixels(custom.locator('canvas').first()) > 20, 'custom PencilIcon paints visible pixels');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
    await playground.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${outputDir}/rating-${viewport.name}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }

  console.log('PASS Rating keyboard, endpoints, RTL, half steps, clear policy, hover preview, touch, states, custom symbols and visuals');
} finally {
  await browser.close();
}
