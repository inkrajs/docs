import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const width of [1305, 800, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    const group = page.locator('.header-action-group');
    const language = group.getByRole('button', { name: '语言', exact: true });
    await language.waitFor();
    assert.equal(await group.locator(':scope > .inkra-button').count(), 3);
    const boxes = await group.locator(':scope > .inkra-button').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    boxes.forEach((box, index) => {
      assert(box.width >= 44 && box.height >= 44);
      if (index) assert(Math.abs(box.x - boxes[index - 1].x - boxes[index - 1].width) < 1, 'group has no gaps');
      assert.equal(box.y, boxes[0].y);
    });
    assert.equal(await group.locator('.inkra-button-group__divider').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length), 2);
    const borders = group.locator('.inkra-button__surface > .inkra-pencil-surface__border');
    assert.equal(await borders.count(), 3);
    assert(await borders.evaluateAll(nodes => nodes.every(node => getComputedStyle(node).display === 'none')), 'individual borders are suppressed');
    assert.equal(await language.locator('.inkra-pencil-icon').count(), 1, 'one language icon, no extra arrow');
    await language.click();
    assert.equal(await page.getByRole('menuitemradio', { name: '中文', exact: true }).getAttribute('aria-checked'), 'true');
    await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-locale')), 'en');
    await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();
    await page.reload();
    const englishLanguage = page.locator('.header-language');
    assert.equal(await englishLanguage.getAttribute('aria-label'), 'Language');
    await englishLanguage.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menu').waitFor();
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('header-language'));
    assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-locale')), 'zh-CN');
    await page.locator('.header-customize').click();
    const drawer = page.getByRole('dialog', { name: '主题定制', exact: true });
    await drawer.waitFor();
    assert.equal(await drawer.locator('.inkra-button-group__divider').count(), 0, 'group context does not leak into drawer buttons');
    const cancel = drawer.getByRole('button', { name: '取消', exact: true });
    assert.equal(await cancel.getAttribute('data-variant'), 'outline');
    assert.equal(await cancel.locator('.inkra-button__surface.inkra-pencil-surface--clipped').count(), 0);
    await page.waitForFunction(canvas => {
      if (!canvas?.width || !canvas.height) return false;
      return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
        .some((value, index) => index % 4 === 3 && value > 0);
    }, await cancel.locator('.inkra-button__surface > .inkra-pencil-surface__ink').elementHandle());
    assert(await cancel.locator('.inkra-button__surface > .inkra-pencil-surface__ink').evaluate(canvas =>
      canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)), 'cancel retains its own painted outline');
    await cancel.click();
    await drawer.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('header-customize'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await group.locator('.header-github').getAttribute('target'), '_blank');
    await page.screenshot({ path: `/tmp/inkra-home-header-${width}.png` });
    await page.goto(`${base}/docs/getting-started`);
    await page.locator('.page-heading').waitFor();
    assert.equal(await page.locator('.app-header .header-language').count(), 0, 'docs keeps language selection in the sidebar');
    assert.equal(await group.count(), 1, 'docs also groups header actions');
    assert.equal(await group.locator(':scope > .inkra-button').count(), 2);
    assert.equal(await group.locator('.inkra-button-group__divider').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length), 1);
    const docsBoxes = await group.locator(':scope > .inkra-button').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    assert(Math.abs(docsBoxes[1].x - docsBoxes[0].x - docsBoxes[0].width) < 1, 'docs actions have no gap');
    assert.equal(docsBoxes[0].y, docsBoxes[1].y);
    assert(docsBoxes.every(box => box.width >= 44 && box.height >= 44));
    assert(await group.locator('.inkra-button__surface > .inkra-pencil-surface__border').evaluateAll(nodes => nodes.length === 2 && nodes.every(node => getComputedStyle(node).display === 'none')));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `/tmp/inkra-docs-header-${width}.png` });
    assert.equal(await page.locator('.header-customize').count(), 1);
    assert.equal(await page.locator('.header-github').count(), 1);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS home language menu, persistence, keyboard, isolated drawer and grouped home/docs actions: ${width}px`);
  }
} finally { await browser.close(); }
