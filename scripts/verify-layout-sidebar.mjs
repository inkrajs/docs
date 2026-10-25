import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import ts from 'typescript';
import { readCode, setControls, showPreview } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const [width, locale, theme] of [[1543, 'zh-CN', 'light'], [1305, 'en', 'dark'], [390, 'zh-CN', 'light'], [320, 'en', 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('crash', () => errors.push('Page crashed'));
    await page.addInitScript(({ locale, theme }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', theme);
    }, { locale, theme });
    await page.goto(`${base}/docs/components/layout#preview`);
    const playground = page.locator('.component-playground');
    const preview = playground.locator('.preview-stage');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const sidebar = frame.locator('.layout-notebook__sidebar');
    const toggle = frame.locator('[data-sidebar-toggle]');
    const scroll = preview.locator('.layout-viewport__scroll');
    await frame.locator('.layout-notebook').waitFor();
    const assertBounds = async () => {
      const bounds = await preview.evaluate(node => {
        const rect = element => {
          const { top, right, bottom, left } = element.getBoundingClientRect();
          return { top, right, bottom, left };
        };
        return { preview: rect(node), display: rect(node.parentElement), scroll: rect(node.querySelector('.layout-viewport__scroll')) };
      });
      assert(bounds.scroll.bottom <= bounds.display.bottom + 1, 'preview scroll region stays inside the fixed display');
      assert(bounds.scroll.top >= bounds.preview.top && bounds.scroll.right <= bounds.preview.right + 1);
      assert(await scroll.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'fitted preview does not overflow horizontally');
      assert(await scroll.evaluate(node => node.scrollHeight <= node.clientHeight + 1), 'fitted preview does not overflow vertically');
      const fitted = await preview.locator('.layout-viewport__canvas').boundingBox();
      assert(Math.abs(fitted.height - (bounds.scroll.bottom - bounds.scroll.top)) < 1, 'scaled workspace fills the preview height');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const card = await playground.boundingBox();
      const next = await page.locator('.layout-examples > .component-example').first().boundingBox();
      assert(bounds.scroll.bottom <= next.y && card.y + card.height <= next.y, 'preview never overlaps the next example');
    };
    for (const preset of [768, 1024, 1920, 390]) {
      await preview.getByRole('radio', { name: String(preset), exact: true }).check();
      await page.waitForFunction(preset => {
        const iframe = document.querySelector('.layout-viewport__canvas');
        return iframe.offsetWidth === preset && iframe.contentDocument.querySelector('.layout-notebook').dataset.compact === String(preset < 640);
      }, preset);
      await assertBounds();
      if (preset !== 390) assert(await toggle.evaluate(node => !!node.closest('.layout-notebook__sidebar-bottom')), 'full-width-header layout closes from the bottom sidebar region');
      if (preset !== 390) {
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        const before = await frame.locator('.inkra-layout__content').evaluate(node => node.clientWidth);
        await toggle.click();
        assert(await sidebar.isHidden());
        assert.equal(await frame.locator('.layout-notebook').evaluate(node => node.ownerDocument.getAnimations().length), 0, 'reduced motion skips collapse animation');
        assert(await frame.locator('.inkra-layout__content').evaluate(node => node.clientWidth) > before);
        await toggle.press('Enter');
        await sidebar.waitFor({ state: 'visible' });
        assert(await sidebar.isVisible());
      } else {
        assert(await sidebar.isHidden(), 'narrow preview starts with navigation collapsed');
        const before = await frame.locator('.inkra-layout__content').boundingBox();
        await toggle.click();
        assert(await sidebar.isVisible());
        assert.equal(await toggle.getAttribute('aria-controls'), await sidebar.getAttribute('id'));
        assert.equal(await sidebar.locator('.inkra-layout__sidebar-divider').evaluate(node => getComputedStyle(node).display), 'block');
        assert.equal(await sidebar.locator('.inkra-layout__sidebar-divider-mobile').evaluate(node => getComputedStyle(node).display), 'none');
        assert.deepEqual(await frame.locator('.inkra-layout__content').boundingBox(), before, 'drawer does not push content down');
        assert(await frame.locator('.inkra-layout__content').evaluate(node => node.inert));
        await sidebar.locator('button').first().focus();
        await page.keyboard.press('Escape');
        assert(await sidebar.isHidden());
        assert(await toggle.evaluate(node => node === node.ownerDocument.activeElement));
        await page.keyboard.press('Enter');
        await sidebar.getByRole('button', { name: locale === 'zh-CN' ? '收藏' : 'Favorites', exact: true }).click();
        assert(await sidebar.isHidden(), 'choosing a section closes compact navigation');
        assert.equal(await frame.locator('.layout-notebook__note').count(), 1);
        await toggle.click();
        const backdrop = await frame.locator('.layout-notebook__dismiss').boundingBox();
        await page.mouse.click(backdrop.x + backdrop.width - 12, backdrop.y + 24);
        await sidebar.waitFor({ state: 'hidden' });
        assert(await sidebar.isHidden(), 'outside click closes compact navigation');
        await toggle.click();
        await page.screenshot({ path: `/tmp/inkra-layout-sidebar-${width}-open.png`, animations: 'disabled' });
        await sidebar.locator('button').first().click();
      }
      await page.screenshot({ path: `/tmp/inkra-layout-sidebar-${width}-${preset}.png`, animations: 'disabled' });
    }
    for (let index = 0; index < 5; index++) {
      await frame.getByRole('button', { name: locale === 'zh-CN' ? '新建笔记' : 'New note', exact: true }).click();
    }
    await frame.locator('.layout-notebook__content').evaluate(node => { node.dataset.scrollProbe = ''; });
    await page.waitForFunction(() => {
      const region = document.querySelector('.layout-viewport__canvas').contentDocument.querySelector('[data-scroll-probe]');
      return region.scrollHeight > region.clientHeight + 100;
    });
    await assertBounds();
    const content = frame.locator('.layout-notebook__content');
    await content.evaluate(node => { node.scrollTop = node.scrollHeight; });
    assert(await content.evaluate(node => node.scrollTop > 100), 'long notes scroll inside the workspace content');
    await content.evaluate(node => { node.scrollTop = 0; });
    await preview.getByRole('button', { name: locale === 'zh-CN' ? '原尺寸查看' : 'Actual size', exact: true }).click();
    await preview.getByRole('radio', { name: '1024', exact: true }).check();
    assert(await scroll.evaluate(node => node.scrollWidth > node.clientWidth), 'actual size has intentional local horizontal scrolling');
    await preview.getByRole('button', { name: locale === 'zh-CN' ? '适应窗口' : 'Fit to preview', exact: true }).click();
    await assertBounds();
    await preview.getByRole('radio', { name: '390', exact: true }).check();
    await frame.locator('html').evaluate(node => { node.dir = 'rtl'; });
    await toggle.click();
    const rtl = await sidebar.evaluate(node => ({ sidebar: node.getBoundingClientRect().right, body: node.parentElement.getBoundingClientRect().right }));
    assert(Math.abs(rtl.sidebar - rtl.body) < 1, 'compact sidebar follows inline-start in RTL');
    await toggle.press('Escape');
    await frame.locator('html').evaluate(node => { node.removeAttribute('dir'); });
    const layouts = [
      ['top', '顶部通栏', 'Full-width header'], ['side', '侧栏通高', 'Full-height sidebar'],
      ['split', '分区页头', 'Split headers'], ['right', '右侧导航', 'Right navigation'],
      ['right-side', '右侧通高', 'Full-height right sidebar'], ['right-split', '右侧分区页头', 'Split right headers'],
      ['dual', '双侧栏', 'Two sidebars'], ['content', '上下通栏', 'Header and footer'],
    ];
    const chooseLayout = async choice => {
      await setControls(playground, true);
      const picker = playground.locator('.layout-mode-picker');
      assert.equal(await picker.getByRole('radio').count(), 8);
      await picker.getByRole('radio', { name: choice[locale === 'zh-CN' ? 1 : 2], exact: true }).check();
      await showPreview(playground);
    };
    for (const choice of layouts) {
      await chooseLayout(choice);
      const code = await readCode(playground);
      const parsed = ts.createSourceFile('layout-example.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      assert.equal(parsed.parseDiagnostics.length, 0, `${choice[0]} example code parses as TSX`);
      if (choice[0] === 'content') assert(code.includes('const navigation = null;'));
      if (choice[0] === 'dual') assert(code.includes('{details}'));
      for (const preset of [1024, 390]) {
        await preview.getByRole('radio', { name: String(preset), exact: true }).check();
        await assertBounds();
        const geometry = await frame.locator('.layout-notebook').evaluate(root => {
          const rect = node => {
            if (!node) return null;
            const { x, y, width, height, right, bottom } = node.getBoundingClientRect();
            return { x, y, width, height, right, bottom };
          };
          return { root: rect(root), navigation: rect(root.querySelector('.layout-notebook__sidebar')),
            content: rect(root.querySelector('.layout-notebook__content')), footer: rect(root.querySelector('.inkra-layout__footer')),
            header: rect(root.querySelector('.layout-notebook__header')) };
        });
        if (preset === 1024 && choice[0] !== 'content') {
          assert(await sidebar.isVisible());
          if (choice[0] === 'side' || choice[0] === 'split') {
            assert(Math.abs(geometry.navigation.y - geometry.root.y) < 1);
            assert(geometry.header.x >= geometry.navigation.right - 1);
            if (choice[0] === 'side') assert(Math.abs(geometry.navigation.bottom - geometry.root.bottom) < 1);
            else assert(Math.abs(geometry.footer.width - geometry.root.width) < 1);
          } else if (choice[0].startsWith('right')) {
            assert(geometry.navigation.x >= geometry.content.right - 1);
            if (choice[0] !== 'right') {
              assert(Math.abs(geometry.navigation.y - geometry.root.y) < 1);
              if (choice[0] === 'right-side') assert(Math.abs(geometry.navigation.bottom - geometry.root.bottom) < 1);
              else assert(Math.abs(geometry.footer.width - geometry.root.width) < 1);
            }
          }
          else assert(geometry.navigation.y >= geometry.header.bottom - 1);
          assert.equal(await frame.locator('.layout-notebook__secondary').count(), choice[0] === 'dual' ? 1 : 0);
          if (choice[0].startsWith('right')) {
            await toggle.click();
            assert(await sidebar.isHidden());
            const positions = await toggle.evaluate(node => ({
              toggle: node.getBoundingClientRect().left,
              titleEnd: node.closest('header').querySelector('.layout-notebook__header-title').getBoundingClientRect().right,
            }));
            assert(positions.toggle >= positions.titleEnd, 'right navigation reopens from the header action side');
            await toggle.press('Enter');
            assert(await sidebar.isVisible(), 'right navigation restores from its own side');
          }
        } else if (choice[0] === 'content') {
          assert.equal(await sidebar.count(), 0);
          assert.equal(await toggle.count(), 0);
        } else {
          assert(await sidebar.isHidden());
          const beforeOpen = await content.boundingBox();
          await toggle.click();
          assert(await sidebar.isVisible());
          assert.deepEqual(await content.boundingBox(), beforeOpen, 'every compact layout overlays navigation without shifting content');
          await toggle.press('Escape');
        }
        if (width === 1543) await playground.screenshot({ path: `/tmp/inkra-layout-mode-${choice[0]}-${preset}.png`, animations: 'disabled' });
      }
    }
    await chooseLayout(layouts[0]);
    await setControls(playground, true);
    await playground.locator('.property-tabs').getByRole('tab', { name: locale === 'zh-CN' ? '交互' : 'Interaction', exact: true }).click();
    await playground.getByRole('switch', { name: locale === 'zh-CN' ? '启用侧栏' : 'Enable sidebar', exact: true }).click();
    await showPreview(playground);
    assert.equal(await toggle.count(), 0);
    assert.equal(await sidebar.count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS bounded Layout preview and sidebar toggle/navigation at ${width}px/${locale}/${theme}`);
    await page.close();
  }
} finally {
  await browser.close();
}
