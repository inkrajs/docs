import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/tree#preview`);
    const tree = page.locator('.component-playground .inkra-tree');
    await tree.waitFor();
    const row = tree.locator('.inkra-tree__item').first();
    const disclosure = row.locator('.inkra-tree__disclosure').first();
    assert.equal(await disclosure.locator('.inkra-pencil-surface--quiet').count(), 0);
    await tree.evaluate(async node => {
      await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
    });
    const buttonBox = await disclosure.boundingBox();
    assert(buttonBox.width >= 44 && buttonBox.height >= 44, `Tree target must be at least 44px: ${JSON.stringify(buttonBox)}`);
    assert.equal(await disclosure.locator('[data-folder-state]').getAttribute('data-folder-state'), 'open');
    await disclosure.click();
    assert.equal(await row.getAttribute('aria-expanded'), 'false');
    assert.equal(await disclosure.locator('[data-folder-state]').getAttribute('data-folder-state'), 'closed');
    await row.focus();
    await row.press('ArrowRight');
    assert.equal(await row.getAttribute('aria-expanded'), 'true');
    assert.equal(await disclosure.locator('[data-folder-state]').getAttribute('data-folder-state'), 'open');
    await page.locator('.page-heading').click();
    await tree.evaluate(node => { node.closest('.preview-stage').scrollTop = 0; });
    const treeTop = await tree.evaluate(node => ({
      tree: node.getBoundingClientRect().top,
      stage: node.closest('.preview-stage').getBoundingClientRect().top,
    }));
    assert(treeTop.tree >= treeTop.stage, 'tall Tree content remains reachable from the start of the scrollport');
    await page.screenshot({ path: `/tmp/inkra-tree-folder-${width}.png` });
    const selector = page.getByRole('combobox', { name: /展开图标|Disclosure icon/ });
    await setPlaygroundControls(page.locator('.component-playground'), true);
    await selector.click();
    await page.getByRole('option', { name: /箭头|Chevron/, exact: true }).click();
    assert.equal(await disclosure.locator('.inkra-tree__chevron').count(), 1);
    assert.equal(await disclosure.locator('[data-folder-state]').count(), 0);
    assert.equal(await disclosure.locator('.inkra-pencil-surface--quiet').count(), 0);
    await page.goto(`${base}/docs/components/timeline#preview`);
    const playground = page.locator('.component-playground');
    const timeline = playground.locator('.inkra-timeline');
    await timeline.waitFor();
    const verify = async (orientation, rtl) => {
      await page.waitForFunction(() => [...document.querySelectorAll('.component-playground .inkra-timeline__connector')]
        .every(canvas => canvas.width > 0 && canvas.height > 0));
      const rows = await timeline.evaluate(node => [...node.querySelectorAll('.inkra-timeline__item')].map(item => {
        const box = element => {
          const r = element.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        const canvas = item.querySelector('.inkra-timeline__connector');
        let coverage = 0;
        if (canvas) {
          const vertical = canvas.dataset.orientation === 'vertical';
          const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
          const occupied = new Set();
          for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 24) occupied.add(vertical ? y : x);
          }
          coverage = occupied.size / (vertical ? canvas.height : canvas.width);
        }
        return { marker: box(item.querySelector('.inkra-timeline__marker')), connector: canvas && box(canvas), coverage };
      }));
      assert.equal(rows.filter(item => item.connector).length, rows.length - 1);
      for (let i = 0; i < rows.length - 1; i++) {
        const { marker, connector: line, coverage } = rows[i];
        const next = rows[i + 1].marker;
        assert(coverage > 0.75, `continuous ink along axis: ${coverage}`);
        if (orientation === 'vertical') {
          assert(line.height > 50, 'vertical connector must be a line, not an intrinsic-ratio dot');
          assert(Math.abs((line.left + line.right - marker.left - marker.right) / 2) < 1);
          assert(line.top < marker.bottom && line.bottom >= next.top && line.bottom <= next.top + 6);
        } else {
          assert(line.width > 100, 'horizontal connector stretches to next node');
          assert(Math.abs((line.top + line.bottom - marker.top - marker.bottom) / 2) < 1);
          if (rtl) assert(line.left <= next.right && line.left >= next.right - 6 && line.right > marker.left);
          else assert(line.right >= next.left && line.right <= next.left + 6 && line.left < marker.right);
        }
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    };
    await verify('vertical', false);
    await page.screenshot({ path: `/tmp/inkra-timeline-connected-${width}.png` });
    await setPlaygroundControls(playground, true);
    await playground.locator('.preview-controls').getByRole('combobox', { name: /方向|Orientation/ }).click();
    await page.getByRole('option', { name: /横向|Horizontal/, exact: true }).click();
    await setPlaygroundControls(playground, false);
    await verify('horizontal', false);
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await verify('horizontal', true);
    await page.emulateMedia({ forcedColors: 'active' });
    const forced = await timeline.locator('.inkra-timeline__connector').first().boundingBox();
    assert(forced.width > 100 && forced.height > 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS Tree disclosure states/keyboard and Timeline connected pixels/RTL: ${width}px`);
  }
} finally { await browser.close(); }
