import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.logRefinementFixture.events);

async function assertLatestFloatsWithinViewport(caseNode) {
  const latest = caseNode.locator('.inkra-log__latest');
  const button = latest.getByRole('button');
  const viewport = caseNode.locator('.inkra-log__viewport');
  const latestBox = await latest.boundingBox();
  const buttonBox = await button.boundingBox();
  const viewportBox = await viewport.boundingBox();
  assert(latestBox && buttonBox && viewportBox);
  assert(buttonBox.width >= 44 && buttonBox.height >= 44 && buttonBox.width <= 64 && buttonBox.height <= 64,
    `floating action retains a compact touch target: ${JSON.stringify(buttonBox)}`);
  assert(latestBox.width <= buttonBox.width + 1 && latestBox.height <= buttonBox.height + 1,
    'latest wrapper occupies only the icon button rather than a full-width strip');
  const rtl = await viewport.evaluate(node => getComputedStyle(node).direction === 'rtl');
  const endGap = rtl ? buttonBox.x - viewportBox.x : viewportBox.x + viewportBox.width - buttonBox.x - buttonBox.width;
  const bottomGap = viewportBox.y + viewportBox.height - buttonBox.y - buttonBox.height;
  assert(endGap >= -1 && endGap <= 32 && bottomGap >= -1 && bottomGap <= 24,
    `latest floats at the viewport lower-end: ${JSON.stringify({ buttonBox, viewportBox, endGap, bottomGap, rtl })}`);
  assert(buttonBox.y >= viewportBox.y - 1, 'short viewports keep the floating hit target below the toolbar');
  assert.equal((await button.innerText()).trim(), '', 'floating latest action is icon-only');
  assert((await button.getAttribute('aria-label'))?.length > 0, 'floating action retains its accessible name');
  assert((await button.getAttribute('data-tooltip')) || (await button.getAttribute('title')),
    'icon-only action exposes its text as a tooltip');
  assert.equal(await latest.locator('.inkra-log__latest-divider').count(), 0, 'floating action has no footer divider');
}

async function assertInternalWidth(caseNode) {
  const geometry = await caseNode.locator('.inkra-log').evaluate(root => {
    const rect = selector => {
      const box = root.querySelector(selector)?.getBoundingClientRect();
      return box ? { left: box.left, right: box.right, width: box.width } : null;
    };
    return {
      root: { width: root.getBoundingClientRect().width, scrollWidth: root.scrollWidth, scrollLeft: root.scrollLeft },
      toolbar: rect('.inkra-log__toolbar'),
      frame: rect('.inkra-log__viewport-frame'),
      viewport: rect('.inkra-log__viewport'),
      latest: rect('.inkra-log__latest'),
    };
  });
  assert.equal(geometry.root.scrollLeft, 0, JSON.stringify(geometry));
  assert(geometry.root.scrollWidth <= geometry.root.width + 1, JSON.stringify(geometry));
  for (const [name, box] of Object.entries(geometry).filter(([name]) => name !== 'root')) {
    if (box) assert(box.width <= geometry.root.width + 1, `${name} stays within root: ${JSON.stringify(geometry)}`);
  }
}

async function clippingGeometry(caseNode) {
  return caseNode.locator('.inkra-log').evaluate(root => {
    const viewport = root.querySelector('.inkra-log__viewport');
    const latest = root.querySelector('.inkra-log__latest');
    const ancestors = [];
    for (let node = viewport; node && node instanceof HTMLElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      ancestors.push({
        className: node.className,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
        overflowY: style.overflowY,
        top: box.top,
        bottom: box.bottom,
      });
      if (node === root) break;
    }
    const viewportBox = viewport?.getBoundingClientRect();
    const latestBox = latest?.getBoundingClientRect();
    return {
      ancestors,
      root: { clientHeight: root.clientHeight, scrollHeight: root.scrollHeight, scrollTop: root.scrollTop },
      viewport: viewportBox ? { top: viewportBox.top, bottom: viewportBox.bottom, height: viewportBox.height } : null,
      latest: latestBox ? { top: latestBox.top, bottom: latestBox.bottom, height: latestBox.height } : null,
    };
  });
}

async function assertFocusPixels(caseNode) {
  const viewport = caseNode.locator('.inkra-log__viewport');
  await viewport.hover();
  await page.keyboard.press('Tab');
  await viewport.focus();
  const ring = caseNode.locator('.inkra-log__focus-ring');
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await ring.elementHandle());
  await ring.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width && canvas.height) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, index) => index % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Log focus ring did not paint');
  });
}

try {
  await page.goto(`${base}/docs/components/log#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'log-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/LogRefinementFixture.tsx');
    window.logRefinementFixture = mount(container);
  });

  const autoCase = page.getByTestId('auto-case');
  await autoCase.waitFor();
  const floating = page.getByTestId('floating-case');
  const floatingLog = floating.locator('.inkra-log');
  const floatingViewport = floating.locator('.inkra-log__viewport');
  for (const width of [1305, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dir of ['ltr', 'rtl']) {
      await floatingLog.evaluate((node, dir) => node.dir = dir, dir);
      await floatingViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
      await floating.locator('.inkra-log__latest button').waitFor();
      await floating.scrollIntoViewIfNeeded();
      await assertLatestFloatsWithinViewport(floating);
      const fullHeight = await floatingViewport.evaluate(node => node.clientHeight);
      assert(fullHeight >= 190, 'floating latest preserves the whole 200px no-toolbar viewport');
      assert.equal(await floatingViewport.evaluate(node => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.bottom - 20);
        return !!hit && node.contains(hit) && !hit.closest('.inkra-log__latest');
      }), true, 'log content below the floating button remains pointer accessible outside its hit target');
      const latest = floating.locator('.inkra-log__latest button');
      const expectedName = await floatingLog.getAttribute('data-paused') === 'true'
        ? 'Resume automatic following with a long action label' : 'Go to the latest record with a long action label';
      assert.equal(await latest.getAttribute('aria-label'), expectedName);
      await latest.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('[data-testid="floating-case"] .inkra-log__latest'));
      assert(await floatingViewport.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight <= 1),
        'keyboard latest action reaches the bottom');
      assert.equal(await floatingViewport.evaluate(node => document.activeElement === node), true,
        'removing latest returns focus to the log viewport');
      assert.equal(await floatingViewport.evaluate(node => node.clientHeight), fullHeight, 'latest visibility never changes viewport height');
      await floatingViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
      await floating.locator('.inkra-log__latest button').waitFor();
      await floating.screenshot({ path: `/tmp/inkra-log-floating-${width}-${dir}.png`, animations: 'disabled' });
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  const autoLog = autoCase.locator('.inkra-log');
  const autoViewport = autoCase.locator('.inkra-log__viewport');
  assert((await autoLog.boundingBox()).height >= (await autoViewport.boundingBox()).height, 'auto log grows naturally');
  assert.equal(await autoCase.locator('.inkra-log__latest').count(), 1, 'paused auto-height log exposes resume action');
  await assertLatestFloatsWithinViewport(autoCase);
  await assertInternalWidth(autoCase);

  const flexAuto = page.getByTestId('flex-auto-case');
  const flexLogBox = await flexAuto.locator('.inkra-log').boundingBox();
  const flexContainerBox = await flexAuto.boundingBox();
  assert(flexLogBox && flexContainerBox && Math.abs(flexLogBox.width - flexContainerBox.width) <= 1,
    'full-width Log does not collapse as a flex child');

  const shortLabel = page.getByTestId('short-label-case');
  const shortButtonBox = await shortLabel.locator('.inkra-log__follow-control').boundingBox();
  const shortSurfaceBox = await shortLabel.locator('.inkra-log__follow-control .inkra-button__surface').boundingBox();
  assert(shortButtonBox && shortSurfaceBox && shortButtonBox.height >= 44 && Math.abs(shortSurfaceBox.height - 36) <= 1,
    'short sm follow control keeps 44px hit with 36px visual surface');

  const bounded = page.getByTestId('bounded-case');
  const boundedLog = bounded.locator('.inkra-log');
  const boundedViewport = bounded.locator('.inkra-log__viewport');
  assert(Math.abs((await boundedLog.boundingBox()).height - 180) <= 1);
  const boundedGeometry = await clippingGeometry(bounded);
  assert(boundedGeometry.viewport?.height >= 44, `bounded viewport remains usable: ${JSON.stringify(boundedGeometry)}`);
  assert(boundedGeometry.ancestors.every(item => item.clientHeight > 0), JSON.stringify(boundedGeometry));
  assert(await boundedViewport.evaluate(node => node.scrollHeight > node.clientHeight), 'bounded record viewport scrolls');
  await boundedViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
  await page.waitForFunction(() => document.querySelector('[data-testid="bounded-case"] .inkra-log__latest'));
  const withLatest = await clippingGeometry(bounded);
  assert.equal(withLatest.viewport.height, boundedGeometry.viewport.height,
    'showing the floating action does not take a viewport row away from the log');
  await assertLatestFloatsWithinViewport(bounded);
  await assertInternalWidth(bounded);
  await assertFocusPixels(bounded);

  const pauseButton = bounded.locator('.inkra-log__follow-control');
  await pauseButton.scrollIntoViewIfNeeded();
  await pauseButton.click();
  assert.equal(await boundedLog.getAttribute('data-paused'), 'true');
  assert.deepEqual((await events()).paused, [true]);
  const latestButton = bounded.locator('.inkra-log__latest button');
  await latestButton.scrollIntoViewIfNeeded();
  await latestButton.click();
  assert.deepEqual((await events()).paused, [true, false]);
  assert.equal(await boundedLog.getAttribute('data-paused'), null);

  await boundedViewport.evaluate(node => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
  const initialCount = await bounded.locator('.inkra-log__item').count();
  await page.getByRole('button', { name: 'Append record', exact: true }).click();
  await page.waitForFunction(count => document.querySelectorAll('[data-testid="bounded-case"] .inkra-log__item').length === count + 1, initialCount);
  assert(await boundedViewport.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight <= 1), 'near-bottom append follows latest');

  const beforeAppend = await bounded.locator('.inkra-log__item').evaluateAll(nodes => nodes.map(node => node.textContent));
  await boundedViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
  await page.getByRole('button', { name: 'Append record', exact: true }).click();
  await page.waitForFunction(count => document.querySelectorAll('[data-testid="bounded-case"] .inkra-log__item').length === count + 1, beforeAppend.length);
  const afterAppend = await bounded.locator('.inkra-log__item').evaluateAll(nodes => nodes.map(node => node.textContent));
  assert.equal(afterAppend.length, beforeAppend.length + 1);
  assert(afterAppend.slice(0, beforeAppend.length).every((text, index) => text === beforeAppend[index]), 'append preserves supplied order');
  assert.equal(await boundedViewport.evaluate(node => node.scrollTop), 0, 'away-from-bottom append does not follow');

  const filters = bounded.locator('.inkra-log__filters button');
  await filters.nth(1).click();
  assert((await events()).filters.length > 0);
  assert(await bounded.locator('.inkra-log__item').count() > 0);

  const rejected = page.getByTestId('controlled-rejected-case');
  const rejectedLog = rejected.locator('.inkra-log');
  await rejected.locator('.inkra-log__follow-control').click();
  assert.deepEqual((await events()).controlledPaused, [true]);
  assert.equal(await rejectedLog.getAttribute('data-paused'), null, 'rejected controlled pause does not create local paused state');
  await rejected.locator('.inkra-log__filters button').nth(1).click();
  assert((await events()).controlledFilters.length === 1);
  assert.equal(await rejected.locator('.inkra-log__item').count(), afterAppend.length, 'rejected controlled filter leaves records visible');

  const scrollBehavior = await page.evaluate(() => {
    const viewport = document.querySelector('[data-testid="bounded-case"] .inkra-log__viewport');
    let behavior;
    const original = viewport.scrollTo.bind(viewport);
    viewport.scrollTo = options => { behavior = options.behavior; original(options); };
    viewport.focus();
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    return behavior;
  });
  assert.equal(scrollBehavior, 'auto', 'reduced motion makes End/latest scrolling immediate');

  const empty = page.getByTestId('empty-case');
  assert.equal(await empty.locator('.inkra-log__latest').count(), 0, 'latest does not cover empty state');
  assert.equal(await empty.locator('.inkra-log__empty').innerText(), 'No records yet');
  const noMatch = page.getByTestId('no-match-case');
  assert.equal(await noMatch.locator('.inkra-log__latest').count(), 0, 'latest does not cover no-match state');
  assert.equal(await noMatch.locator('.inkra-log__empty').innerText(), 'No matching records');

  const toolbar = bounded.locator('.inkra-log__toolbar');
  assert((await toolbar.boundingBox()).width <= 320 + 1);
  for (const button of await bounded.locator('.inkra-log__filters > .inkra-button').all()) {
    const textGeometry = await button.evaluate(node => {
      const source = node.querySelector('.inkra-pencil-text__source');
      const surface = node.querySelector('.inkra-button__surface');
      if (!source || !surface) return null;
      const surfaceBox = surface.getBoundingClientRect();
      const range = node.ownerDocument.createRange();
      range.selectNodeContents(source);
      return {
        surface: { left: surfaceBox.left, right: surfaceBox.right },
        textRects: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, width: rect.width })),
      };
    });
    assert(textGeometry && textGeometry.textRects.length > 0 && textGeometry.textRects.every(rect =>
      rect.left >= textGeometry.surface.left - 1 && rect.right <= textGeometry.surface.right + 1 && rect.width > 0),
    `filter label remains fully inside its own surface: ${JSON.stringify(textGeometry)}`);
  }
  const followSource = bounded.locator('.inkra-log__follow-control .inkra-pencil-text__source');
  assert.equal(await followSource.evaluate(node => getComputedStyle(node).whiteSpace), 'normal');
  const followButtonBox = await bounded.locator('.inkra-log__follow-control').boundingBox();
  const followSurfaceBox = await bounded.locator('.inkra-log__follow-control .inkra-button__surface').boundingBox();
  assert(followButtonBox && followSurfaceBox && followButtonBox.height >= 44 && followSurfaceBox.height > 36,
    'wrapped follow control grows beyond the 36px sm visual surface while retaining its hit target');
  await boundedViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll', { bubbles: true })); });
  await latestButton.scrollIntoViewIfNeeded();
  await assertLatestFloatsWithinViewport(bounded);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'narrow toolbar does not overflow page');

  const forced = await browser.newPage({ viewport: { width: 390, height: 700 }, forcedColors: 'active', reducedMotion: 'reduce' });
  try {
    await forced.goto(`${base}/docs/components/log#preview`, { waitUntil: 'networkidle' });
    await forced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      container.id = 'log-refinement-forced';
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/LogRefinementFixture.tsx');
      window.logRefinementForced = mount(container);
    });
    const forcedCase = forced.getByTestId('bounded-case');
    const forcedViewport = forcedCase.locator('.inkra-log__viewport');
    await forcedViewport.focus();
    assert.equal(await forcedCase.locator('.inkra-log__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await forcedViewport.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
  } finally {
    await forced.close();
  }

  await page.screenshot({ path: '/tmp/inkra-log-refinement-390.png', fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('PASS Log focus, floating latest icon, toolbar wrapping, follow/filter state and reduced motion');
} finally {
  await page.evaluate(() => {
    window.logRefinementFixture?.unmount();
    document.getElementById('log-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
