import assert from 'node:assert/strict';

export async function verifyRollingTicker(browser, base) {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/number-ticker#preview`);
    const example = page.getByTestId('rolling-example');
    await example.scrollIntoViewIfNeeded();
    await example.getByRole('button', { name: '\u00d7 100', exact: true }).click();
    await page.waitForFunction(() => {
      const ticker = document.querySelector('[data-testid="rolling-number"]');
      return ticker && !ticker.hasAttribute('data-animating') && ticker.querySelector('[aria-live]').textContent.includes('1,200');
    });
    await example.screenshot({ path: `/tmp/inkra-number-ticker-roll-example-${width}.png` });

    await page.evaluate(async () => {
      document.getElementById('root').hidden = true;
      const container = document.createElement('div');
      document.body.append(container);
      const { mount } = await import('/scripts/fixtures/NumberTickerRollingFixture.tsx');
      window.rollingFixture = mount(container);
      window.scrollTo(0, 0);
    });
    const ticker = page.getByTestId('ticker-fixture');
    const set = props => page.evaluate(props => window.rollingFixture.update(props), props);
    const settled = async expected => {
      await page.waitForFunction(expected => {
        const ticker = document.querySelector('[data-testid="ticker-fixture"]');
        return ticker && !ticker.hasAttribute('data-animating') && ticker.querySelector('.inkra-number-ticker__value').textContent === expected;
      }, expected);
      assert.equal(await ticker.locator('[data-face="from"]').count(), 0);
    };
    await settled('12');
    await page.evaluate(() => document.fonts.ready);
    await set({ value: 1.1, formatOptions: { maximumFractionDigits: 0 } });
    await settled('1');
    await set({ value: 1.2, formatOptions: { maximumFractionDigits: 0 }, duration: 10000 });
    await page.waitForTimeout(50);
    assert.equal(await ticker.getAttribute('data-animating'), null, 'unchanged formatted digits do not animate');
    await set({ value: 12 });
    await settled('12');
    const height = (await ticker.boundingBox()).height;
    await set({ value: 1200, duration: 1200 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ticker-fixture"]')?.hasAttribute('data-animating'));
    await page.waitForTimeout(160);
    const faces = await ticker.locator('[data-face="to"]').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).transform));
    assert(faces.some(transform => transform !== 'none' && !transform.endsWith(', 0, 0)')), 'actual digit translation');
    assert.equal(await ticker.locator('[aria-live]').textContent(), '12', 'no intermediate announcements');
    assert.equal(await ticker.locator('[data-place="integer-3"]').count(), 1);
    assert(Math.abs((await ticker.boundingBox()).height - height) <= 1, 'stable line height');
    await page.screenshot({ path: `/tmp/inkra-number-ticker-roll-moving-${width}.png`, clip: { x: 0, y: 0, width: Math.min(width, 400), height: 120 }, animations: 'allow' });
    await settled('1,200');
    for (const [value, expected] of [[999, '999'], [1000, '1,000'], [9, '9'], [0, '0'], [-12.34, '-12.34'], [1234, '1,234'], [0.01, '0.01']]) {
      await set({ value });
      await settled(expected);
      assert.equal(await ticker.locator('[aria-live]').textContent(), expected);
      assert(Math.abs((await ticker.boundingBox()).height - height) <= 1);
    }
    await set({ value: 100, rollDirection: 'down' });
    await page.waitForFunction(() => document.querySelector('[data-testid="ticker-fixture"] .inkra-number-ticker__reels')?.dataset.direction === 'down');
    await settled('100');
    await set({ value: 1 });
    await page.waitForTimeout(70);
    await set({ value: 100000 });
    await page.waitForTimeout(70);
    await set({ value: -2.5 });
    await settled('-2.5');
    await set({ value: 100000, duration: 0 });
    await settled('100,000');
    await set({ value: 7, animate: false });
    await settled('7');
    await set({ value: '9007199254740993' });
    await settled('9,007,199,254,740,993');
    await set({ value: '9007199254740994' });
    await settled('9,007,199,254,740,994');
    for (const locale of ['zh-CN', 'en', 'ja', 'ko', 'fr', 'ar-EG']) {
      await set({ value: -1234.56, locale, formatOptions: { style: 'currency', currency: 'EUR' }, dir: locale === 'ar-EG' ? 'rtl' : 'ltr' });
      await settled(new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(-1234.56));
      await set({ value: 123456, locale, formatOptions: { style: 'currency', currency: 'EUR' } });
      await settled(new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(123456));
    }
    await set({ value: 999, compact: 'en' });
    await settled('999');
    await set({ value: 1000, compact: 'en' });
    await settled('1 K');
    for (const value of [-120000.12, 0, -9]) {
      const formatOptions = { style: 'currency', currency: 'USD', currencySign: 'accounting' };
      await set({ value, locale: 'fr', formatOptions });
      await settled(new Intl.NumberFormat('fr', formatOptions).format(value));
    }
    await set({ value: '1e200' });
    await settled(new Intl.NumberFormat('en-US').format(BigInt('1' + '0'.repeat(200))));
    assert.equal(await ticker.locator('.inkra-number-ticker__reels').count(), 0);
    await set({ value: '12' });
    await settled('12');
    assert.equal(await ticker.getAttribute('data-animating'), null, 'oversized previous value settles without thousands of reels');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await set({ value: 123.45 });
    await settled('123.45');
    assert.equal(await ticker.getAttribute('data-animating'), null);
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await set({ value: -123.45 });
    await settled('-123.45');
    await ticker.screenshot({ path: `/tmp/inkra-number-ticker-roll-forced-${width}.png` });
    await page.evaluate(() => window.rollingFixture.unmount());
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS rolling digits, x100, carry, shrink, direction, rapid updates, precision, locales, motion: ${width}px`);
  }
}
