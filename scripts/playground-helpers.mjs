import assert from 'node:assert/strict';

export async function setControls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
  await playground.page().waitForFunction(({ node, open }) => node.dataset.controlsOpen === String(open), {
    node: await playground.elementHandle(), open,
  });
}

export async function showPreview(playground) {
  if (await playground.getAttribute('data-controls-layout') !== 'wide') await setControls(playground, false);
  await playground.locator('.view-tab').first().click();
}

export async function readCode(playground) {
  if (await playground.getAttribute('data-controls-layout') !== 'wide') await setControls(playground, false);
  await playground.locator('.view-tab').nth(1).click();
  const source = await playground.locator('.code-panel').textContent();
  await showPreview(playground);
  return source;
}

export async function assertPlaygroundLayout(playground) {
  await setControls(playground, true);
  const controls = playground.locator('.preview-controls');
  const display = playground.locator('.preview-display');
  if (await playground.getAttribute('data-controls-layout') === 'wide') {
    const panel = await controls.boundingBox();
    const preview = await display.boundingBox();
    assert(panel.x >= preview.x + preview.width - 1, 'properties are beside preview');
  } else {
    assert(await display.evaluate(node => node.inert), 'covered preview is not interactive');
    await controls.locator('button').first().focus();
    await controls.page().keyboard.press('Escape');
    assert.equal(await playground.locator('.playground-config-toggle').getAttribute('aria-expanded'), 'false');
    assert(await playground.locator('.playground-config-toggle').evaluate(node => node === document.activeElement));
  }
  await showPreview(playground);
}
