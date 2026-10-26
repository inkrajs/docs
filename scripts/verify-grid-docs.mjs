import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview, readCode } from './playground-helpers.mjs';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
async function assertNaturalBoardHeight(playground) {
  await playground.page().waitForFunction(node => {
    if (node.querySelector('[data-playground-moving]')) return false;
    const stage = node.querySelector('.preview-stage');
    const board = node.querySelector('.inkra-grid-board');
    if (!board) return false;
    const css = getComputedStyle(stage);
    const expected = Math.max(parseFloat(css.minHeight), board.offsetHeight + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom));
    return Math.abs(stage.offsetHeight - expected) <= 1;
  }, await playground.elementHandle());
}

async function verifyShrinkingBoard(page, playground, board) {
  const canvas = board.locator('.inkra-grid-board__canvas');
  const resize = board.locator('[data-grid-item="notes"] .inkra-grid-board__resize');
  const height = () => canvas.evaluate(node => node.offsetHeight);
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(node => node.clientWidth >= 480 && node.dataset.stacked !== 'true', await board.elementHandle());
  await settle();
  const baseline = await height();
  await resize.scrollIntoViewIfNeeded();
  await resize.focus();
  for (const [key, direction] of [['ArrowDown', 1], ['ArrowUp', -1]]) {
    for (let step = 0; step < 6; step += 1) {
      const before = await height();
      assert(await resize.evaluate(node => node === document.activeElement), 'keyboard resize retains handle focus');
      await page.keyboard.press(key);
      await page.waitForFunction(({ canvas, expected }) => canvas.offsetHeight === expected, {
        canvas: await canvas.elementHandle(), expected: before + direction * 52,
      }).catch(async error => {
        console.error('Grid keyboard resize state', await board.evaluate((node, probe) => ({
          ...probe, stacked: node.dataset.stacked, width: node.clientWidth,
          height: node.querySelector('.inkra-grid-board__canvas').offsetHeight,
          active: document.activeElement?.outerHTML,
          item: node.querySelector('[data-grid-item="notes"]').getAttribute('style'),
        }), { key, step, before, expected: before + direction * 52 }));
        throw error;
      });
      await settle();
      assert.equal(await height(), before + direction * 52, 'controlled layout retains the committed resize');
    }
    await assertNaturalBoardHeight(playground);
  }
  assert.equal(await height(), baseline, 'resizing back restores the board extent');
  for (const direction of [1, -1]) {
    await resize.scrollIntoViewIfNeeded();
    const handle = await resize.boundingBox();
    const before = await height();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + direction * 52, { steps: 6 });
    await page.mouse.up();
    await page.waitForFunction(({ canvas, expected }) => canvas.offsetHeight === expected, {
      canvas: await canvas.elementHandle(), expected: before + direction * 52,
    });
    await assertNaturalBoardHeight(playground);
  }
  assert.equal(await height(), baseline, 'pointer resizing shrinks the preview as well');
  const rowHeight = playground.getByRole('slider', { name: '行高', exact: true });
  await rowHeight.focus();
  await page.keyboard.press('End');
  await page.waitForFunction(node => node.offsetHeight === 744, await canvas.elementHandle());
  await assertNaturalBoardHeight(playground);
  await page.keyboard.press('Home');
  await page.waitForFunction(node => node.offsetHeight === 240, await canvas.elementHandle());
  await assertNaturalBoardHeight(playground);
  for (let step = 0; step < 4; step += 1) await page.keyboard.press('ArrowRight');
  await page.waitForFunction(node => node.offsetHeight === 352, await canvas.elementHandle());
  await assertNaturalBoardHeight(playground);
  await playground.screenshot({ path: '/tmp/inkra-grid-height-restored.png' });
}
try {
  for (const [width, locale] of [[1543, 'zh-CN'], [390, 'en']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    if (process.env.GRID_TEST_CPU_RATE) {
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.GRID_TEST_CPU_RATE) });
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    await page.goto(`${base}/docs/components/grid#preview`);
    const playground = page.locator('.component-playground');
    const board = playground.locator('.inkra-grid-board');
    await board.waitFor();
    await showPreview(playground);
    assert.equal(await board.locator('[data-grid-item]').count(), 4);
    const saved = board.getByRole('button', { name: locale === 'en' ? 'Save draft' : '保存草稿', exact: true });
    await saved.click();
    assert(await board.getByRole('button', { name: locale === 'en' ? 'Saved' : '已保存', exact: true }).isVisible());
    if (width > 1000) {
      await verifyShrinkingBoard(page, playground, board);
      const item = board.locator('[data-grid-item="activity"]');
      const before = await item.boundingBox();
      await item.locator('.inkra-grid-board__resize').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(({ node, width }) => node.getBoundingClientRect().width > width + 1,
        { node: await item.elementHandle(), width: before.width });
      assert(await item.locator('.inkra-grid-board__move').isVisible());
    } else {
      await page.waitForFunction(() => document.querySelector('.inkra-grid-board')?.dataset.stacked === 'true');
      assert.equal(await board.locator('.inkra-grid-board__move').count(), 0);
    }
    await page.evaluate(() => document.fonts.ready);
    const cards = await board.locator('[data-grid-item]').evaluateAll(nodes => nodes.map(node => {
      const card = node.getBoundingClientRect();
      const content = node.querySelector('.inkra-grid-board__content').getBoundingClientRect();
      return { bottom: card.bottom, contentBottom: content.bottom };
    }));
    assert(cards.every(card => card.contentBottom <= card.bottom + 1), 'card content stays within resized card bounds');
    await page.mouse.move(0, 0);
    await playground.screenshot({ path: `/tmp/inkra-docs-grid-${width}.png` });
    await setControls(playground, true);
    await chooseDocsOption(playground, locale === 'en' ? 'Mode' : '模式', locale === 'en' ? 'Resizable tracks' : '行列调整', { exact: true, optionExact: true });
    await showPreview(playground);
    const tracks = playground.locator('.inkra-grid-resizable');
    const cells = tracks.locator('.grid-examples__cell');
    assert.equal(await cells.count(), 6);
    const first = await cells.nth(0).boundingBox();
    const columnHandle = tracks.locator('[role="separator"][aria-orientation="vertical"]').first();
    await columnHandle.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(({ node, width }) => node.getBoundingClientRect().width > width + 1,
      { node: await cells.nth(0).elementHandle(), width: first.width });
    const top = await cells.nth(0).boundingBox();
    const bottom = await cells.nth(3).boundingBox();
    assert(Math.abs(top.width - bottom.width) < 1, 'columns remain aligned across rows');
    assert((await readCode(playground)).includes('Grid.Resizable'));
    if (width > 1000) {
      await setControls(playground, true);
      await chooseDocsOption(playground, '模式', '基础网格', { exact: true, optionExact: true });
      await page.waitForFunction(() => document.querySelector('.component-playground .preview-stage')?.clientHeight === 340);
      await chooseDocsOption(playground, '模式', '拖拽看板', { exact: true, optionExact: true });
      await assertNaturalBoardHeight(playground);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`PASS Grid installed-package dashboard, controls, tracks and layout at ${width}px`);
    await page.close();
  }
} finally { await browser.close(); }
