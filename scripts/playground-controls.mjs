export async function setPlaygroundControls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if (await toggle.getAttribute('aria-expanded') !== String(open)) await toggle.click();
  const page = playground.page();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.querySelector('[data-playground-moving]'));
  await playground.locator('.preview-controls').waitFor({ state: open ? 'visible' : 'hidden' });
}
