import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const baseUrl = process.env.BASE_URL || process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];

async function openDocs(page, route, heading) {
  page.on('pageerror', error => errors.push(`${route}: ${error.message}`));
  await page.goto(`${baseUrl}/components/${route}#preview`);
  await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  await page.locator('.component-playground').waitFor();
}

async function waitForInputValue(locator, expected) {
  await locator.page().waitForFunction(
    ({ node, value }) => node.value === value,
    { node: await locator.elementHandle(), value: expected },
  );
}

async function verifyCurrentCodeCopy(page, playground, expectedFragments, forbiddenFragments = []) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseUrl).origin });
  await playground.getByRole('tab', { name: /代码|Code/ }).click();
  const currentCode = await playground.locator('.code-panel code').textContent();
  for (const fragment of expectedFragments) assert(currentCode.includes(fragment), `current code includes ${fragment}`);
  for (const fragment of forbiddenFragments) assert(!currentCode.includes(fragment), `current code excludes ${fragment}`);
  await playground.getByRole('button', { name: /复制代码|Copy code/ }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), currentCode, 'copied code matches current playground parameters');
  await playground.getByRole('tab', { name: /预览|Preview/ }).click();
}

try {
  for (const width of [1280, 390]) {
    const datePage = await browser.newPage({ viewport: { width, height: 900 } });
    await openDocs(datePage, 'date-picker', 'DatePicker');
    const datePlayground = datePage.locator('.component-playground');
    const dateTrigger = datePlayground.locator('.inkra-date-picker__trigger');
    await dateTrigger.focus();
    await dateTrigger.press('Enter');
    const selectedDay = datePage.locator('.inkra-date-picker__popover .rdp-selected .rdp-day_button');
    await selectedDay.waitFor();
    assert(await selectedDay.evaluate(node => node === document.activeElement), 'opening focuses the selected date');
    await selectedDay.press('ArrowRight');
    await datePage.locator('.inkra-date-picker__popover .rdp-day_button:focus').press('Enter');
    assert(await dateTrigger.evaluate(node => node === document.activeElement), 'selection closes and returns focus');
    assert.match(await datePlayground.locator('.dates-examples__status').textContent(), /^2026-10-2[3-9]$/);

    const clearDate = datePlayground.getByRole('button', { name: /清空日期|Clear date/ });
    await clearDate.click();
    assert.match(await datePlayground.locator('.dates-examples__status').textContent(), /未选择|No selection/);
    assert(await dateTrigger.evaluate(node => node === document.activeElement), 'clear returns focus to trigger');

    await datePlayground.locator('.preview-controls').getByRole('tab', { name: /状态|States?/ }).click();
    await datePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await dateTrigger.click();
    await datePage.locator('.inkra-date-picker__popover').waitFor();
    assert.equal(await datePage.locator('.inkra-date-picker__popover .rdp-day_button:not(:disabled)').count(), 0, 'readOnly disables date selection');
    await datePage.keyboard.press('Escape');
    await datePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await datePlayground.getByRole('switch', { name: /禁用|Disabled/ }).click();
    assert(await dateTrigger.isDisabled(), 'Field trigger respects disabled state');
    assert(await datePlayground.locator('.inkra-date-picker__clear').isDisabled(), 'disabled picker cannot clear');
    await verifyCurrentCodeCopy(datePage, datePlayground, [
      'const [date, setDate] = useState<Date | undefined>',
      'onValueChange={next => setDate(next instanceof Date ? next : undefined)}',
      'locale="zh-CN"',
      'clearable={true}',
      'disabled={true}',
      'readOnly={false}',
    ], ['onValueChange={setDate}']);
    await datePlayground.locator('.preview-controls').getByRole('tab', { name: /基础|Basic/ }).click();
    await datePlayground.getByRole('combobox', { name: /选择模式|Selection mode/ }).click();
    await datePage.getByRole('option', { name: /日期范围|Date range/ }).click();
    await verifyCurrentCodeCopy(datePage, datePlayground, [
      'const [range, setRange] = useState<DatePickerRange | undefined>',
      'mode="range"',
      'onValueChange={next => setRange(next && !(next instanceof Date) ? next : undefined)}',
    ], ['onValueChange={setRange}']);

    const formExample = datePage.locator('.component-example').nth(1);
    const form = formExample.locator('form');
    const departure = form.locator('input[name="departure"]');
    assert.equal(await departure.inputValue(), '2026-10-22');
    const departurePicker = form.locator('.inkra-date-picker').first();
    await departurePicker.locator('.inkra-date-picker__clear').click();
    assert.equal(await departure.inputValue(), '');
    assert.equal(await form.evaluate(node => node.checkValidity()), false, 'required DatePicker participates in native validation');
    await form.evaluate(node => node.reportValidity());
    assert(await departurePicker.locator('.inkra-date-picker__trigger').evaluate(node => node === document.activeElement), 'invalid required DatePicker focuses its trigger');
    await form.getByRole('button', { name: /重置|Reset/ }).click();
    await waitForInputValue(departure, '2026-10-22');
    assert.equal(await form.evaluate(node => new FormData(node).get('departure')), '2026-10-22');
    assert.equal(await form.evaluate(node => new FormData(node).get('stayStart')), '2026-10-22');
    assert.equal(await form.evaluate(node => new FormData(node).get('stayEnd')), '2026-10-25');

    await datePage.evaluate(() => { document.documentElement.dir = 'rtl'; });
    assert.equal(await dateTrigger.evaluate(node => getComputedStyle(node).direction), 'rtl');
    assert(await datePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'DatePicker page has no horizontal overflow');
    await datePage.close();

    const timePage = await browser.newPage({ viewport: { width, height: 900 } });
    await openDocs(timePage, 'time-picker', 'TimePicker');
    const timePlayground = timePage.locator('.component-playground');
    const controlledTime = timePlayground.locator('input[type="time"]');
    assert.equal(await controlledTime.inputValue(), '09:30');
    await controlledTime.fill('10:45');
    assert.equal(await timePlayground.locator('.dates-examples__status').textContent(), '10:45');
    await timePlayground.getByRole('button', { name: /清空时间|Clear time/ }).click();
    assert.equal(await controlledTime.inputValue(), '');
    assert(await controlledTime.evaluate(node => node === document.activeElement), 'time clear returns focus');
    await controlledTime.fill('09:30');

    await timePlayground.locator('.preview-controls').getByRole('tab', { name: /状态|States?/ }).click();
    await timePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    assert.equal(await controlledTime.getAttribute('readonly'), '');
    assert(await timePlayground.locator('.inkra-time-picker__clear').isDisabled(), 'readOnly inherited state disables clear');
    await timePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await timePlayground.getByRole('switch', { name: /禁用|Disabled/ }).click();
    assert(await controlledTime.isDisabled());
    assert(await timePlayground.locator('.inkra-time-picker__clear').isDisabled(), 'disabled inherited state disables clear');
    await verifyCurrentCodeCopy(timePage, timePlayground, [
      "const [time, setTime] = useState('09:30')",
      'locale="zh-CN"',
      'value={time}',
      'hourCycle="h24"',
      'showSeconds={false}',
      'clearable={true}',
      'disabled={true}',
      'readOnly={false}',
      'onValueChange={(next: string) => setTime(next)}',
    ], ['value="09:30"', 'onValueChange={setValue}']);
    await timePlayground.locator('.preview-controls').getByRole('tab', { name: /基础|Basic/ }).click();
    await timePlayground.getByRole('switch', { name: /显示秒|Show seconds/ }).click();
    await timePlayground.getByRole('switch', { name: /可清空|Clearable/ }).click();
    await verifyCurrentCodeCopy(timePage, timePlayground, [
      "const [time, setTime] = useState('09:30:00')",
      'showSeconds={true}',
      'clearable={false}',
    ]);

    const limitsExample = timePage.locator('.component-example').nth(1);
    const limited = limitsExample.locator('input[type="time"]').first();
    const seconds = limitsExample.locator('input[type="time"]').nth(1);
    assert.equal(await limited.getAttribute('min'), '08:00');
    assert.equal(await limited.getAttribute('max'), '18:00');
    assert.equal(await limited.getAttribute('step'), '900');
    assert.equal(await seconds.getAttribute('step'), '1');
    await limited.fill('07:45');
    assert(await limited.evaluate(node => node.validity.rangeUnderflow), 'native min validation remains active');
    await limited.fill('18:15');
    assert(await limited.evaluate(node => node.validity.rangeOverflow), 'native max validation remains active');
    await limited.fill('09:37');
    assert(await limited.evaluate(node => node.validity.stepMismatch), 'native step validation remains active');

    const resetExample = timePage.locator('.component-example').nth(2);
    const resetTime = resetExample.locator('input[name="meetingTime"]');
    await resetTime.fill('12:15');
    await resetExample.getByRole('button', { name: /重置|Reset/ }).click();
    await waitForInputValue(resetTime, '09:30');
    assert.equal(await resetExample.locator('form').evaluate(node => new FormData(node).get('meetingTime')), '09:30');

    await timePage.evaluate(() => { document.documentElement.dir = 'rtl'; });
    assert.equal(await controlledTime.evaluate(node => getComputedStyle(node.closest('.inkra-input-root')).direction), 'rtl');
    assert(await timePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'TimePicker page has no horizontal overflow');
    await timePage.close();
    console.log(`PASS dates expansion keyboard, focus, forms, reset, native limits, inherited state and responsive layout at ${width}px`);
  }

  const forced = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await forced.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await openDocs(forced, 'date-picker', 'DatePicker');
  assert(await forced.locator('.inkra-date-picker__trigger').first().isVisible());
  assert(await forced.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await forced.close();
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
