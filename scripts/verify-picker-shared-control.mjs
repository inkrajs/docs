import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const baseUrl = process.env.INKRA_DOCS_URL || process.env.BASE_URL || 'http://127.0.0.1:4180';
const errors = [];
const expectedHeights = { sm: 36, md: 44, lg: 48 };

async function waitForInputValue(input, expected) {
  await input.page().waitForFunction(
    ({ node, value }) => node.value === value,
    { node: await input.elementHandle(), value: expected },
  );
}

async function waitForFocus(locator) {
  await locator.page().waitForFunction(node => node === document.activeElement, await locator.elementHandle());
}

async function assertSharedControl(root, picker, expectedLabel) {
  const control = root.locator(`.inkra-${picker}-picker__control`);
  const trigger = root.locator(`.inkra-${picker}-picker__trigger`);
  const clear = root.locator(`.inkra-${picker}-picker__clear`);
  await control.waitFor();
  assert.equal(await control.getAttribute('role'), 'group');
  assert.equal(await control.getAttribute('aria-label'), expectedLabel);
  assert.equal(await control.locator(':scope > button').count(), 2, 'trigger and clear are sibling native buttons');
  assert.equal(await root.locator('button button').count(), 0, 'buttons are never nested');
  assert(await control.evaluate((node, { triggerClass, clearClass }) => {
    const buttons = Array.from(node.children).filter(child => child.tagName === 'BUTTON');
    return buttons[0]?.classList.contains(triggerClass) && buttons[1]?.classList.contains(clearClass);
  }, {
    triggerClass: `inkra-${picker}-picker__trigger`,
    clearClass: `inkra-${picker}-picker__clear`,
  }), 'clear follows the trigger in logical DOM order');
  const visibleChildBorders = await control.locator(':scope > button .inkra-button__surface > .inkra-pencil-surface__border')
    .evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
  assert.equal(visibleChildBorders, 0, 'child buttons do not draw a second outline');
  const visibleDividers = await control.locator('.inkra-button-group__divider')
    .evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
  assert.equal(visibleDividers, 1, 'shared control draws one internal divider');
  await control.evaluate(async node => {
    const canvas = node.querySelector(':scope > .inkra-pencil-surface__ink');
    for (let index = 0; index < 100; index += 1) {
      if (canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        if (pixels?.some((channel, pixelIndex) => pixelIndex % 4 === 3 && channel > 0)) return;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('Shared picker outline did not render visible pixels');
  });
  const controlBox = await control.boundingBox();
  const triggerBox = await trigger.boundingBox();
  const clearBox = await clear.boundingBox();
  assert(controlBox && triggerBox && clearBox);
  assert(triggerBox.x >= controlBox.x - 0.5 && clearBox.x >= controlBox.x - 0.5);
  assert(triggerBox.x + triggerBox.width <= controlBox.x + controlBox.width + 0.5);
  assert(clearBox.x + clearBox.width <= controlBox.x + controlBox.width + 0.5);
  return { control, trigger, clear, controlBox, triggerBox, clearBox };
}

async function closePopup(page, popup) {
  await page.keyboard.press('Escape');
  await popup.waitFor({ state: 'detached' });
}

try {
  for (const width of [1000, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width === 390 });
    page.on('pageerror', error => errors.push(`${width}px: ${error.message}`));
    await page.goto(`${baseUrl}/docs/components/date-picker#preview`);
    const fixturePath = new URL('./fixtures/picker-shared-control.tsx', import.meta.url).pathname;
    await page.evaluate(async path => (await import(`/@fs${path}`)).mountPickerSharedControlFixture(), fixturePath);
    const scope = page.locator('#picker-shared-control-fixture');
    await scope.waitFor();

    for (const [size, expectedHeight] of Object.entries(expectedHeights)) {
      for (const picker of ['date', 'time']) {
        const root = scope.getByTestId(`${picker}-${size}`);
        const result = await assertSharedControl(root, picker, picker === 'date' ? 'Choose date' : 'Choose time');
        assert(Math.abs(result.controlBox.height - expectedHeight) <= 0.5,
          `${picker} ${size} shared outline is ${expectedHeight}px`);
        const expectedHit = Math.max(44, expectedHeight);
        assert(result.triggerBox.height >= expectedHit - 0.5, `${picker} ${size} trigger keeps its hit target`);
        assert(result.clearBox.height >= expectedHit - 0.5, `${picker} ${size} clear keeps its hit target`);
      }
    }

    const dateEn = scope.getByTestId('date-en');
    const dateZh = scope.getByTestId('date-zh');
    const timeEn = scope.getByTestId('time-en');
    const timeZh = scope.getByTestId('time-zh');
    const dateEnControl = await assertSharedControl(dateEn, 'date', 'Choose date');
    const dateZhControl = await assertSharedControl(dateZh, 'date', '选择日期');
    const timeEnControl = await assertSharedControl(timeEn, 'time', 'Choose time');
    const timeZhControl = await assertSharedControl(timeZh, 'time', '选择时间');
    assert(Math.abs(dateEnControl.controlBox.height - dateZhControl.controlBox.height) <= 0.5,
      'DatePicker keeps the same geometry across locales');
    assert(Math.abs(timeEnControl.controlBox.height - timeZhControl.controlBox.height) <= 0.5,
      'TimePicker keeps the same geometry across locales');
    assert(await dateEn.getByRole('button', { name: 'Clear date', exact: true }).isVisible());
    assert(await dateZh.getByRole('button', { name: '清空日期', exact: true }).isVisible());
    assert(await timeEn.getByRole('button', { name: 'Clear time', exact: true }).isVisible());
    assert(await timeZh.getByRole('button', { name: '清空时间', exact: true }).isVisible());

    await dateEn.locator('.inkra-date-picker__trigger').click();
    let datePopup = page.locator('.inkra-date-picker__popover');
    await datePopup.waitFor();
    assert.equal(await datePopup.getAttribute('aria-label'), 'Choose date');
    assert(await datePopup.getByRole('button', { name: 'Previous month', exact: true }).isVisible());
    assert(await datePopup.getByRole('button', { name: 'Next month', exact: true }).isVisible());
    await closePopup(page, datePopup);
    await dateZh.locator('.inkra-date-picker__trigger').click();
    datePopup = page.locator('.inkra-date-picker__popover');
    await datePopup.waitFor();
    assert.equal(await datePopup.getAttribute('aria-label'), '选择日期');
    assert(await datePopup.getByRole('button', { name: '上个月', exact: true }).isVisible());
    assert(await datePopup.getByRole('button', { name: '下个月', exact: true }).isVisible());
    await closePopup(page, datePopup);

    await timeEn.locator('.inkra-time-picker__trigger').click();
    let timePopup = page.locator('.inkra-time-picker__popover');
    await timePopup.waitFor();
    assert(await timePopup.getByRole('group', { name: 'Hour', exact: true }).isVisible());
    assert(await timePopup.getByRole('group', { name: 'Minute', exact: true }).isVisible());
    assert(await timePopup.getByRole('button', { name: 'Cancel', exact: true }).isVisible());
    assert(await timePopup.getByRole('button', { name: 'Apply', exact: true }).isVisible());
    await closePopup(page, timePopup);
    await timeZh.locator('.inkra-time-picker__trigger').click();
    timePopup = page.locator('.inkra-time-picker__popover');
    await timePopup.waitFor();
    assert(await timePopup.getByRole('group', { name: '时', exact: true }).isVisible());
    assert(await timePopup.getByRole('group', { name: '分', exact: true }).isVisible());
    assert(await timePopup.getByRole('button', { name: '取消', exact: true }).isVisible());
    assert(await timePopup.getByRole('button', { name: '确定', exact: true }).isVisible());
    await closePopup(page, timePopup);

    for (const [root, picker, clearName] of [
      [dateEn, 'date', 'Clear date'],
      [timeEn, 'time', 'Clear time'],
    ]) {
      const trigger = root.locator(`.inkra-${picker}-picker__trigger`);
      const clear = root.getByRole('button', { name: clearName, exact: true });
      await trigger.click();
      const popup = page.locator(`.inkra-${picker}-picker__popover`);
      await popup.waitFor();
      await clear.click();
      await popup.waitFor({ state: 'detached' });
      await waitForFocus(trigger);
      assert.equal(await page.locator(`.inkra-${picker}-picker__popover`).count(), 0, 'clear does not reopen the popup');
    }

    const dateDisabled = scope.getByTestId('date-disabled');
    assert(await dateDisabled.locator('.inkra-date-picker__trigger').isDisabled());
    assert(await dateDisabled.locator('.inkra-date-picker__clear').isDisabled());
    await dateDisabled.locator('.inkra-date-picker__trigger').evaluate(node => node.click());
    assert.equal(await page.locator('.inkra-date-picker__popover').count(), 0, 'disabled date does not open');
    const dateReadOnly = scope.getByTestId('date-readonly');
    assert(await dateReadOnly.locator('.inkra-date-picker__clear').isDisabled());
    await dateReadOnly.locator('.inkra-date-picker__trigger').click();
    datePopup = page.locator('.inkra-date-picker__popover');
    await datePopup.waitFor();
    assert.equal(await datePopup.locator('.rdp-day_button:not(:disabled)').count(), 0, 'read-only dates can be reviewed but not changed');
    await closePopup(page, datePopup);
    const timeDisabled = scope.getByTestId('time-disabled');
    assert(await timeDisabled.locator('.inkra-time-picker__trigger').isDisabled());
    assert(await timeDisabled.locator('.inkra-time-picker__clear').isDisabled());
    await timeDisabled.locator('.inkra-time-picker__trigger').evaluate(node => node.click());
    assert.equal(await page.locator('.inkra-time-picker__popover').count(), 0, 'disabled time does not open');
    const timeReadOnly = scope.getByTestId('time-readonly');
    assert(await timeReadOnly.locator('.inkra-time-picker__clear').isDisabled());
    await timeReadOnly.locator('.inkra-time-picker__trigger').click();
    assert.equal(await page.locator('.inkra-time-picker__popover').count(), 0, 'read-only time does not open an editor');

    for (const picker of ['date', 'time']) {
      const ltr = await assertSharedControl(scope.getByTestId(`${picker}-md`), picker, picker === 'date' ? 'Choose date' : 'Choose time');
      const rtl = await assertSharedControl(scope.getByTestId(`${picker}-rtl`), picker, picker === 'date' ? 'Choose date' : 'Choose time');
      assert.equal(await rtl.control.evaluate(node => getComputedStyle(node).direction), 'rtl');
      assert(ltr.clearBox.x >= ltr.triggerBox.x + ltr.triggerBox.width - 0.5, `${picker} clear is at LTR inline-end`);
      assert(rtl.clearBox.x + rtl.clearBox.width <= rtl.triggerBox.x + 0.5, `${picker} clear is at RTL inline-end`);
    }

    const dateForm = scope.getByTestId('date-reset-form');
    const departure = dateForm.locator('input[name="departure"]');
    const dateResetTrigger = dateForm.locator('.inkra-date-picker__trigger');
    await dateForm.getByRole('button', { name: 'Clear date', exact: true }).click();
    await waitForInputValue(departure, '');
    await dateForm.getByRole('button', { name: 'Reset date', exact: true }).click();
    await waitForInputValue(departure, '2026-10-22');
    assert.match(await dateResetTrigger.textContent(), /Oct 22, 2026/);
    assert.equal(await dateForm.evaluate(node => new FormData(node).get('departure')), '2026-10-22');

    const timeForm = scope.getByTestId('time-reset-form');
    const meetingTime = timeForm.locator('input[name="meetingTime"]');
    await timeForm.getByRole('button', { name: 'Clear time', exact: true }).click();
    await waitForInputValue(meetingTime, '');
    await timeForm.getByRole('button', { name: 'Reset time', exact: true }).click();
    await waitForInputValue(meetingTime, '09:30');
    assert.equal(await timeForm.evaluate(node => new FormData(node).get('meetingTime')), '09:30');

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'fixture does not create page overflow');
    await page.screenshot({ path: `/tmp/inkra-picker-shared-control-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.close();
    console.log(`PASS shared DatePicker/TimePicker outline, sizes, locale, clear, state, RTL and reset at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
