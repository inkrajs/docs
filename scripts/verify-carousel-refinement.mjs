import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const events = () => page.evaluate(() => window.carouselRefinementFixture.events);
const currentLabel = carousel => carousel.locator('.inkra-carousel__slide[data-current="true"]').getAttribute('aria-label');

async function focusPixels(locator, focusSelector) {
  await locator.hover();
  await page.keyboard.press('Tab');
  await locator.focus();
  const focus = locator.locator(focusSelector);
  await page.waitForFunction(node => getComputedStyle(node).opacity === '1', await focus.elementHandle());
  await focus.evaluate(async node => {
    const canvas = node.querySelector('.inkra-pencil-surface__ink');
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width && canvas.height) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, index) => index % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Carousel focus surface did not paint');
  });
}

try {
  await page.goto(`${base}/docs/components/carousel#preview`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = document.getElementById('root');
    if (app) app.hidden = true;
    const container = document.createElement('section');
    container.id = 'carousel-refinement-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/CarouselRefinementFixture.tsx');
    window.carouselRefinementFixture = mount(container);
  });

  const responsive = page.getByTestId('responsive-case').locator('.inkra-carousel');
  await responsive.waitFor();
  const responsiveGeometry = await responsive.evaluate(root => {
    const viewport = root.querySelector('.inkra-carousel__viewport');
    const slides = [...root.querySelectorAll('.inkra-carousel__slide')];
    const first = slides[0].getBoundingClientRect();
    const second = slides[1].getBoundingClientRect();
    return {
      rootWidth: root.getBoundingClientRect().width,
      visible: getComputedStyle(viewport).getPropertyValue('--inkra-carousel-visible').trim(),
      firstWidth: first.width,
      gap: second.left - first.right,
    };
  });
  assert.equal(responsiveGeometry.visible, '2');
  assert(Math.abs(responsiveGeometry.firstWidth - (responsiveGeometry.rootWidth - 16) / 2) <= 1, JSON.stringify(responsiveGeometry));
  assert(Math.abs(responsiveGeometry.gap - 16) <= 1, JSON.stringify(responsiveGeometry));

  await focusPixels(responsive, '.inkra-carousel__focus-ring');
  const firstPage = responsive.locator('.inkra-carousel__page').first();
  await focusPixels(firstPage, '.inkra-carousel__page-focus');
  assert.equal(await firstPage.locator('.inkra-carousel__page-mark').evaluate(node => getComputedStyle(node).opacity), '1',
    'selection mark remains distinct from focus');

  const narrow = page.getByTestId('narrow-case').locator('.inkra-carousel');
  const toolbar = narrow.locator('.inkra-carousel__toolbar');
  const pagination = narrow.locator('.inkra-carousel__pagination');
  assert((await toolbar.boundingBox()).width <= 361);
  assert.equal(await pagination.evaluate(node => getComputedStyle(node).order), '3');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  const accepted = page.getByTestId('accepted-case').locator('.inkra-carousel');
  await accepted.focus();
  await accepted.press('ArrowRight');
  await page.waitForFunction(node => node.querySelector('.inkra-carousel__slide[data-current="true"]')?.getAttribute('aria-label') === 'Slide 2 of 5', await accepted.elementHandle());
  assert.deepEqual((await events()).accepted, [1]);

  const rejected = page.getByTestId('rejected-case').locator('.inkra-carousel');
  await rejected.focus();
  await rejected.press('ArrowRight');
  await page.waitForTimeout(80);
  assert.equal(await currentLabel(rejected), 'Slide 1 of 5', 'rejected controlled index rolls back');
  await rejected.press('ArrowRight');
  await page.waitForTimeout(80);
  assert.deepEqual((await events()).rejected, [1, 1], 'rejected controlled request can retry');

  const itemsCase = page.getByTestId('items-case');
  const itemsCarousel = itemsCase.locator('.inkra-carousel');
  assert.equal(await currentLabel(itemsCarousel), 'Slide 5 of 5');
  await itemsCase.getByRole('button', { name: 'Keep two slides', exact: true }).click();
  await page.waitForFunction(node => node.querySelectorAll('.inkra-carousel__slide').length === 2, await itemsCarousel.elementHandle());
  assert.equal(await currentLabel(itemsCarousel), 'Slide 2 of 2', 'items shrink clamps uncontrolled selection');
  await itemsCase.getByRole('button', { name: 'Restore five slides', exact: true }).click();
  await page.waitForFunction(node => node.querySelectorAll('.inkra-carousel__slide').length === 5, await itemsCarousel.elementHandle());

  const focusFour = responsive.getByRole('button', { name: 'Focus Four', exact: true });
  await responsive.focus();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab');
    if (await focusFour.evaluate(node => node === document.activeElement)) break;
  }
  assert(await focusFour.evaluate(node => node === document.activeElement), 'keyboard Tab reaches interactive slide content');
  await page.waitForTimeout(30);
  assert.equal(await currentLabel(responsive), 'Slide 4 of 5', 'installed Embla watchFocus scrolls a tab-focused slide into view');

  const autoplay = page.getByTestId('autoplay-case').locator('.inkra-carousel');
  await page.waitForFunction(node => node.hasAttribute('data-playing'), await autoplay.elementHandle());
  await autoplay.hover();
  await page.waitForFunction(node => !node.hasAttribute('data-playing'), await autoplay.elementHandle());
  await page.mouse.move(1, 1);
  await page.waitForFunction(node => node.hasAttribute('data-playing'), await autoplay.elementHandle());
  await autoplay.getByRole('button', { name: 'Focus Four', exact: true }).focus();
  await page.waitForFunction(node => !node.hasAttribute('data-playing'), await autoplay.elementHandle());
  await page.getByRole('button', { name: 'Outside carousel focus', exact: true }).focus();
  await page.waitForFunction(node => node.hasAttribute('data-playing'), await autoplay.elementHandle());
  const pause = autoplay.getByRole('button', { name: 'Pause autoplay', exact: true });
  await pause.click();
  assert.equal(await autoplay.getAttribute('data-playing'), null);
  await page.mouse.move(1, 1);
  assert.equal(await autoplay.getAttribute('data-playing'), null, 'explicit pause survives transient leave');

  const reduced = await browser.newPage({ viewport: { width: 390, height: 700 }, reducedMotion: 'reduce', forcedColors: 'active' });
  try {
    await reduced.goto(`${base}/docs/components/carousel#preview`, { waitUntil: 'networkidle' });
    await reduced.evaluate(async () => {
      const app = document.getElementById('root');
      if (app) app.hidden = true;
      const container = document.createElement('section');
      container.id = 'carousel-refinement-reduced';
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/CarouselRefinementFixture.tsx');
      window.carouselRefinementReduced = mount(container);
    });
    const reducedCarousel = reduced.getByTestId('reduced-case').locator('.inkra-carousel');
    assert.equal(await reducedCarousel.getAttribute('data-playing'), null);
    assert(await reducedCarousel.getByRole('button', { name: 'Play autoplay', exact: true }).isDisabled());
    await reducedCarousel.focus();
    assert.equal(await reducedCarousel.locator('.inkra-carousel__focus-ring').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await reducedCarousel.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
    const reducedPage = reducedCarousel.locator('.inkra-carousel__page').first();
    await reducedPage.focus();
    assert.equal(await reducedPage.locator('.inkra-carousel__page-focus').evaluate(node => getComputedStyle(node).display), 'none');
    assert.match(await reducedPage.evaluate(node => getComputedStyle(node).outlineStyle), /solid|auto/);
  } finally {
    await reduced.close();
  }

  await page.screenshot({ path: '/tmp/inkra-carousel-refinement.png', fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  console.log('PASS Carousel container geometry, focus, controlled retries, items, Embla focus and autoplay');
} finally {
  await page.evaluate(() => {
    window.carouselRefinementFixture?.unmount();
    document.getElementById('carousel-refinement-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.hidden = false;
  }).catch(() => {});
  await browser.close();
}
