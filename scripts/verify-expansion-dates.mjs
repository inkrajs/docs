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

async function waitForFocus(locator) {
  await locator.evaluate(async node => {
    for (let i = 0; i < 100; i++) {
      if (node === document.activeElement) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Expected focus to return after popup dismissal');
  });
}

async function setControls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
  await playground.page().waitForFunction(({ node, open }) => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(
      node.dataset.controlsPresent === String(open) && !node.querySelector('[data-playground-moving]'),
    )));
  }), { node: await playground.elementHandle(), open });
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
    await waitForFocus(dateTrigger);
    assert(await dateTrigger.evaluate(node => node === document.activeElement), 'selection closes and returns focus');
    assert.match(await dateTrigger.textContent(), /2026年10月23日|October 23, 2026/);

    const clearDate = datePlayground.getByRole('button', { name: /清空日期|Clear date/ });
    await clearDate.click();
    assert.match(await dateTrigger.textContent(), /选择日期|Choose date|Select date/);
    assert(await dateTrigger.evaluate(node => node === document.activeElement), 'clear returns focus to trigger');

    await setControls(datePlayground, true);
    await datePlayground.locator('.preview-controls').getByRole('tab', { name: /状态|States?/ }).click();
    await datePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await setControls(datePlayground, false);
    await dateTrigger.click();
    await datePage.locator('.inkra-date-picker__popover').waitFor();
    assert.equal(await datePage.locator('.inkra-date-picker__popover .rdp-day_button:not(:disabled)').count(), 0, 'readOnly disables date selection');
    await datePage.keyboard.press('Escape');
    await datePage.locator('.inkra-date-picker__popover').waitFor({ state: 'detached' });
    await setControls(datePlayground, true);
    await datePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await datePlayground.getByRole('switch', { name: /禁用|Disabled/ }).click();
    assert(await dateTrigger.isDisabled(), 'Field trigger respects disabled state');
    assert(await datePlayground.locator('.inkra-date-picker__clear').isDisabled(), 'disabled picker cannot clear');
    await verifyCurrentCodeCopy(datePage, datePlayground, [
      'const [date, setDate] = useState<Date | undefined>',
      'onValueChange={next => setDate(next instanceof Date ? next : undefined)}',
      'locale="zh-CN"',
      'size="md"',
      'clearable={true}',
      'disabled={true}',
      'readOnly={false}',
    ], ['onValueChange={setDate}']);
    await datePlayground.locator('.preview-controls').getByRole('tab', { name: /基础|Basic/ }).click();
    await datePlayground.getByRole('combobox', { name: /尺寸|Size/ }).click();
    await datePage.getByRole('option', { name: /大|Large/, exact: true }).click();
    await verifyCurrentCodeCopy(datePage, datePlayground, ['size="lg"']);
    await datePlayground.getByRole('combobox', { name: /选择模式|Selection mode/ }).click();
    await datePage.getByRole('option', { name: /日期范围|Date range/ }).click();
    await verifyCurrentCodeCopy(datePage, datePlayground, [
      'const [range, setRange] = useState<DatePickerRange | undefined>',
      'mode="range"',
      'onValueChange={next => setRange(next && !(next instanceof Date) ? next : undefined)}',
    ], ['onValueChange={setRange}']);
    await setControls(datePlayground, false);

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
    await timePage.addStyleTag({
      content: '.inkra-time-picker__popover[data-state="closed"] { animation-duration: 600ms; }',
    });
    const timePlayground = timePage.locator('.component-playground');
    const controlledTime = timePlayground.locator('input[type="time"]');
    const timeTrigger = timePlayground.locator('.inkra-time-picker__trigger');
    const popup = timePage.locator('.inkra-time-picker__popover');
    const choose = async (label, value) => {
      await popup.getByRole('group', { name: label, exact: true }).getByRole('radio', { name: value, exact: true }).check();
    };
    assert.equal(await controlledTime.inputValue(), '09:30');
    assert.equal(await controlledTime.getAttribute('aria-hidden'), 'true', 'native time input is only the form proxy');
    assert.equal(await controlledTime.evaluate(node => getComputedStyle(node).opacity), '0');
    assert.equal(await controlledTime.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await timeTrigger.click({ position: { x: 12, y: 22 } });
    await popup.waitFor();
    assert(await popup.getByRole('group', { name: '时', exact: true }).getByRole('radio', { name: '09', exact: true }).isChecked());
    assert(await popup.getByRole('group', { name: '时', exact: true }).getByRole('radio', { name: '09', exact: true }).evaluate(node => node === document.activeElement));
    assert(await popup.locator('.inkra-pencil-text[data-pencil-ready="true"]').count() > 0);
    await timePage.screenshot({ path: `/tmp/inkra-time-picker-${width}.png`, animations: 'disabled' });
    await choose('时', '10');
    await choose('分', '45');
    assert.equal(await controlledTime.inputValue(), '09:30', 'draft selection does not submit');
    await popup.getByRole('button', { name: '确定', exact: true }).click();
    await waitForInputValue(controlledTime, '10:45');
    await waitForFocus(timeTrigger);
    assert(await timeTrigger.evaluate(node => node === document.activeElement), 'apply returns focus');
    await timeTrigger.press('Enter');
    await popup.waitFor();
    await choose('时', '11');
    await timePage.keyboard.press('Escape');
    assert.equal(await controlledTime.inputValue(), '10:45', 'Escape discards draft');
    await waitForFocus(timeTrigger);
    assert(await timeTrigger.evaluate(node => node === document.activeElement));
    await timeTrigger.press('Space');
    await popup.waitFor();
    await choose('时', '12');
    await popup.getByRole('button', { name: '取消', exact: true }).click();
    assert.equal(await controlledTime.inputValue(), '10:45', 'Cancel discards draft');
    await waitForFocus(timeTrigger);
    await timePlayground.getByRole('button', { name: /清空时间|Clear time/ }).click();
    assert.equal(await controlledTime.inputValue(), '');
    assert(await timeTrigger.evaluate(node => node === document.activeElement), 'clear returns focus to visible trigger');

    await timeTrigger.click();
    await choose('时', '09');
    await choose('分', '30');
    await popup.getByRole('button', { name: '确定', exact: true }).click();

    await popup.waitFor({ state: 'detached' });
    await setControls(timePlayground, true);
    await timePlayground.locator('.preview-controls').getByRole('tab', { name: /状态|States?/ }).click();
    await timePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    assert.equal(await controlledTime.getAttribute('readonly'), '');
    assert(await timePlayground.locator('.inkra-time-picker__clear').isDisabled());
    await setControls(timePlayground, false);
    await timeTrigger.click();
    assert.equal(await popup.count(), 0, 'read-only cannot open editor');
    await setControls(timePlayground, true);
    await timePlayground.getByRole('switch', { name: /只读|Read only/ }).click();
    await timePlayground.getByRole('switch', { name: /禁用|Disabled/ }).click();
    assert(await controlledTime.isDisabled());
    assert(await timeTrigger.isDisabled());
    await verifyCurrentCodeCopy(timePage, timePlayground, [
      "const [time, setTime] = useState('09:30')", 'locale="zh-CN"', 'value={time}',
      'size="md"', 'hourCycle="h24"', 'showSeconds={false}', 'clearable={true}', 'disabled={true}',
      'readOnly={false}', 'onValueChange={(next: string) => setTime(next)}',
    ]);
    await timePlayground.locator('.preview-controls').getByRole('tab', { name: /状态|States?/ }).click();
    await timePlayground.getByRole('switch', { name: /禁用|Disabled/ }).click();
    await timePlayground.locator('.preview-controls').getByRole('tab', { name: /基础|Basic/ }).click();
    await timePlayground.getByRole('combobox', { name: /尺寸|Size/ }).click();
    await timePage.getByRole('option', { name: /小|Small/, exact: true }).click();
    await timePlayground.getByRole('switch', { name: /显示秒|Show seconds/ }).click();
    await timePlayground.getByRole('combobox', { name: /小时制|Hour cycle/ }).click();
    await timePage.getByRole('option', { name: /12 小时|12 hour/, exact: true }).click();
    await verifyCurrentCodeCopy(timePage, timePlayground, ['size="sm"', 'hourCycle="h12"', 'showSeconds={true}']);
    await setControls(timePlayground, false);
    await timeTrigger.click();
    await choose('时段', '下午');
    await choose('秒', '15');
    await popup.getByRole('button', { name: '确定', exact: true }).click();
    await waitForInputValue(controlledTime, '21:30:15');
    // Finish Radix dismissal/focus restoration before opening another picker.
    await popup.waitFor({ state: 'detached' });
    await waitForFocus(timeTrigger);
    assert.match(await timeTrigger.textContent(), /下午.*09:30:15|09:30:15.*下午/);
    assert(await timeTrigger.locator('.inkra-pencil-text').count() > 0);

    const basic = timePage.locator('.component-example').first();
    const basicRoot = basic.locator('.inkra-time-picker');
    const basicTrigger = await basicRoot.locator('.inkra-time-picker__trigger').boundingBox();
    const basicClear = await basicRoot.locator('.inkra-time-picker__clear').boundingBox();
    assert(Math.abs(basicTrigger.y + basicTrigger.height / 2 - basicClear.y - basicClear.height / 2) < 1, 'time and clear stay on one line');
    assert(basicTrigger.width > 120, 'basic example is not min-content sized');

    const limitsExample = timePage.locator('.component-example').nth(1);
    const limited = limitsExample.locator('input[type="time"]').first();
    const seconds = limitsExample.locator('input[type="time"]').nth(1);
    assert.equal(await limited.getAttribute('min'), '08:00');
    assert.equal(await limited.getAttribute('max'), '18:00');
    assert.equal(await limited.getAttribute('step'), '900');
    assert.equal(await seconds.getAttribute('step'), '1');
    await limitsExample.locator('.inkra-time-picker__trigger').first().click();
    await choose('时', '07');
    await choose('分', '45');
    assert(await popup.getByRole('button', { name: '确定', exact: true }).isDisabled());
    assert.equal(await limited.inputValue(), '09:30');
    await choose('时', '09');
    await choose('分', '37');
    assert(await popup.getByRole('button', { name: '确定', exact: true }).isDisabled(), 'step mismatch cannot apply');
    await choose('分', '45');
    await popup.getByRole('button', { name: '确定', exact: true }).click();
    await waitForInputValue(limited, '09:45');
    await popup.waitFor({ state: 'detached' });
    await waitForFocus(limitsExample.locator('.inkra-time-picker__trigger').first());
    const validity = await limited.evaluate(node => {
      const original = node.value;
      node.value = '07:45'; const underflow = node.validity.rangeUnderflow;
      node.value = '18:15'; const overflow = node.validity.rangeOverflow;
      node.value = '09:37'; const step = node.validity.stepMismatch;
      node.value = original;
      return { underflow, overflow, step };
    });
    assert.deepEqual(validity, { underflow: true, overflow: true, step: true });

    const resetExample = timePage.locator('.component-example').nth(2);
    const resetTime = resetExample.locator('input[name="meetingTime"]');
    await resetExample.locator('.inkra-time-picker__trigger').click();
    await choose('时', '12');
    await choose('分', '15');
    await popup.getByRole('button', { name: '确定', exact: true }).click();
    await waitForInputValue(resetTime, '12:15');
    await resetExample.getByRole('button', { name: /重置|Reset/ }).click();
    await waitForInputValue(resetTime, '09:30');
    assert.equal(await resetExample.locator('form').evaluate(node => new FormData(node).get('meetingTime')), '09:30');

    await timePage.evaluate(() => { document.documentElement.dir = 'rtl'; });
    assert.equal(await timeTrigger.evaluate(node => getComputedStyle(node).direction), 'rtl');
    assert(await timePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
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
