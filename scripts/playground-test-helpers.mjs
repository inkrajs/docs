export async function setPlaygroundControls(playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
  await playground.evaluate(async (node, open) => {
    const deadline = performance.now() + 10000;
    let previous;
    let stableFrames = 0;
    while (performance.now() < deadline) {
      // Flush layout before the next frame's ResizeObserver notifications.
      const rect = node.querySelector('.preview-display').getBoundingClientRect();
      const settled = node.dataset.controlsPresent === String(open)
        && !node.querySelector('[data-playground-moving]');
      stableFrames = settled && previous
        && Math.abs(rect.width - previous.width) < 0.1
        && Math.abs(rect.height - previous.height) < 0.1 ? stableFrames + 1 : 0;
      if (stableFrames >= 3) return;
      previous = rect;
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    throw new Error('Playground controls did not reach a stable final layout');
  }, open);
}
