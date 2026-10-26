import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base);
  for (const width of [1305, 390]) {
    await page.setViewportSize({ width, height: 954 });
    for (const locale of ['zh-CN', 'en']) {
      const zh = locale === 'zh-CN';
      await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      await page.goto(`${base}/docs/components/toast#preview`);
      await page.reload();
      const playground = page.locator('.component-playground');
      await playground.waitFor();
      await setPlaygroundControls(playground, true);
      const controls = playground.locator('.preview-controls');
      await controls.getByRole('tab', { name: zh ? '布局' : 'Layout', exact: true }).click();
      const choose = async (name, option) => {
        await chooseDocsOption(controls, name, option, { exact: true, optionExact: true });
      };
      await choose(zh ? '位置' : 'Placement', zh ? '顶部居中' : 'Top center');
      await choose(zh ? '样式' : 'Appearance', zh ? '紧凑提示' : 'Compact');
      await setPlaygroundControls(playground, false);
      await playground.getByRole('button', { name: zh ? '显示通知' : 'Show notification', exact: true }).click();
      const toast = page.locator('.inkra-toast__root');
      await toast.waitFor();
      assert.equal(await toast.getAttribute('data-variant'), 'compact');
      assert.equal(await page.locator('.inkra-toast__viewport').getAttribute('data-placement'), 'top-center');
      assert((await toast.innerText()).includes(zh ? '行程已保存' : 'Itinerary saved'));
      await page.waitForTimeout(250);
      await page.screenshot({ path: `/tmp/inkra-toast-docs-${locale}-${width}.png` });
      await toast.locator('.inkra-toast__close').click();
      await toast.waitFor({ state: 'detached' });
      await playground.getByRole('tab', { name: zh ? '代码' : 'Code', exact: true }).click();
      assert.match(await playground.locator('.code-panel code').textContent(), /placement="top-center" variant="compact"/);
      assert.equal(await page.locator('.toast-position-grid button').count(), 9);
      await page.getByRole('button', { name: zh ? '同时显示两组' : 'Show two queues', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('.inkra-toast__root').length === 2);
      assert.equal(await page.locator('.inkra-toast__viewport').count(), 2);
      await page.getByRole('button', { name: zh ? '关闭全部' : 'Close all', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('.inkra-toast__root'));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  await page.goto(`${base}/docs/components/toast#api`);
  for (const name of ['variant', 'limit / limits', 'close / closeAll', 'promise']) {
    await page.getByRole('cell', { name, exact: true }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS Toast localized docs controls, nine-position grid, independent queue example, code/API and desktop/mobile screenshots');
} catch (error) {
  console.error(await page.locator('.preview-controls').innerText());
  await page.screenshot({ path: '/tmp/inkra-toast-docs-failure.png' });
  throw error;
} finally { await browser.close(); }
