import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4180').replace(/\/$/, '');
const browser = await chromium.launch();
const errors = [];

async function selectPropertyTab(page, playground, name) {
  const tab = playground.locator('.preview-controls').getByRole('tab', { name, exact: true });
  await tab.focus();
  await page.keyboard.press('Enter');
  assert.equal(await tab.getAttribute('aria-selected'), 'true');
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', forcedColors: 'active' });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(`${baseUrl}/components/upload`);
  const uploadPlayground = page.locator('.component-playground');
  await uploadPlayground.waitFor();
  const input = uploadPlayground.locator('input[type="file"]');
  assert.equal(await uploadPlayground.locator('[role="button"] input[type="file"]').count(), 0);
  assert.equal(await input.getAttribute('name'), null);
  await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not accepted') });
  await uploadPlayground.getByRole('alert').waitFor();
  assert.match(await uploadPlayground.getByRole('alert').textContent(), /notes\.txt/);

  await selectPropertyTab(page, uploadPlayground, '交互');
  await uploadPlayground.getByRole('switch', { name: '启用本页模拟传输' }).check();
  await uploadPlayground.getByRole('switch', { name: '自动上传' }).uncheck();
  await input.setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from('png') });
  const uploadButton = uploadPlayground.getByRole('button', { name: '上传', exact: true });
  await uploadButton.waitFor();
  assert.equal(await uploadPlayground.getByRole('button', { name: '重试', exact: true }).count(), 0);
  await uploadPlayground.getByRole('switch', { name: '禁用文件更改' }).check();
  assert(await uploadButton.isDisabled());
  assert(await uploadPlayground.getByRole('button', { name: '移除', exact: true }).isDisabled());
  await uploadPlayground.getByRole('switch', { name: '禁用文件更改' }).uncheck();
  await uploadButton.click();
  await uploadPlayground.getByRole('button', { name: '取消', exact: true }).click();
  assert.match(await uploadPlayground.locator('.inkra-upload__meta').textContent(), /已取消/);
  await uploadPlayground.getByRole('button', { name: '重试', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.component-playground .inkra-upload__item')?.getAttribute('data-status') === 'success');
  assert.match(await uploadPlayground.locator('.flows-examples__notice').textContent(), /无外传/);
  await uploadPlayground.getByRole('tab', { name: '代码', exact: true }).click();
  const uploadCode = await uploadPlayground.locator('.code-panel code').textContent();
  assert.match(uploadCode, /const \[files, setFiles\] = useState/);
  assert.match(uploadCode, /function simulateLocalUpload/);
  assert.match(uploadCode, /signal\.addEventListener\('abort'/);

  await page.goto(`${baseUrl}/components/steps`);
  const stepsPlayground = page.locator('.component-playground');
  await stepsPlayground.waitFor();
  const finish = stepsPlayground.getByRole('button', { name: /完成/ });
  await finish.focus();
  await page.keyboard.press('Enter');
  assert.equal(await finish.getAttribute('aria-current'), 'step');
  const disabled = stepsPlayground.getByRole('button', { name: /归档/ });
  assert(await disabled.isDisabled());
  await selectPropertyTab(page, stepsPlayground, '状态');
  await stepsPlayground.getByRole('switch', { name: '确认步骤错误' }).check();
  assert.equal(await stepsPlayground.locator('.inkra-steps__item[data-status="error"]').count(), 1);
  await selectPropertyTab(page, stepsPlayground, '布局');
  await stepsPlayground.getByRole('combobox', { name: '方向' }).click();
  await page.getByRole('option', { name: '纵向', exact: true }).click();
  assert.equal(await stepsPlayground.locator('.inkra-steps').getAttribute('data-orientation'), 'vertical');
  await stepsPlayground.getByRole('tab', { name: '代码', exact: true }).click();
  const stepsCode = await stepsPlayground.locator('.code-panel code').textContent();
  assert.match(stepsCode, /const \[current, setCurrent\] = useState/);
  assert.match(stepsCode, /const steps: StepItem\[\]/);
  assert.match(stepsCode, /onStepChange=\{\(index, step\)/);

  await page.goto(`${baseUrl}/components/timeline`);
  const timelinePlayground = page.locator('.component-playground');
  await timelinePlayground.waitFor();
  await timelinePlayground.getByRole('button', { name: '查看记录', exact: true }).nth(1).click();
  assert.match(await timelinePlayground.locator('.flows-examples__selection').textContent(), /团队评审/);
  assert.equal(await timelinePlayground.locator('time[datetime="2026-10-21"]').count(), 1);
  await selectPropertyTab(page, timelinePlayground, '内容');
  await timelinePlayground.getByRole('switch', { name: '显示描述' }).uncheck();
  assert.equal(await timelinePlayground.locator('.inkra-timeline__description').count(), 0);
  await selectPropertyTab(page, timelinePlayground, '布局');
  await timelinePlayground.getByRole('combobox', { name: '方向' }).click();
  await page.getByRole('option', { name: '横向', exact: true }).click();
  assert.equal(await timelinePlayground.locator('.inkra-timeline').getAttribute('data-orientation'), 'horizontal');
  await timelinePlayground.getByRole('tab', { name: '代码', exact: true }).click();
  const timelineCode = await timelinePlayground.locator('.code-panel code').textContent();
  assert.match(timelineCode, /const \[selectedEntry, setSelectedEntry\] = useState/);
  assert.match(timelineCode, /const timelineItems = events\.map/);
  assert.match(timelineCode, /onClick=\{\(\) => setSelectedEntry\(event\.id\)\}/);
  await timelinePlayground.getByRole('tab', { name: '预览', exact: true }).click();

  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 760 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `timeline page overflow at ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS flows: upload validation/cancel/retry, steps keyboard/disabled, timeline semantics, RTL/forced-colors/reduced-motion, responsive overflow');
} finally {
  await browser.close();
}
