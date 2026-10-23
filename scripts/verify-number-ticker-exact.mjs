import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale] of [[1305, 'zh-CN'], [390, 'en']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(language => localStorage.setItem('inkra-docs-locale', language), locale);
    await page.goto(`${base}/docs/components/number-ticker#preview`);
    const example = page.getByTestId('exact-number-examples');
    await example.scrollIntoViewIfNeeded();
    const integer = page.getByTestId('exact-integer');
    const decimal = page.getByTestId('exact-decimal');
    const value = element => element.locator('.inkra-number-ticker__value');
    const settled = async (element, expected) => {
      await page.waitForFunction(({ id, expected }) => {
        const ticker = document.querySelector(`[data-testid="${id}"]`);
        return ticker && !ticker.hasAttribute('data-animating')
          && ticker.querySelector('.inkra-number-ticker__value').textContent === expected;
      }, { id: await element.getAttribute('data-testid'), expected });
      assert.equal(await value(element).textContent(), expected);
      assert.equal(await element.locator('[aria-live]').textContent(), expected);
    };
    await settled(integer, '9007199254740993');
    await settled(decimal, '12345678901234567890.123456');
    await settled(page.getByTestId('exact-exponent'), '1.2346E1000');
    const increment = example.getByRole('button', { name: locale === 'en' ? 'Increment BigInt' : '大整数加一' });
    await increment.click();
    await settled(integer, '9007199254740994');
    assert.equal(await integer.locator('.inkra-number-ticker__delta').textContent(), '+1');
    await increment.evaluate(button => { button.click(); button.click(); button.click(); });
    await settled(integer, '9007199254740997');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await increment.click();
    await settled(integer, '9007199254740998');
    assert.equal(await integer.getAttribute('data-animating'), null);
    const input = example.getByRole('textbox', { name: locale === 'en' ? 'Decimal string' : '数字字符串' });
    await input.fill('9007199254740993.000001');
    await settled(decimal, '9007199254740993.000001');
    await input.fill('1,000');
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    await settled(decimal, '9007199254740993.000001');
    await example.getByRole('switch').click();
    await input.fill('1.234567e1000');
    await settled(decimal, '1.234567E1000');
    await input.fill('-1.234567e-1000');
    await settled(decimal, '-1.234567E-1000');
    assert.notEqual(await input.getAttribute('aria-invalid'), 'true');
    await input.fill('12345678901234567890.123456');
    await example.getByRole('switch').click();
    await settled(decimal, '12345678901234567890.123456');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    await example.screenshot({ path: `/tmp/inkra-number-ticker-exact-${width}.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS exact bigint, decimal strings, rapid updates, invalid input and reduced motion: ${width}px ${locale}`);
    await page.close();
  }
} finally {
  await browser.close();
}
