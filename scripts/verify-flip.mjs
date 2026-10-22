import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

async function rotation(locator) {
  return locator.evaluate(element => ({
    x: element.style.getPropertyValue('--inkra-tilt-rotate-x'),
    y: element.style.getPropertyValue('--inkra-tilt-rotate-y'),
  }));
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/flip#preview`);
      const stage = page.locator('.component-playground .preview-stage');
      const flip = stage.locator('.inkra-flip');
      await flip.waitFor();

      const front = flip.locator('.inkra-flip__face--front');
      const back = flip.locator('.inkra-flip__face--back');
      assert.equal(await front.getAttribute('data-active'), 'true');
      assert.equal(await back.getAttribute('inert'), '');
      assert.equal(await back.getAttribute('aria-hidden'), 'true');

      await front.getByRole('link').focus();
      await front.getByRole('button', { name: /Show back|查看背面/ }).click();
      assert.equal(await flip.getAttribute('data-flipped'), 'true');
      assert.equal(await front.getAttribute('inert'), '');
      assert.equal(await back.getAttribute('data-active'), 'true');
      assert(await back.getByRole('button').first().evaluate(element => element === document.activeElement));
      await back.getByRole('button', { name: /Show front|查看正面/ }).click();

      const tiltSwitch = page.getByRole('switch', { name: /Mouse tilt|鼠标倾斜/ });
      await tiltSwitch.click();
      const box = await flip.boundingBox();
      assert(box, 'expected Flip geometry');
      if (width === 1305) {
        await page.mouse.move(box.x + box.width - 2, box.y + 2);
        const topRight = await rotation(flip);
        assert(Number.parseFloat(topRight.x) < 0, 'top edge tilts toward the pointer');
        assert(Number.parseFloat(topRight.y) < 0, 'right edge tilts toward the pointer');
        await page.mouse.move(box.x - 30, box.y - 30);
        assert.deepEqual(await rotation(flip), { x: '0deg', y: '0deg' });
      } else {
        await flip.dispatchEvent('pointermove', { pointerType: 'touch', isPrimary: true, clientX: box.x + box.width, clientY: box.y });
        assert.deepEqual(await rotation(flip), { x: '0deg', y: '0deg' });
      }

      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await stage.screenshot({ path: `/tmp/inkra-flip-${width}.png`, animations: 'disabled' });
      console.log(`PASS Flip controlled/uncontrolled focus and Tilt pointer contract ${width}px`);
    } finally {
      await page.close();
    }
  }

  const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 900, height: 700 } });
  try {
    await reduced.goto(`${baseUrl}/components/flip#preview`);
    const flip = reduced.locator('.component-playground .inkra-flip');
    await flip.waitFor();
    const transition = await flip.locator('.inkra-flip__scene').evaluate(element => getComputedStyle(element).transitionDuration);
    assert(Number.parseFloat(transition) <= 0.00001, `reduced-motion transition is effectively zero: ${transition}`);
  } finally {
    await reduced.close();
  }

  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
