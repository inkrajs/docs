import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: 'reduce' });
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';

try {
  for (const locale of ['zh-CN', 'en']) {
    await page.setViewportSize({ width: 1305, height: 954 });
    const en = locale === 'en';
    await page.goto(base);
    await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    await page.goto(`${base}/docs/components/breadcrumb#preview`);
    await page.reload();

    const playground = page.locator('.component-playground').first();
    const breadcrumb = playground.locator('.inkra-breadcrumb');
    const firstLink = breadcrumb.locator('.inkra-breadcrumb__link').first();
    const secondLink = breadcrumb.locator('.inkra-breadcrumb__link').nth(1);
    const currentPage = breadcrumb.locator('.inkra-breadcrumb__page');
    await breadcrumb.waitFor();
    await page.evaluate(() => document.fonts.ready);

    assert.equal(await firstLink.getAttribute('data-variant'), 'link');
    assert.equal(await firstLink.getAttribute('href'), '/');
    assert.equal(await firstLink.locator('.inkra-button__underline').count(), 1);

    const geometry = await playground.evaluate(root => {
      const link = root.querySelector('.inkra-breadcrumb__link');
      const linkSurface = link?.querySelector('.inkra-button__surface');
      const linkContent = link?.querySelector('.inkra-button__content');
      const linkLabel = link?.querySelector('.inkra-button__label');
      const pageItem = root.querySelector('.inkra-breadcrumb__page');
      const pageLabel = pageItem?.querySelector('.inkra-breadcrumb__label');
      const linkIcon = link?.querySelector('.inkra-button__icon');
      const pageIcon = pageItem?.querySelector('.inkra-breadcrumb__icon');
      const trigger = document.querySelector('.breadcrumb-composition-example .inkra-breadcrumb__trigger');
      const triggerSurface = trigger?.querySelector('.inkra-button__surface');
      const triggerContent = trigger?.querySelector('.inkra-button__content');
      const triggerLabel = trigger?.querySelector('.inkra-button__label');
      const triggerIcon = trigger?.querySelector('.inkra-button__icon');
      if (!(linkSurface && linkContent && linkLabel && pageItem && pageLabel && linkIcon && pageIcon && triggerSurface && triggerContent && triggerLabel && triggerIcon)) throw new Error('Breadcrumb geometry nodes missing');
      const style = element => getComputedStyle(element);
      const rect = element => element.getBoundingClientRect();
      const sourceRangeCenter = (label, container) => {
        const source = label.querySelector('.inkra-pencil-text__source');
        if (!source?.firstChild) throw new Error('Breadcrumb text source missing');
        const range = document.createRange();
        range.selectNodeContents(source);
        const rangeRect = range.getBoundingClientRect();
        return rangeRect.top + rangeRect.height / 2 - rect(container).top;
      };
      return {
        font: [style(linkSurface).fontSize, style(pageItem).fontSize, style(triggerSurface).fontSize],
        lineHeight: [style(linkSurface).lineHeight, style(pageItem).lineHeight, style(triggerSurface).lineHeight],
        padding: [style(linkSurface).paddingInlineStart, style(pageItem).paddingInlineStart, style(triggerSurface).paddingInlineStart],
        gap: [style(linkContent).gap, style(pageItem).gap, style(triggerContent).gap],
        heights: [rect(linkSurface).height, rect(pageItem).height, rect(triggerSurface).height],
        iconSizes: [[rect(linkIcon).width, rect(linkIcon).height], [rect(pageIcon).width, rect(pageIcon).height], [rect(triggerIcon).width, rect(triggerIcon).height]],
        sourceDisplays: [
          style(linkLabel.querySelector('.inkra-pencil-text__source')).display,
          style(pageLabel.querySelector('.inkra-pencil-text__source')).display,
          style(triggerLabel.querySelector('.inkra-pencil-text__source')).display,
        ],
        textRangeCenterOffsets: [
          sourceRangeCenter(linkLabel, linkSurface),
          sourceRangeCenter(pageLabel, pageItem),
          sourceRangeCenter(triggerLabel, triggerSurface),
        ],
      };
    });
    for (const values of [geometry.font, geometry.lineHeight, geometry.padding, geometry.gap]) {
      assert(values.every(value => value === values[0]));
    }
    assert(geometry.iconSizes.every(value => value[0] === geometry.iconSizes[0][0] && value[1] === geometry.iconSizes[0][1]));
    assert(geometry.heights.every(value => Math.abs(value - geometry.heights[0]) < 0.5));
    assert(geometry.sourceDisplays.every(value => value === geometry.sourceDisplays[0]));
    assert(geometry.textRangeCenterOffsets.every(value => Math.abs(value - geometry.textRangeCenterOffsets[0]) < 0.5));
    const shortTitle = await breadcrumb.evaluate(root => {
      const fixture = root.cloneNode(true);
      fixture.style.cssText = 'position:absolute;visibility:hidden;width:300px;inset:0 auto auto 0';
      const link = fixture.querySelector('.inkra-breadcrumb__link');
      const current = fixture.querySelector('.inkra-breadcrumb__page');
      for (const item of [link, current]) {
        item.querySelectorAll('.inkra-button__icon,.inkra-breadcrumb__icon').forEach(icon => icon.remove());
        item.querySelector('.inkra-pencil-text__source').textContent = 'A';
      }
      root.parentElement.append(fixture);
      const geometry = [link, current].map(item => {
        const range = document.createRange();
        range.selectNodeContents(item.querySelector('.inkra-pencil-text__source'));
        const box = item.getBoundingClientRect();
        const text = range.getBoundingClientRect();
        return { width: box.width, offset: text.left - box.left, centerY: text.top + text.height / 2 - box.top };
      });
      fixture.remove();
      return geometry;
    });
    for (const key of ['width', 'offset', 'centerY']) {
      assert(Math.abs(shortTitle[0][key] - shortTitle[1][key]) < 0.5, 'short page/link title keeps ' + key);
    }

    const stationary = async locator => {
      const position = () => locator.evaluate(node => {
        const surface = node.querySelector('.inkra-button__surface').getBoundingClientRect();
        const item = node.closest('.inkra-breadcrumb__item').getBoundingClientRect();
        return { x: surface.x - item.x, y: surface.y - item.y, width: surface.width, height: surface.height };
      });
      await locator.scrollIntoViewIfNeeded();
      const before = await position();
      await locator.hover();
      await page.waitForTimeout(50);
      const hover = await position();
      await locator.press('Space');
      const after = await position();
      assert.deepEqual(hover, before, 'hover keeps the surface aligned within its breadcrumb item');
      assert.deepEqual(after, before, 'native Space scrolling does not change breadcrumb geometry');
    };
    await stationary(firstLink);

    await breadcrumb.evaluate(element => element.setAttribute('dir', 'rtl'));
    const rtlPositions = await breadcrumb.evaluate(root => {
      const first = root.querySelector('.inkra-breadcrumb__link');
      const second = root.querySelectorAll('.inkra-breadcrumb__link')[1];
      const startIcon = first.querySelector('.inkra-button__icon--start').getBoundingClientRect();
      const firstLabel = first.querySelector('.inkra-button__label').getBoundingClientRect();
      const endIcon = second.querySelector('.inkra-button__icon--end').getBoundingClientRect();
      const secondLabel = second.querySelector('.inkra-button__label').getBoundingClientRect();
      return { startAfterLabel: startIcon.left > firstLabel.left, endBeforeLabel: endIcon.left < secondLabel.left };
    });
    assert.equal(rtlPositions.startAfterLabel, true);
    assert.equal(rtlPositions.endBeforeLabel, true);

    await breadcrumb.evaluate(root => {
      root.style.width = '180px';
      const source = root.querySelector('.inkra-breadcrumb__link .inkra-pencil-text__source');
      if (source) source.textContent = 'A-very-long-breadcrumb-segment-that-must-wrap';
    });
    assert(await breadcrumb.evaluate(root => root.scrollWidth <= root.clientWidth + 1));
    const longPath = await breadcrumb.evaluate(root => {
      const surface = root.querySelector('.inkra-breadcrumb__link .inkra-button__surface');
      const source = root.querySelector('.inkra-breadcrumb__link .inkra-pencil-text__source');
      if (!surface || !source?.firstChild) throw new Error('Long breadcrumb nodes missing');
      const surfaceRect = surface.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(source);
      const textRect = range.getBoundingClientRect();
      return {
        surfaceHeight: surfaceRect.height,
        textContained: textRect.top >= surfaceRect.top - 1 && textRect.bottom <= surfaceRect.bottom + 1,
      };
    });
    assert(longPath.surfaceHeight > 44);
    assert.equal(longPath.textContained, true);

    const composition = page.locator('.breadcrumb-composition-example');
    const menuTrigger = composition.getByRole('button', { name: en ? 'Components' : '组件', exact: true });
    await menuTrigger.click();
    await page.getByRole('menuitemradio', { name: en ? 'Patterns' : '模式', exact: true }).click();
    await composition.getByRole('button', { name: en ? 'Patterns' : '模式', exact: true }).waitFor();

    const contextLink = composition.locator('a.inkra-breadcrumb__context-link');
    await contextLink.click({ button: 'right' });
    await page.getByRole('menuitem', { name: en ? 'Use Components parent' : '使用组件上级', exact: true }).click();
    await composition.getByRole('button', { name: en ? 'Components' : '组件', exact: true }).waitFor();
    await contextLink.focus();
    await contextLink.press('Shift+F10');
    await page.getByRole('menuitem', { name: en ? 'Use Patterns parent' : '使用模式上级', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('menu').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('inkra-breadcrumb__context-link'));
    assert.equal(await contextLink.evaluate(element => document.activeElement === element), true);

    const box = await contextLink.boundingBox();
    assert(box);
    await contextLink.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: box.x + 4, clientY: box.y + 4 });
    await page.waitForTimeout(650);
    await page.getByRole('menuitem', { name: en ? 'Use Patterns parent' : '使用模式上级', exact: true }).waitFor();
    await contextLink.dispatchEvent('pointerup', { pointerType: 'touch', clientX: box.x + 4, clientY: box.y + 4 });
    await page.keyboard.press('Escape');

    for (const width of [1305, 320]) {
      await page.setViewportSize({ width, height: 820 });
      await page.goto(`${base}/docs/components/breadcrumb#preview`);
      await page.reload();
      await page.locator('.component-playground .inkra-breadcrumb').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `/tmp/inkra-breadcrumb-${locale}-${width}.png`, fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.goto(`${base}/docs/components/breadcrumb#api`);
    for (const property of ['Link', 'MenuTrigger', 'ContextLink', 'Page']) {
      const group = page.getByRole('region', { name: `Breadcrumb.${property} API`, exact: true });
      await group.waitFor();
      assert(await group.getByRole('row').count() > 1, 'each breadcrumb part documents its own properties');
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  assert.deepEqual(errors, []);
  console.log('PASS Breadcrumb links, icons, stable header geometry, menus, context actions, RTL and constrained paths');
} catch (error) {
  await page.screenshot({ path: '/tmp/inkra-breadcrumb-failure.png' });
  throw error;
} finally {
  await browser.close();
}
