import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1305, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/image-viewer#preview`);
    const playground = page.locator('.component-playground');
    await setPlaygroundControls(playground, false);
    const trigger = page.getByRole('button', { name: '打开图片查看器', exact: true });
    const viewer = page.locator('.inkra-image-viewer');
    await trigger.click();
    await viewer.waitFor();
    await page.waitForFunction(() => document.querySelector('.inkra-image-viewer__image')?.naturalWidth > 0);
    assert.equal(await viewer.locator('.inkra-image-viewer__counter').count(), 0);
    assert.equal(await viewer.locator('.inkra-image-viewer__bottom-row').count(), 0);
    const tools = viewer.locator('.inkra-image-viewer__tools');
    const imageArea = viewer.locator('.inkra-image-viewer__body');
    const assertFloating = async () => {
      const rect = await tools.boundingBox();
      const body = await imageArea.boundingBox();
      assert(rect.x >= body.x && rect.x + rect.width <= body.x + body.width + 1);
      assert(rect.y >= body.y && rect.y + rect.height <= body.y + body.height + 1);
      const close = await viewer.locator('.inkra-image-viewer__close-control').boundingBox();
      assert(rect.x + rect.width <= close.x || rect.y >= close.y + close.height, 'toolbar never covers close');
    };
    await assertFloating();
    await viewer.getByRole('button', { name: '放大图片', exact: true }).click();
    await viewer.getByRole('button', { name: '重置缩放', exact: true }).click();
    await viewer.screenshot({ path: `/tmp/inkra-viewer-floating-${width}.png` });
    await page.keyboard.press('Escape');
    await setPlaygroundControls(playground, true);
    await playground.getByRole('switch', { name: '显示图片计数', exact: true }).click();
    await chooseDocsOption(playground, '工具栏位置', '图片下沿', { exact: true, optionExact: true });
    await setPlaygroundControls(playground, false);
    await trigger.click();
    await viewer.waitFor();
    assert.equal(await viewer.locator('.inkra-image-viewer__counter').count(), 1);
    assert.equal(await viewer.locator('.inkra-image-viewer__floating-tools').getAttribute('data-position'), 'bottom');
    await assertFloating();
    await viewer.getByRole('button', { name: '下一张图片', exact: true }).click();
    assert.match(await viewer.locator('.inkra-image-viewer__counter').textContent(), /2/);
    await page.keyboard.press('Escape');
    await page.close();
    console.log(`PASS viewer floating tools, optional counter and positioning ${width}px`);
  }
} finally {
  await browser.close();
}
