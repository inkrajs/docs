import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const expectedHeights = { sm: 36, md: 44, lg: 48 };
const specs = {
  input: {
    visual: ['.inkra-field-control--input'],
    hit: ['.inkra-input-root'],
  },
  'input-number': {
    visual: ['.inkra-field-control--input'],
    hit: ['.inkra-input-root'],
  },
  'tag-input': {
    visual: ['.inkra-tag-input__control'],
    hit: ['.inkra-tag-input'],
  },
  'tag-input-disabled': {
    visual: ['.inkra-tag-input__control'],
    hit: ['.inkra-tag-input'],
  },
  select: {
    visual: ['.inkra-select__trigger-surface'],
    hit: ['.inkra-select__trigger'],
  },
  'select-stepper': {
    visual: ['.inkra-select-stepper__control'],
    hit: ['.inkra-select-stepper'],
  },
  searchable: {
    visual: ['.inkra-search-select__control', '.inkra-field-control--input'],
    hit: ['.inkra-input-root', '.inkra-button'],
  },
  'tree-select': {
    visual: ['.inkra-tree-select__control', '.inkra-tree-select__trigger .inkra-button__surface', '.inkra-tree-select__clear .inkra-button__surface'],
    hit: ['.inkra-tree-select__trigger', '.inkra-tree-select__clear'],
  },
  hotkey: {
    visual: ['.inkra-hotkey-input__control'],
    hit: ['.inkra-hotkey-input'],
  },
  'date-picker': {
    visual: ['.inkra-date-picker__control', '.inkra-date-picker__control .inkra-button__surface'],
    hit: ['.inkra-date-picker__control .inkra-button'],
  },
  'time-picker': {
    visual: ['.inkra-time-picker__control', '.inkra-time-picker__control .inkra-button__surface'],
    hit: ['.inkra-time-picker__control .inkra-button'],
  },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function settle() {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function measureSize(size) {
  const row = page.locator(`[data-form-size="${size}"]`);
  const expected = expectedHeights[size];
  for (const [kind, spec] of Object.entries(specs)) {
    const control = row.locator(`[data-form-size-kind="${kind}"]`);
    for (const selector of spec.visual) {
      const targets = control.locator(selector);
      const count = await targets.count();
      assert(count > 0, `${size} ${kind}: missing visual target ${selector}`);
      for (let index = 0; index < count; index += 1) {
        const height = (await targets.nth(index).boundingBox()).height;
        assert(Math.abs(height - expected) <= 1, `${size} ${kind} ${selector}: ${height}px visual height, expected ${expected}px`);
      }
    }
    for (const selector of spec.hit) {
      const targets = control.locator(selector);
      const count = await targets.count();
      assert(count > 0, `${size} ${kind}: missing hit target ${selector}`);
      for (let index = 0; index < count; index += 1) {
        const height = (await targets.nth(index).boundingBox()).height;
        assert(height >= 44 - 1, `${size} ${kind} ${selector}: ${height}px hit height`);
      }
    }
  }

  const tagControl = row.locator('[data-form-size-kind="tag-input"] .inkra-tag-input__control');
  const tag = row.locator('[data-form-size-kind="tag-input"] .inkra-tag-input__tag').first();
  const [tagControlBox, tagBox] = await Promise.all([tagControl.boundingBox(), tag.boundingBox()]);
  const topInset = tagBox.y - tagControlBox.y;
  const leftInset = tagBox.x - tagControlBox.x;
  assert(Math.abs(topInset - leftInset) <= 1, `${size} first tag outer inset: top ${topInset}px / left ${leftInset}px`);
  assert(Math.abs(topInset - 4) <= 1, `${size} first tag outer inset is ${topInset}px, expected 4px`);

  const disabled = row.locator('[data-form-size-kind="tag-input-disabled"]');
  const controlHeight = (await disabled.locator('.inkra-tag-input__control').boundingBox()).height;
  assert(Math.abs(controlHeight - expected) <= 1, `${size} disabled tags stay on one line`);
  const tagTops = await disabled.locator('.inkra-tag-input__tag').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
  assert(Math.max(...tagTops) - Math.min(...tagTops) <= 1, `${size} disabled React and Design System tags do not wrap`);
}

try {
  await page.goto(`${base}/docs/components/input#preview`);
  await page.locator('.component-playground').first().waitFor();
  await page.evaluate(async () => {
    document.getElementById('root').style.display = 'none';
    const container = document.createElement('section');
    container.id = 'form-size-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/form-sizes.tsx');
    window.formSizeFixture = mount(container);
  });
  await page.locator('[data-form-size="md"]').waitFor();

  for (const width of [1305, 390]) {
    await page.setViewportSize({ width, height: 954 });
    await settle();
    for (const size of Object.keys(expectedHeights)) await measureSize(size);
    const wrappedHeight = (await page.locator('[data-form-size-wrap] .inkra-tag-input__control').boundingBox()).height;
    assert(wrappedHeight > expectedHeights.md, `crowded tags grow beyond ${expectedHeights.md}px`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px page overflow`);
    await page.screenshot({ path: `/tmp/inkra-form-sizes-${width}.png`, animations: 'disabled', fullPage: true });
    console.log(`PASS form control surfaces, hit targets, tag inset and wrapping at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await page.evaluate(() => {
    window.formSizeFixture?.unmount();
    document.getElementById('form-size-fixture')?.remove();
    const root = document.getElementById('root');
    if (root) root.style.display = '';
  }).catch(() => {});
  await browser.close();
}
