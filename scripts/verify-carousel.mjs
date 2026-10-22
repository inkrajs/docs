import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const outputDir = process.env.INKRA_CAROUSEL_OUTPUT_DIR || '/tmp';
await mkdir(outputDir, { recursive: true });

function currentItem(carousel) {
  return carousel.locator('.inkra-carousel__slide[data-current="true"]');
}

const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/carousel#preview`);

    const playground = page.locator('.component-playground');
    const carousel = playground.locator('.inkra-carousel').first();
    await carousel.waitFor();
    assert.equal(await carousel.getAttribute('aria-roledescription'), 'carousel');
    assert.equal(await carousel.locator('[aria-roledescription="slide"]').count(), 5);
    assert.equal(await currentItem(carousel).count(), 1);

    await carousel.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await currentItem(carousel).getAttribute('aria-label'), '第 2 项，共 5 项');
    await page.keyboard.press('End');
    assert.equal(await currentItem(carousel).getAttribute('aria-label'), '第 5 项，共 5 项');
    await page.keyboard.press('Home');
    assert.equal(await currentItem(carousel).getAttribute('aria-label'), '第 1 项，共 5 项');

    const openButton = carousel.getByRole('button', { name: '打开笔记 / Open notes' });
    await openButton.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await currentItem(carousel).getAttribute('aria-label'), '第 1 项，共 5 项', 'interactive slide content owns arrow keys');

    const controls = playground.getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('combobox', { name: '阅读方向' }).click();
    await page.getByRole('option', { name: 'RTL' }).click();
    await carousel.focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await currentItem(carousel).getAttribute('aria-label'), '第 2 项，共 5 项', 'RTL reverses spatial arrows');

    await controls.getByRole('tab', { name: '交互', exact: true }).click();
    await controls.getByRole('switch', { name: '自动播放' }).click();
    const pause = carousel.getByRole('button', { name: '暂停自动播放' });
    await pause.waitFor();
    await pause.click();
    assert.equal(await carousel.getAttribute('data-playing'), null);
    assert.equal(await carousel.getByRole('button', { name: '开始自动播放' }).count(), 1);

    const imageCarousel = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '图片与交互内容' }) }).locator('.inkra-carousel');
    assert.equal(await imageCarousel.locator('img').count(), 3);
    assert.equal(await imageCarousel.locator('img[alt]').count(), 3);
    const imageButton = imageCarousel.getByRole('button', { name: '查看细节' }).first();
    await imageButton.focus();
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.includes('查看细节')), true);

    const states = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '空状态与单项' }) });
    assert.equal(await states.getByText('还没有可浏览的项目。').count(), 1);
    assert.equal(await states.getByRole('button', { name: /上一组|下一组/ }).count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page does not overflow horizontally');
    await page.screenshot({ path: `${outputDir}/carousel-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
    assert.deepEqual(errors, []);
    await page.close();
  }

  const reduced = await browser.newPage({ viewport: { width: 900, height: 760 }, reducedMotion: 'reduce' });
  await reduced.goto(`${base}/docs/components/carousel#preview`);
  const controls = reduced.locator('.component-playground').getByRole('group', { name: '属性', exact: true });
  await controls.getByRole('tab', { name: '交互', exact: true }).click();
  await controls.getByRole('switch', { name: '自动播放' }).click();
  const carousel = reduced.locator('.component-playground .inkra-carousel').first();
  assert.equal(await carousel.getAttribute('data-playing'), null);
  assert.equal(await carousel.getByRole('button', { name: '开始自动播放' }).isDisabled(), true);
  await reduced.close();

  console.log('PASS Carousel controls, keyboard, RTL, responsive layout, content interaction, autoplay pause, reduced motion, images and edge states');
} finally {
  await browser.close();
}
