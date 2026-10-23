import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const examples = [
  ['transfer', '可选成员', 'Available people'],
  ['log', '开始同步工作区', 'Workspace sync started'],
  ['keypad', '可编辑值', 'Editable value'],
  ['dockable-panel', '检查器', 'Inspector'],
  ['node-graph', '需求草图', 'Brief'],
  ['carousel', '随手笔记', 'Field notes'],
  ['radar', '雷达图数据', 'Radar data'],
  ['heatmap', '团队健康矩阵', 'Team health matrix'],
  ['image-viewer', '打开图片查看器', 'Open image viewer'],
];

async function setLanguage(page, locale, mobile) {
  const current = await page.locator('html').getAttribute('lang');
  if (mobile) await page.getByRole('button', { name: current === 'en' ? 'Open navigation' : '打开文档目录', exact: true }).click();
  const scope = page.locator(mobile ? '.mobile-drawer .language-control' : '.desktop-sidebar .language-control');
  await scope.getByRole('combobox').click();
  await page.getByRole('option', { name: locale === 'en' ? 'English' : '中文', exact: true }).click();
  await page.waitForFunction(value => document.documentElement.lang === value, locale);
  if (mobile) await page.locator('.mobile-drawer').getByRole('button', { name: locale === 'en' ? 'Close navigation' : '关闭文档目录', exact: true }).click();
}

async function propertiesOpen(page, open) {
  const toggle = page.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    for (const [component, chinese, english] of width === 390 ? examples.filter(([name]) => ['transfer', 'log'].includes(name)) : examples) {
      await page.goto(`${base}/docs/components/${component}#preview`);
      const preview = page.locator('.component-playground .preview-display');
      await preview.waitFor();
      await propertiesOpen(page, false);
      await page.waitForFunction(({ selector, text }) => document.querySelector(selector)?.textContent.includes(text), { selector: '.component-playground .preview-display', text: chinese });
      let activePropertiesPanel;
      if (component === 'transfer') {
        await propertiesOpen(page, true);
        const controls = page.locator('.preview-controls');
        await controls.getByRole('tab', { name: '状态', exact: true }).click();
        activePropertiesPanel = await controls.getByRole('tab', { name: '状态', exact: true }).getAttribute('aria-controls');
        await controls.getByRole('switch', { name: '整体禁用', exact: true }).click();
        await propertiesOpen(page, false);
      }
      await setLanguage(page, 'en', width === 390);
      await page.waitForFunction(({ selector, text }) => document.querySelector(selector)?.textContent.includes(text), { selector: '.component-playground .preview-display', text: english });
      const visibleText = await preview.innerText();
      assert.doesNotMatch(visibleText, /\p{Script=Han}/u, `${component}: Chinese leaked into English preview`);
      assert.doesNotMatch(visibleText, /[\u4e00-\u9fff][^\n]{0,80} \/ [A-Za-z]/, `${component}: joined translations`);
      if (component === 'transfer') {
        await propertiesOpen(page, true);
        const controls = page.locator('.preview-controls');
        const selectedTab = controls.getByRole('tab', { name: 'States', exact: true });
        assert.equal(await selectedTab.getAttribute('aria-selected'), 'true');
        assert.equal(await selectedTab.getAttribute('aria-controls'), activePropertiesPanel, 'Locale changes preserve the selected panel identity');
        assert.equal(await controls.getByRole('switch', { name: 'Disable all', exact: true }).isChecked(), true);
        await propertiesOpen(page, false);
        await page.screenshot({ path: `/tmp/inkra-i18n-transfer-${width}.png`, fullPage: true });
      }
      if (component === 'image-viewer') {
        await preview.getByRole('button', { name: 'Open image viewer', exact: true }).click();
        await page.getByRole('dialog').waitFor();
        const alternatives = await page.getByRole('dialog').locator('img[alt]').evaluateAll(images => images.map(image => image.alt));
        assert(alternatives.some(alt => alt.includes('Inkra documentation in its light theme')));
        assert(alternatives.every(alt => !/[\u4e00-\u9fff]/.test(alt)));
        await page.keyboard.press('Escape');
      }
      await setLanguage(page, 'zh-CN', width === 390);
      assert((await preview.innerText()).includes(chinese), `${component}: live switch back to Chinese`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      console.log(`PASS ${component}: live Chinese/English switching, ${width}px`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
