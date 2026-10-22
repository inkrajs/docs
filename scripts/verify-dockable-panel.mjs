import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

async function position(locator) {
  const box = await locator.boundingBox();
  assert(box, 'expected visible panel');
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true });
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/docs/components/dockable-panel#preview`);
      const stage = page.locator('.component-playground .preview-stage');
      const workspace = stage.locator('[data-testid="dockable-panel-workspace"]');
      const panels = workspace.locator('.inkra-dockable-panel');
      await assert.doesNotReject(() => panels.first().waitFor());
      assert.equal(await panels.count(), 2);

      const notes = panels.filter({ hasText: /Notes|便笺/ });
      const inspector = panels.filter({ hasText: /Inspector|检查器/ });
      const notesHandle = notes.locator('[data-dockable-panel-handle]');
      await notesHandle.focus();
      const beforeKeyboard = await position(notes);
      await page.keyboard.press('ArrowRight');
      const afterHorizontal = await position(notes);
      await page.keyboard.press('Shift+ArrowDown');
      const afterKeyboard = await position(notes);
      if (width >= 768) assert(afterHorizontal.x > beforeKeyboard.x, 'ArrowRight moves the panel');
      else {
        assert(Math.abs(afterHorizontal.x - beforeKeyboard.x) < 2, 'ArrowRight respects the narrow horizontal boundary');
        assert(Math.abs(afterHorizontal.y - beforeKeyboard.y) < 2, 'a blocked horizontal move does not snap vertically');
      }
      assert(afterKeyboard.y > beforeKeyboard.y, 'Shift+ArrowDown moves the panel by a larger step');

      await page.keyboard.press('Home');
      const restored = await position(notes);
      assert(Math.abs(restored.x - beforeKeyboard.x) < 2 && Math.abs(restored.y - beforeKeyboard.y) < 2, 'Home restores default position');

      const nestedAction = inspector.getByRole('button', { name: /Open settings|打开设置/ });
      const beforeAction = await position(inspector);
      await nestedAction.click();
      const afterAction = await position(inspector);
      assert.deepEqual(afterAction, beforeAction, 'nested action does not drag the panel');
      assert.equal(await inspector.getAttribute('data-active'), 'true', 'pointer activation raises the clicked panel');

      const collapse = inspector.locator('[data-dockable-panel-collapse]');
      await collapse.click();
      assert.equal(await inspector.getAttribute('data-collapsed'), 'true');
      assert.equal(await inspector.locator('.inkra-dockable-panel__body').count(), 0);
      await collapse.click();
      assert.equal(await inspector.locator('.inkra-dockable-panel__body').count(), 1);

      const handleBox = await position(inspectorHandle(inspector));
      const workspaceBox = await position(workspace);
      await page.mouse.move(handleBox.x + 30, handleBox.y + 20);
      await page.mouse.down();
      await page.mouse.move(workspaceBox.x + workspaceBox.width - 6, workspaceBox.y + 6, { steps: 12 });
      await page.mouse.up();
      const snapped = await position(inspector);
      assert(snapped.x + snapped.width <= workspaceBox.x + workspaceBox.width + 2, 'drag remains horizontally clamped');
      assert(snapped.y >= workspaceBox.y - 2, 'drag remains vertically clamped');

      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      console.log(`PASS DockablePanel keyboard/reset/nested-actions/collapse/drag/clamp ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}

function inspectorHandle(inspector) {
  return inspector.locator('[data-dockable-panel-handle]');
}
