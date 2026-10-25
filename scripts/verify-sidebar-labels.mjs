import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1543, 390]) {
    for (const locale of ['ja', 'ko', 'fr']) {
      const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      await page.goto(`${base}/docs/components/grid#preview`);
      if (width < 1024) await page.locator('.menu-button').click();
      const sidebar = page.locator(width < 1024 ? '.mobile-drawer .side-navigation' : '.desktop-sidebar .side-navigation');
      await sidebar.locator('.nav-group-label').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const rows = await sidebar.locator('.nav-group-label, .nav-link').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => {
        const label = node.querySelector('.side-navigation__label');
        const source = label.querySelector('.inkra-pencil-text__source');
        const rect = label.getBoundingClientRect();
        const glyph = node.querySelector('.docs-pencil-icon').getBoundingClientRect();
        const chevron = node.querySelector('.inkra-accordion__trigger-icon')?.getBoundingClientRect();
        return {
          text: source.textContent,
          title: label.title,
          ellipsis: label.classList.contains('inkra-pencil-text--ellipsis'),
          height: rect.height,
          lineHeight: parseFloat(getComputedStyle(label).lineHeight),
          iconWidth: glyph.width,
          labelStart: rect.left,
          iconEnd: glyph.right,
          labelEnd: rect.right,
          chevronStart: chevron?.left,
          chevronWidth: chevron?.width,
          nowrap: getComputedStyle(source).whiteSpace,
          overflow: source.scrollWidth > source.clientWidth + 1,
        };
      }));
      assert(rows.length > 10, 'covers group headings, nested headings and leaf links');
      for (const row of rows) {
        assert(row.ellipsis && row.nowrap === 'nowrap', `${row.text}: uses pencil ellipsis`);
        assert.equal(row.title, row.text, `${row.text}: full name remains available`);
        assert(row.height <= row.lineHeight + 1, `${row.text}: single line`);
        assert(Math.abs(row.iconWidth - 26) < 0.1, `${row.text}: icon retains width`);
        assert(row.labelStart >= row.iconEnd + 7, `${row.text}: icon does not cover label`);
        if (row.chevronWidth !== undefined) {
          assert(Math.abs(row.chevronWidth - 16) < 0.1, `${row.text}: chevron retains width`);
          assert(row.labelEnd < row.chevronStart, `${row.text}: label does not cover chevron`);
        }
      }
      const longHeading = sidebar.locator('.nav-group-label .side-navigation__label').filter({ hasText: locale === 'ja' ? 'ナビゲーションメニュー' : locale === 'ko' ? '탐색 메뉴' : 'Menus de navigation' });
      const target = await longHeading.count() ? longHeading.first() : sidebar.locator('.nav-group-label .side-navigation__label').last();
      await target.scrollIntoViewIfNeeded();
      await target.locator('canvas').waitFor();
      await page.waitForFunction(selector => {
        const nodes = document.querySelectorAll(selector);
        return [...nodes].some(node => node.dataset.pencilReady === 'true');
      }, `${width < 1024 ? '.mobile-drawer' : '.desktop-sidebar'} .nav-group-label .side-navigation__label`);
      const painted = await target.evaluate(node => {
        const canvas = node.querySelector('canvas');
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        return { width: canvas.width, height: canvas.height, ink: pixels.some((value, index) => index % 4 === 3 && value > 0) };
      });
      assert(painted.ink && painted.width > 0 && painted.height > 0, 'pencil label paints actual ink');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `/tmp/inkra-sidebar-labels-${locale}-${width}.png` });
      assert.deepEqual(errors, []);
      console.log(`PASS sidebar single-line labels: ${locale} ${width}px (${rows.filter(row => row.overflow).length} truncated names, complete titles and painted canvas)`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
