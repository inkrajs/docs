import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/typewriter#preview`);
    const preview = page.locator('.component-playground .inkra-typewriter').first();
    await preview.waitFor();
    const fullText = await preview.locator('.inkra-typewriter__accessible').textContent();
    const total = Number(await preview.getAttribute('data-total'));
    assert(total > 20);
    assert.equal(await preview.locator('.inkra-typewriter__grapheme').count() + await preview.locator('.inkra-typewriter__space').count() + await preview.locator('br').count(), total);

    await page.waitForFunction(() => Number(document.querySelector('.component-playground .inkra-typewriter')?.dataset.revealed) >= 3);
    const existing = preview.locator('.inkra-typewriter__grapheme[data-revealed="true"]').first();
    await existing.locator('canvas').waitFor({ state: 'attached' });
    await page.waitForFunction(() => document.querySelector('.component-playground .inkra-typewriter__grapheme[data-revealed="true"]')?.dataset.pencilReady === 'true');
    const pixels = await existing.locator('canvas').evaluate(node => node.toDataURL());

    const controls = page.getByRole('group', { name: '属性', exact: true });
    await controls.getByRole('tab', { name: /交互|Interaction/ }).click();
    await controls.getByRole('switch', { name: /暂停|Paused/ }).click();
    const pausedAt = await preview.getAttribute('data-revealed');
    await page.waitForTimeout(320);
    assert.equal(await preview.getAttribute('data-revealed'), pausedAt);
    assert.equal(await existing.locator('canvas').evaluate(node => node.toDataURL()), pixels, 'revealed pencil glyph remains unchanged while paused');

    await controls.getByRole('button', { name: /立即显示全文|Show all/ }).click();
    assert.equal(await preview.getAttribute('data-state'), 'complete');
    assert.equal(await preview.getAttribute('data-revealed'), String(total));
    assert.equal(await preview.locator('.inkra-typewriter__accessible').textContent(), fullText);
    assert.equal(await existing.locator('canvas').evaluate(node => node.toDataURL()), pixels, 'show-all does not repaint an existing glyph');
    assert.match(await page.locator('.typewriter-examples__status').textContent(), /书写完成|Writing complete/);

    await controls.getByRole('button', { name: /重新开始|Restart/ }).click();
    assert(Number(await preview.getAttribute('data-revealed')) <= 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await controls.getByRole('button', { name: /重新开始|Restart/ }).click();
    await page.waitForFunction(expected => document.querySelector('.component-playground .inkra-typewriter')?.dataset.revealed === expected, String(total));
    assert.equal(await preview.getAttribute('data-state'), 'complete');

    const selectedText = await preview.locator('.inkra-typewriter__visual').evaluate(node => {
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const value = selection?.toString();
      selection?.removeAllRanges();
      return value;
    });
    assert.equal(selectedText, fullText);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS Typewriter graphemes, controls, stable pencil glyphs, reduced motion and selection at ${width}px`);
  }
} finally {
  await browser.close();
}
