import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_IMAGE_VIEWER_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/docs/components/image-viewer#preview`);
  await page.getByRole('button', { name: '打开图片查看器' }).click();

  const dialog = page.getByRole('dialog', { name: '图片查看器' });
  await dialog.waitFor();
  assert.equal(await dialog.getByRole('img', { name: /Inkra documentation in its light theme/ }).count(), 1);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');

  await dialog.getByRole('button', { name: '下一张图片' }).click();
  assert.equal(await dialog.getByRole('img', { name: /dark theme/ }).count(), 1);
  await dialog.locator('.inkra-image-viewer__stage').press('ArrowRight');
  assert.equal(await dialog.getByRole('img', { name: /pencil artwork/ }).count(), 1);
  await dialog.getByRole('option').first().click();
  assert.equal(await dialog.getByRole('img', { name: /light theme/ }).count(), 1);
  await dialog.getByRole('button', { name: '放大图片' }).click();
  await page.waitForFunction(element => {
    const match = element.style.transform.match(/scale\(([^)]+)\)/);
    return match && Number(match[1]) > 1;
  }, await dialog.locator('.inkra-pan-zoom__content').elementHandle());
  assert.match(await dialog.locator('.inkra-pan-zoom__content').getAttribute('style'), /scale\((?!1(?:\.0+)?\))/);
  await dialog.getByRole('button', { name: '顺时针旋转' }).click();
  assert.match(await dialog.locator('.inkra-image-viewer__image-transform').getAttribute('style'), /rotate\(90deg\)/);

  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await page.getByRole('button', { name: '打开图片查看器' }).evaluate(element => element === document.activeElement), 'focus returns to the trigger');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: `${outputDir}/image-viewer-desktop.png`, fullPage: true });
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await mobile.goto(`${base}/docs/components/image-viewer#preview`);
  await mobile.getByRole('button', { name: '打开图片查看器' }).tap();
  const mobileDialog = mobile.getByRole('dialog', { name: '图片查看器' });
  const stage = mobileDialog.locator('.inkra-image-viewer__stage');
  const stageBox = await stage.boundingBox();
  assert(stageBox && stageBox.width > 250 && stageBox.height > 250, JSON.stringify(stageBox));
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: `${outputDir}/image-viewer-mobile.png`, fullPage: true });
  await mobile.close();

  console.log('PASS ImageViewer navigation, thumbnails, alt text, scroll lock, Escape focus return and mobile layout');
} finally {
  await browser.close();
}
