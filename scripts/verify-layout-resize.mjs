import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview } from './playground-helpers.mjs';

const browser = await chromium.launch();
try {
  for (const [width, theme] of [[1543, 'light'], [390, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(theme => {
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      localStorage.setItem('inkra-docs-theme', theme);
    }, theme);
    await page.goto(`${process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180'}/docs/components/layout#preview`);
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    await frame.locator('.layout-notebook').waitFor();
    const choose = async name => {
      await setControls(playground, true);
      const choices = playground.locator('.layout-mode-picker');
      assert.equal(await choices.getByRole('radio').count(), 8);
      await choices.getByRole('radio', { name, exact: true }).check();
      assert(await choices.getByRole('radio', { name, exact: true }).isChecked());
      assert(await choices.evaluate(node => [...node.querySelectorAll('.inkra-choice-grid__option-label, .inkra-choice-grid__media')].every(option => option.scrollWidth <= option.clientWidth + 1)));
      assert(await choices.evaluate(node => [...node.querySelectorAll('.inkra-choice-grid__option')].every(option =>
        option.querySelector('.inkra-choice-grid__option-label').getBoundingClientRect().top >= option.querySelector('.inkra-choice-grid__media').getBoundingClientRect().bottom)), 'labels sit below the diagram cards');
      assert.equal(await choices.locator('.inkra-pencil-surface--wash').count(), 0, 'diagrams use lines, not washes');
      await choices.screenshot({ path: `/tmp/inkra-layout-choices-${width}.png` });
      await showPreview(playground);
    };
    await choose('侧栏通高');
    await playground.getByRole('radio', { name: '1024', exact: true }).check();
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas')?.contentDocument
      ?.querySelector('.layout-notebook')?.dataset.compact === 'false');
    const sidebar = frame.locator('.layout-notebook__sidebar:not(.layout-notebook__motion-copy)');
    const sideHeader = sidebar.locator('header');
    await sideHeader.locator('.layout-notebook__sidebar-brand > canvas').waitFor({ state: 'attached' });
    assert.equal(await sideHeader.locator('.layout-notebook__sidebar-brand > canvas').count(), 1);
    const positions = await sideHeader.evaluate(node => {
      const brand = node.querySelector('.layout-notebook__sidebar-brand').getBoundingClientRect();
      const button = node.querySelector('button').getBoundingClientRect();
      return { brand: brand.right, button: button.left };
    });
    assert(positions.brand <= positions.button + 1, 'collapse button follows sidebar app identity');
    assert.equal(await frame.locator('.layout-notebook__header-leading button').count(), 0);
    const handle = frame.getByRole('separator', { name: '调整侧栏宽度', exact: true });
    const getWidth = () => sidebar.evaluate(node => node.getBoundingClientRect().width);
    const before = await getWidth();
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    assert(await getWidth() > before + 10, 'drag increases sidebar width in a scaled iframe');
    const resized = await getWidth();
    await sideHeader.getByRole('button', { name: '收起侧栏' }).click();
    assert(await frame.locator('.layout-notebook').evaluate(node => node.ownerDocument.getAnimations().length > 0), 'collapsing animates');
    await sidebar.waitFor({ state: 'hidden' });
    assert(await handle.isHidden(), 'collapsed sidebar leaves no separator');
    const reopen = frame.locator('.layout-notebook__header-leading').getByRole('button', { name: '展开侧栏' });
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas').contentDocument.getAnimations().length === 0);
    assert(await reopen.evaluate(node => {
      const header = node.closest('header').getBoundingClientRect();
      const root = node.closest('.layout-notebook').getBoundingClientRect();
      return Math.abs(header.left - root.left) < 1;
    }), 'collapsed sidebar leaves no empty gutter');
    assert(await reopen.evaluate(node => node === node.ownerDocument.activeElement));
    await reopen.press('Enter');
    await sidebar.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas').contentDocument.getAnimations().length === 0);
    assert(Math.abs(await getWidth() - resized) < 2, `reopening restores dragged width: ${resized} -> ${await getWidth()}`);
    assert(await sideHeader.getByRole('button', { name: '收起侧栏' }).evaluate(node => node === node.ownerDocument.activeElement));
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    assert(await getWidth() > resized, 'separator keyboard resize');
    await page.keyboard.press('Enter');
    await sidebar.waitFor({ state: 'hidden' });
    await reopen.press('Enter');
    await sidebar.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas').contentDocument.getAnimations().length === 0);
    await playground.screenshot({ path: `/tmp/inkra-layout-interactive-${width}.png` });

    await choose('顶部通栏');
    assert.equal(await frame.locator('.layout-notebook__header-leading [data-sidebar-toggle]').count(), 0);
    assert.equal(await sidebar.locator('.layout-notebook__sidebar-top nav').count(), 1);
    assert.equal(await sidebar.locator('.layout-notebook__sidebar-bottom [data-sidebar-toggle]').count(), 1);
    assert.equal(await sidebar.locator('.layout-notebook__sidebar-bottom [data-sidebar-toggle] .inkra-button__label').innerText(), '收起侧栏');
    await sidebar.locator('[data-sidebar-toggle]').click();
    await sidebar.waitFor({ state: 'hidden' });
    assert(await handle.isHidden());
    await playground.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas').contentDocument.getAnimations().length === 0);
    await reopen.click();
    await sidebar.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.layout-viewport__canvas').contentDocument.getAnimations().length === 0);

    await choose('双侧栏');
    const details = frame.locator('.layout-notebook__secondary:not(.layout-notebook__motion-copy)');
    const detailHandle = frame.getByRole('separator', { name: '调整详情宽度' });
    const detailsBefore = await details.evaluate(node => node.clientWidth);
    const right = await detailHandle.boundingBox();
    await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
    await page.mouse.down();
    await page.mouse.move(right.x + right.width / 2 - 20, right.y + right.height / 2, { steps: 6 });
    await page.mouse.up();
    assert(await details.evaluate(node => node.clientWidth) > detailsBefore + 5, 'right column resizes independently');
    await frame.getByRole('button', { name: '收起详情', exact: true }).click();
    await details.waitFor({ state: 'hidden' });
    await frame.getByRole('button', { name: '展开详情', exact: true }).click();
    await details.waitFor({ state: 'visible' });

    await setControls(playground, true);
    await playground.locator('.property-tabs').getByRole('tab', { name: '交互', exact: true }).click();
    await playground.getByRole('switch', { name: '拖拽调宽', exact: true }).click();
    await playground.getByRole('switch', { name: '允许折叠', exact: true }).click();
    await showPreview(playground);
    assert.equal(await handle.getAttribute('aria-disabled'), 'true');
    assert.equal(await detailHandle.getAttribute('aria-disabled'), 'true');
    assert.equal(await frame.getByRole('button', { name: /收起侧栏|收起详情/ }).count(), 0);
    const fixedWidth = await getWidth();
    const disabledBox = await handle.boundingBox();
    await page.mouse.move(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(disabledBox.x + 30, disabledBox.y + disabledBox.height / 2, { steps: 4 });
    await page.mouse.up();
    assert.equal(await getWidth(), fixedWidth, 'disabled resizing remains fixed');
    await playground.getByRole('radio', { name: '390', exact: true }).check();
    await frame.getByRole('button', { name: '展开侧栏', exact: true }).click();
    assert(await sidebar.isVisible(), 'compact navigation remains accessible when desktop collapse is disabled');
    await page.screenshot({ path: `/tmp/inkra-layout-interactive-${width}-compact.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS diagram selection, header toggle placement, resizing and collapse at ${width}px/${theme}`);
    await page.close();
  }
} finally {
  await browser.close();
}
