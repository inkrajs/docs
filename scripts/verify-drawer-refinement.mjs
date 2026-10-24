import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, args: ['--disable-features=OverlayScrollbar,OverlayScrollbars'], ...(executablePath ? { executablePath } : {}) });

async function mount(page, id) {
  await page.goto(`${base}/docs/components/drawer#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async fixtureId => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = fixtureId;
    document.body.append(container);
    const fixture = await import('/scripts/fixtures/DrawerRefinementFixture.tsx');
    window.drawerRefinementFixture = fixture.mount(container);
  }, id);
}

async function assertContained(element, container, message) {
  const geometry = await element.evaluate((node, containerNode) => {
    const item = node.getBoundingClientRect();
    const owner = containerNode.getBoundingClientRect();
    return {
      item: { bottom: item.bottom, left: item.left, right: item.right, top: item.top },
      owner: { bottom: owner.bottom, left: owner.left, right: owner.right, top: owner.top },
    };
  }, await container.elementHandle());
  assert(geometry.item.left >= geometry.owner.left - 1
    && geometry.item.right <= geometry.owner.right + 1
    && geometry.item.top >= geometry.owner.top - 1
    && geometry.item.bottom <= geometry.owner.bottom + 1,
  `${message}: ${JSON.stringify(geometry)}`);
}

async function assertNotClipped(element, boundary, message) {
  const result = await element.evaluate((node, boundaryNode) => {
    const item = node.getBoundingClientRect();
    const failures = [];
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
        const clip = ancestor.getBoundingClientRect();
        if (item.left < clip.left - 1 || item.right > clip.right + 1 || item.top < clip.top - 1 || item.bottom > clip.bottom + 1) {
          failures.push({ className: ancestor.className, clip: { bottom: clip.bottom, left: clip.left, right: clip.right, top: clip.top } });
        }
      }
      if (ancestor === boundaryNode) break;
    }
    return { failures, item: { bottom: item.bottom, left: item.left, right: item.right, top: item.top } };
  }, await boundary.elementHandle());
  assert.deepEqual(result.failures, [], `${message}: ${JSON.stringify(result)}`);
}

async function waitForDrawerPaint(page, content) {
  await content.evaluate(async node => { await node.ownerDocument.fonts.ready; });
  await page.waitForFunction(node => {
    const bounds = node.getBoundingClientRect();
    const visible = item => {
      const rect = item.getBoundingClientRect();
      let left = Math.max(rect.left, bounds.left);
      let right = Math.min(rect.right, bounds.right);
      let top = Math.max(rect.top, bounds.top);
      let bottom = Math.min(rect.bottom, bounds.bottom);
      for (let parent = item.parentElement; parent && parent !== node; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const clip = parent.getBoundingClientRect();
        if (style.overflowX !== 'visible') { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
        if (style.overflowY !== 'visible') { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
      }
      return right > left && bottom > top;
    };
    const texts = [...node.querySelectorAll('.inkra-pencil-text')].filter(visible);
    const icons = [...node.querySelectorAll('.inkra-pencil-icon')].filter(visible);
    return texts.length > 0 && texts.every(text => text.getAttribute('data-pencil-ready') === 'true')
      && icons.every(icon => icon.width > 0 && icon.height > 0);
  }, await content.elementHandle());
  await page.waitForFunction(node => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(node.isConnected)))), await content.elementHandle());
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 280 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mount(page, 'drawer-refinement-fixture');
  const trigger = page.getByRole('button', { name: 'Open constrained drawer', exact: true });
  await trigger.focus();
  await trigger.press('Enter');

  const content = page.locator('.inkra-drawer__content');
  const header = content.locator('.inkra-drawer__header');
  const heading = content.locator('.inkra-drawer__heading');
  const body = content.locator('.inkra-drawer__body');
  const footer = content.locator('.inkra-drawer__footer');
  await content.waitFor();
  await content.focus();
  await content.evaluate(async node => { await node.ownerDocument.fonts.ready; });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const focusRing = content.locator(':scope > .inkra-drawer__focus-ring');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await focusRing.elementHandle());
  assert(await focusRing.evaluate(node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
  }), 'drawer focus uses a real pencil surface');
  const geometry = await content.evaluate(node => {
    const rect = selector => node.querySelector(selector).getBoundingClientRect();
    const content = node.getBoundingClientRect();
    const header = rect('.inkra-drawer__header');
    const body = rect('.inkra-drawer__body');
    const footer = rect('.inkra-drawer__footer');
    const heading = node.querySelector('.inkra-drawer__heading');
    return {
      body: { bottom: body.bottom, height: body.height, top: body.top },
      content: { bottom: content.bottom, height: content.height, top: content.top },
      footer: { bottom: footer.bottom, height: footer.height, top: footer.top },
      header: { bottom: header.bottom, height: header.height, top: header.top },
      headingClientHeight: heading.clientHeight,
      headingScrollHeight: heading.scrollHeight,
      viewportHeight: innerHeight,
    };
  });
  assert(geometry.content.top >= 0 && geometry.content.bottom <= geometry.viewportHeight, JSON.stringify(geometry));
  assert(geometry.header.height > 0 && geometry.footer.height > 0, JSON.stringify(geometry));
  assert(geometry.body.height >= 0 && geometry.header.bottom <= geometry.body.top + 1 && geometry.body.bottom <= geometry.footer.top + 1, JSON.stringify(geometry));
  assert(geometry.footer.bottom <= geometry.content.bottom + 1, `footer remains inside short drawer: ${JSON.stringify(geometry)}`);
  assert(geometry.headingScrollHeight >= geometry.headingClientHeight, 'long heading remains scrollable when constrained');
  const headerAction = header.getByRole('button', { name: 'Header action', exact: true });
  const closeButton = header.getByRole('button', { name: 'Close constrained drawer', exact: true });
  const lastBodyAction = body.getByRole('button', { name: 'Last body action', exact: true });
  const cancelButton = footer.getByRole('button', { name: 'Cancel drawer', exact: true });
  const saveButton = footer.getByRole('button', { name: 'Save drawer', exact: true });
  await assertContained(headerAction, header, 'header action is not clipped');
  await assertContained(closeButton, header, 'close action is not clipped');
  await assertContained(cancelButton, footer, 'cancel action is not clipped');
  await assertContained(saveButton, footer, 'save action is not clipped');
  await assertContained(headerAction, content, 'header action stays inside drawer');
  await assertContained(closeButton, content, 'close action stays inside drawer');
  await assertContained(cancelButton, content, 'cancel action stays inside drawer');
  await assertContained(saveButton, content, 'save action stays inside drawer');
  for (const [element, label] of [
    [headerAction, 'header action'], [closeButton, 'close action'], [cancelButton, 'cancel action'], [saveButton, 'save action'],
  ]) await assertNotClipped(element, content, `${label} is not clipped by any scroll ancestor`);
  assert(await body.evaluate(node => node.scrollHeight > node.clientHeight), 'body owns long-content scrolling');
  await headerAction.focus();
  await headerAction.press('Enter');
  assert.equal(await page.getByRole('status').textContent(), 'Header action clicked');
  await page.keyboard.press('Tab');
  assert(await closeButton.evaluate(node => node === document.activeElement), 'Tab reaches close action');
  await page.keyboard.press('Tab');
  assert(await lastBodyAction.evaluate(node => node === document.activeElement), 'Tab reaches the last action in the scrolling body');
  assert(await body.evaluate(node => node.scrollTop > 0), 'keyboard focus scrolls the body to the last action');
  await assertContained(lastBodyAction, body, 'focused last body action is revealed');
  await lastBodyAction.press('Enter');
  assert.equal(await page.getByRole('status').textContent(), 'Last body action clicked');
  await page.keyboard.press('Tab');
  assert(await cancelButton.evaluate(node => node === document.activeElement), 'Tab reaches footer cancel');
  await page.keyboard.press('Tab');
  assert(await saveButton.evaluate(node => node === document.activeElement), 'Tab reaches footer save');
  await saveButton.press('Enter');
  assert.equal(await page.getByRole('status').textContent(), 'Save clicked');
  assert.equal(await content.evaluate(node => getComputedStyle(node).animationName), 'none');
  assert.equal(await content.getAttribute('data-inkra-theme'), 'dark');
  assert.equal(await content.getAttribute('dir'), 'rtl');
  await waitForDrawerPaint(page, content);
  await page.screenshot({ path: '/tmp/inkra-drawer-refinement-390-short.png', animations: 'disabled' });

  await page.keyboard.press('Escape');
  await page.waitForFunction(node => node === document.activeElement, await trigger.elementHandle());
  await page.waitForFunction(() => !document.querySelector('.inkra-drawer__content'));
  assert.deepEqual(await page.evaluate(() => window.drawerRefinementFixture.events), { open: [true, false] });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  const noActionsTrigger = page.getByRole('button', { name: 'Open no actions drawer', exact: true });
  await noActionsTrigger.click();
  const noActionsContent = page.locator('.inkra-drawer__content');
  await noActionsContent.waitFor();
  const noActionsWidth = await noActionsContent.evaluate(node => {
    const header = node.querySelector('.inkra-drawer__header');
    const heading = node.querySelector('.inkra-drawer__heading');
    const headerStyle = getComputedStyle(header);
    return {
      actual: heading.getBoundingClientRect().width,
      expected: header.clientWidth - Number.parseFloat(headerStyle.paddingInlineStart) - Number.parseFloat(headerStyle.paddingInlineEnd),
      hasActions: header.hasAttribute('data-actions'),
    };
  });
  assert.equal(noActionsWidth.hasActions, false);
  assert(Math.abs(noActionsWidth.actual - noActionsWidth.expected) <= 1, JSON.stringify(noActionsWidth));
  await page.keyboard.press('Escape');
  await page.waitForFunction(node => node === document.activeElement, await noActionsTrigger.elementHandle());

  const closeOnlyTrigger = page.getByRole('button', { name: 'Open close only drawer', exact: true });
  await closeOnlyTrigger.click();
  const closeOnlyContent = page.locator('.inkra-drawer__content');
  await closeOnlyContent.waitFor();
  const closeOnlyHeader = closeOnlyContent.locator('.inkra-drawer__header');
  const closeOnlyButton = closeOnlyHeader.getByRole('button', { name: 'Close only drawer', exact: true });
  assert.equal(await closeOnlyHeader.getAttribute('data-custom-action'), null);
  assert.equal(await closeOnlyHeader.evaluate(node => getComputedStyle(node).flexDirection), 'row');
  await assertNotClipped(closeOnlyButton, closeOnlyContent, 'close-only action remains beside the heading without clipping');
  await page.keyboard.press('Escape');
  await page.waitForFunction(node => node === document.activeElement, await closeOnlyTrigger.elementHandle());
  assert.deepEqual(errors, []);
  await page.close();

  const desktop = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  try {
    await mount(desktop, 'drawer-refinement-desktop');
    await desktop.getByRole('button', { name: 'Open constrained drawer', exact: true }).click();
    const desktopContent = desktop.locator('.inkra-drawer__content');
    await desktopContent.waitFor();
    await waitForDrawerPaint(desktop, desktopContent);
    await desktop.screenshot({ path: '/tmp/inkra-drawer-refinement-1100.png', animations: 'disabled' });
  } finally {
    await desktop.close();
  }

  const forced = await browser.newPage({ viewport: { width: 390, height: 280 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await mount(forced, 'drawer-refinement-forced');
    const forcedTrigger = forced.getByRole('button', { name: 'Open constrained drawer', exact: true });
    await forcedTrigger.focus();
    await forcedTrigger.press('Enter');
    const forcedContent = forced.locator('.inkra-drawer__content');
    await forcedContent.waitFor();
    await forcedContent.focus();
    assert.equal(await forcedContent.locator(':scope > .inkra-drawer__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedContent.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    assert(Number.parseFloat(await forcedContent.evaluate(node => getComputedStyle(node).outlineOffset)) <= 0);
    assert.match(await forcedContent.evaluate(node => getComputedStyle(node).borderRightStyle), /solid/);
  } finally {
    await forced.close();
  }

  console.log('PASS Drawer long heading/actions, short-height body/footer, pencil focus, theme, RTL, Escape, reduced motion and forced colors');
} finally {
  await browser.close();
}
