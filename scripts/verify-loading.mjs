import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const browser = await chromium.launch({ executablePath });

async function insideViewport(locator, page) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert(box && viewport, 'expected a measurable loading layer');
  assert(box.x >= -1 && box.y >= -1, JSON.stringify(box));
  assert(box.x + box.width <= viewport.width + 1, JSON.stringify(box));
  assert(box.y + box.height <= viewport.height + 1, JSON.stringify(box));
}

function rectanglesOverlap(a, b) {
  const inlineOverlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const blockOverlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return inlineOverlap > 1 && blockOverlap > 1;
}

async function verifySixSlotLayout({ direction, viewport }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('inkra-docs-locale', 'en');
    localStorage.setItem('inkra-docs-theme', 'light');
  });
  await page.goto(`${base}/docs/components/loading`);
  const sceneExample = page.locator('[data-scene-example]');
  await sceneExample.locator('[data-loading-preset="scene-bottom"]').click();
  const fullscreen = page.locator('.inkra-loading[data-mode="fullscreen"]');
  await fullscreen.waitFor();
  await fullscreen.evaluate((root, dir) => {
    root.setAttribute('dir', dir);
    const labels = {
      'top-start': 'Top start: preparing a very long localized workspace description without covering another control',
      'top-end': 'Top end: switch an interactive character with a deliberately long accessible name',
      center: 'Center: inspect the current loading checkpoint and open its detailed interactive status',
      'bottom-start': 'Bottom start: cancel this unusually long background synchronization operation',
      'bottom-center': 'Bottom center: pause or resume rotating loading guidance',
      'bottom-end': 'Bottom end: continue to the next unusually descriptive recovery action',
    };
    for (const [slot, label] of Object.entries(labels)) {
      let container = root.querySelector(`.inkra-loading__slot[data-slot="${slot}"]`);
      if (!container) {
        container = document.createElement('div');
        container.className = 'inkra-loading__slot';
        container.dataset.slot = slot;
        root.append(container);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.slotControl = slot;
      button.textContent = label;
      button.style.maxInlineSize = '100%';
      button.style.minBlockSize = '44px';
      button.style.whiteSpace = 'normal';
      container.replaceChildren(button);
    }
  }, direction);

  const slots = fullscreen.locator('.inkra-loading__slot');
  assert.equal(await slots.count(), 6);
  const measured = [];
  for (let index = 0; index < 6; index += 1) {
    const slot = slots.nth(index);
    assert(await slot.evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1), `slot ${index} clips its content`);
    const name = await slot.getAttribute('data-slot');
    const box = await fullscreen.locator(`[data-slot-control="${name}"]`).boundingBox();
    assert(box, `expected slot ${index} to be measurable`);
    measured.push({ box, name });
  }
  const mainBox = await fullscreen.locator('.inkra-loading__main').boundingBox();
  assert(mainBox, 'expected loading main content to be measurable');
  measured.push({ box: mainBox, name: 'main' });
  for (let left = 0; left < measured.length; left += 1) {
    for (let right = left + 1; right < measured.length; right += 1) {
      assert(!rectanglesOverlap(measured[left].box, measured[right].box), `${measured[left].name} overlaps ${measured[right].name}`);
    }
  }

  const rootBox = await fullscreen.boundingBox();
  const centerBox = await fullscreen.locator('[data-slot="center"]').boundingBox();
  assert(rootBox && centerBox);
  assert(Math.abs(centerBox.x + centerBox.width / 2 - (rootBox.x + rootBox.width / 2)) <= 1.5, 'center slot is not physically centered');
  assert(await fullscreen.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'slot layout has horizontal overflow');
  await page.screenshot({ path: `/tmp/inkra-loading-slots-${viewport.width}x${viewport.height}-${direction}.png`, animations: 'disabled', fullPage: false });
  for (const slot of ['top-start', 'top-end', 'center', 'bottom-start', 'bottom-center', 'bottom-end']) {
    const control = fullscreen.locator(`[data-slot-control="${slot}"]`);
    await control.click();
    assert(await control.evaluate(node => document.activeElement === node), `${slot} control is not reachable`);
  }
  assert.deepEqual(errors, []);
  if (await fullscreen.evaluate(node => node.scrollHeight > node.clientHeight + 1)) {
    await fullscreen.evaluate(node => { node.scrollTop = node.scrollHeight; });
    const visibleViewport = page.viewportSize();
    assert(visibleViewport);
    for (const selector of ['.inkra-loading__background', '.inkra-loading__veil']) {
      const backdropBox = await fullscreen.locator(`:scope > ${selector}`).boundingBox();
      assert(backdropBox, `${selector} is not measurable after fullscreen scroll`);
      assert(backdropBox.x <= 1 && backdropBox.y <= 1, `${selector} starts inside the viewport after scroll`);
      assert(backdropBox.x + backdropBox.width >= visibleViewport.width - 1, `${selector} does not cover viewport width after scroll`);
      assert(backdropBox.y + backdropBox.height >= visibleViewport.height - 1, `${selector} does not cover viewport height after scroll`);
    }
    await page.screenshot({ path: `/tmp/inkra-loading-slots-${viewport.width}x${viewport.height}-${direction}-bottom.png`, animations: 'disabled', fullPage: false });
  }
  await page.close();
  console.log(`PASS Loading six-slot geometry and reachability: ${viewport.width}x${viewport.height} ${direction}`);
}

try {
  for (const viewport of [{ width: 1305, height: 900 }, { width: 390, height: 720 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'en');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    await page.goto(`${base}/docs/components/loading`);
    await page.getByRole('heading', { name: 'Loading', exact: true }).waitFor();

    const playground = page.locator('[data-loading-playground]');
    const region = playground.locator('.inkra-loading[data-mode="region"]');
    await region.waitFor();
    assert.equal(await region.getAttribute('data-status'), 'loading');
    assert.equal(await region.getByRole('progressbar').getAttribute('aria-valuenow'), '48');
    await region.scrollIntoViewIfNeeded();
    await insideViewport(region, page);

    const sceneExample = page.locator('[data-scene-example]');
    const sceneTrigger = sceneExample.locator('[data-loading-preset="scene-bottom"]');
    await sceneTrigger.click();
    let fullscreen = page.locator('.inkra-loading[data-mode="fullscreen"]');
    await fullscreen.waitFor();
    assert.equal(await fullscreen.getAttribute('role'), 'dialog');
    assert.equal(await fullscreen.getAttribute('aria-modal'), 'true');
    assert(await fullscreen.evaluate(node => node.contains(document.activeElement)), 'blocking loading owns focus');
    await insideViewport(fullscreen, page);

    const beforeCharacter = await fullscreen.locator('.loading-scene').getAttribute('data-character');
    await fullscreen.getByRole('button', { name: 'Switch character' }).click();
    assert.notEqual(await fullscreen.locator('.loading-scene').getAttribute('data-character'), beforeCharacter);
    const tip = fullscreen.locator('.inkra-loading__tip');
    const beforeTip = await tip.textContent();
    await fullscreen.getByRole('button', { name: 'Next tip' }).click();
    assert.notEqual(await fullscreen.locator('.inkra-loading__tip').textContent(), beforeTip);
    await fullscreen.getByRole('button', { name: 'Cancel loading' }).click();
    await fullscreen.waitFor({ state: 'hidden' });
    assert(await sceneTrigger.evaluate(node => document.activeElement === node), 'focus returns to scene trigger');

    const edgeTrigger = sceneExample.locator('[data-loading-preset="edge"]');
    await edgeTrigger.click();
    fullscreen = page.locator('.inkra-loading[data-mode="fullscreen"]');
    await fullscreen.waitFor();
    assert.equal(await fullscreen.getAttribute('role'), 'region');
    assert.equal(await fullscreen.getByRole('status').textContent(), 'Loading');
    assert.equal(await fullscreen.getAttribute('data-blocking'), null);
    assert.equal(await fullscreen.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await fullscreen.getByRole('button', { name: 'Cancel loading' }).click();
    await fullscreen.waitFor({ state: 'hidden' });

    const simulation = page.locator('[data-simulation-example]');
    await simulation.getByTestId('start-loading-simulation').click();
    await simulation.locator('.inkra-loading').waitFor();
    await simulation.getByRole('button', { name: 'Cancel' }).click();
    await simulation.locator('.inkra-loading').waitFor({ state: 'hidden' });

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `/tmp/inkra-loading-${viewport.width}.png`, animations: 'disabled', fullPage: false });
    await page.close();
    console.log(`PASS Loading carriers, blocking, tips and responsive scene: ${viewport.width}px`);
  }

  const reduced = await browser.newPage({ viewport: { width: 390, height: 720 }, reducedMotion: 'reduce' });
  await reduced.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'en'));
  await reduced.goto(`${base}/docs/components/loading`);
  await reduced.locator('[data-scene-example] [data-loading-preset="brand-center"]').click();
  const tip = reduced.getByRole('dialog').locator('.inkra-loading__tip');
  await tip.waitFor();
  assert.equal(await tip.evaluate(node => getComputedStyle(node).animationName), 'none');
  await reduced.getByTestId('close-loading-scene').click();
  await reduced.close();
  console.log('PASS Loading reduced-motion fallback');

  await verifySixSlotLayout({ direction: 'ltr', viewport: { width: 1305, height: 900 } });
  await verifySixSlotLayout({ direction: 'rtl', viewport: { width: 390, height: 480 } });
} finally {
  await browser.close();
}
