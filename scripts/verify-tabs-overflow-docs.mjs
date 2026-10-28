import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: 'reduce' });
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  await page.goto(base);
  for (const width of [1305, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const locale of ['zh-CN', 'en']) {
      const zh = locale === 'zh-CN';
      await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      await page.goto(`${base}/docs/components/tabs#preview`);
      await page.reload();
      const playground = page.locator('.component-playground');
      const demo = playground.locator('.tabs-demo');
      await demo.waitFor();
      assert.equal(await demo.locator('.inkra-tabs__overflow').count(), 0, 'default has no auxiliary interaction');
      const chooseMode = async option => {
        await setPlaygroundControls(playground, true);
        const controls = playground.locator('.preview-controls');
        await controls.getByRole('tab', { name: zh ? '交互' : 'Interaction', exact: true }).click();
        await controls.getByRole('switch', { name: zh ? '更多标签' : 'More tabs', exact: true }).check();
        await chooseDocsOption(controls, zh ? '溢出交互' : 'Overflow', option, { exact: true, optionExact: true });
        await chooseDocsOption(controls, zh ? '容器宽度' : 'Container width', '240 px', { exact: true, optionExact: true });
        await setPlaygroundControls(playground, false);
      };
      await chooseMode(zh ? '更多菜单' : 'More menu');
      await demo.getByRole('button', { name: zh ? '更多标签' : 'More tabs', exact: true }).click();
      await page.getByRole('menuitemradio', { name: zh ? '历史记录' : 'History', exact: true }).waitFor();
      await page.screenshot({ path: `/tmp/inkra-tabs-menu-${locale}-${width}.png` });
      await page.getByRole('menuitemradio', { name: zh ? '历史记录' : 'History', exact: true }).click();
      await page.waitForTimeout(150);
      assert.equal(await demo.getByRole('tab', { name: zh ? '历史记录' : 'History', exact: true }).getAttribute('aria-selected'), 'true');
      await chooseMode(zh ? '两侧按钮' : 'Scroll buttons');
      const prev = demo.getByRole('button', { name: zh ? '向前滚动标签' : 'Scroll to previous tabs', exact: true });
      await prev.click();
      await page.waitForTimeout(150);
      assert.equal(await demo.getByRole('tab', { name: zh ? '历史记录' : 'History', exact: true }).getAttribute('aria-selected'), 'true');
      await page.screenshot({ path: `/tmp/inkra-tabs-buttons-${locale}-${width}.png` });
      await playground.getByRole('tab', { name: zh ? '代码' : 'Code', exact: true }).click();
      assert.match(await playground.locator('.code-panel code').textContent(), /overflow="buttons"/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  await page.goto(`${base}/docs/components/tabs#api`);
  for (const [part, property] of [['Tabs.List', 'overflow'], ['Tabs.List', 'moreLabel'], ['Tabs.List', 'scrollPreviousLabel / scrollNextLabel'], ['Tabs.Trigger', 'overflowLabel']]) {
    await page.getByRole('region', { name: part + ' API', exact: true }).getByRole('cell', { name: property, exact: true }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS Tabs localized overflow controls, real menu selection, scrolling, code/API, desktop and narrow screenshots');
} catch (error) {
  await page.screenshot({ path: '/tmp/inkra-tabs-docs-failure.png' });
  throw error;
} finally { await browser.close(); }
