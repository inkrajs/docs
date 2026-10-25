export async function setPlaygroundControls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if (await toggle.getAttribute('aria-expanded') !== String(open)) await toggle.click();
  const page = playground.page();
  const root = await playground.elementHandle();
  try {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(element => !element.querySelector('[data-playground-moving]'), root);
    await playground.locator('.preview-controls').waitFor({ state: open ? 'visible' : 'hidden' });
    // Removing the exiting controls triggers a second ResizeObserver FLIP on
    // the preview. Wait for that final geometry before measuring or dragging.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForFunction(element => !element.querySelector('[data-playground-moving]'), root);
  } finally { await root?.dispose(); }
}
