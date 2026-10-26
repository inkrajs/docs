import assert from 'node:assert/strict';
import { chromium } from 'playwright';

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
    const trigger = playground.getByRole('button', { name: '开始引导', exact: true });
    await trigger.click();
    let dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute('data-target-missing'), null);
    assert(await dialog.evaluate(node => document.activeElement === node), 'opening focuses the guide panel');
    assert.equal(await page.locator('.inkra-guide__spotlight').count(), 1);
    await expectInsideViewport(dialog, page);

    await clickInsideViewport(dialog.getByRole('button', { name: '下一步', exact: true }), page);
    await page.getByRole('heading', { name: '整理看板', exact: true }).waitFor();
    assert.equal(await playground.getAttribute('data-guide-event'), null);
    await clickInsideViewport(page.getByRole('dialog').getByRole('button', { name: '跳过引导', exact: true }), page);
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await playground.locator('.guide-demo').getAttribute('data-guide-event'), 'skip');
    await page.waitForFunction(node => document.activeElement === node, await trigger.elementHandle());

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
