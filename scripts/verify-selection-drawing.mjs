import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
  await page.goto('http://127.0.0.1:4180/design-standard');
  const group = page.locator('.color-palette__selection').first();
  const surface = group.locator('[data-checked="true"] .inkra-radio-segment__surface');
  const animationCount = () => group.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.effect.getKeyframes().some(frame => frame.clipPath)).length);
  assert.equal(await animationCount(), 0, 'No drawing on mount');
  await group.getByRole('radio', { name: '浅色主题', exact: true }).check();
  const frames = await surface.evaluate(node => {
    const animation = node.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    return { count: animation.effect.getKeyframes().length, duration: animation.effect.getTiming().duration };
  });
  assert.equal(frames.duration, 480);
  assert(frames.count >= 24);
  const clips = [];
  for (const time of [60, 240, 450]) {
    await surface.evaluate((node, time) => { node.getAnimations()[0].currentTime = time; }, time);
    await page.waitForTimeout(30);
    clips.push(await surface.evaluate(node => getComputedStyle(node).clipPath));
    await group.screenshot({ path: `/tmp/inkra-drawing-${time}.png` });
  }
  assert.equal(new Set(clips).size, 3);
  await group.getByRole('radio', { name: '深色主题', exact: true }).check();
  assert.equal(await animationCount(), 2, 'Old selection erases while the next draws');
  await page.evaluate(() => document.getAnimations().forEach(animation => animation.pause()));
  const leaving = group.locator('.inkra-radio-group__item').nth(1).locator('.inkra-radio-segment__surface');
  const departure = await leaving.evaluate(node => {
    const animation = node.getAnimations()[0];
    animation.pause();
    return { direction: animation.effect.getTiming().direction, duration: animation.effect.getTiming().duration, progress: animation.effect.getComputedTiming().progress };
  });
  assert.equal(departure.direction, 'reverse');
  assert.equal(departure.duration, 320);
  assert(departure.progress > 0 && departure.progress < 1, 'Reverse starts from interrupted progress');
  const exitClips = [];
  for (const time of [80, 200, 290]) {
    await leaving.evaluate((node, time) => { node.getAnimations()[0].currentTime = time; }, time);
    await page.waitForTimeout(20);
    exitClips.push(await leaving.evaluate(node => getComputedStyle(node).clipPath));
    assert.equal(await leaving.evaluate(node => getComputedStyle(node).opacity), '1');
    await group.screenshot({ path: `/tmp/inkra-erasing-${time}.png`, animations: 'allow' });
  }
  assert.equal(new Set(exitClips).size, 3);
  await group.getByRole('radio', { name: '浅色主题', exact: true }).check();
  const resumed = await surface.evaluate(node => node.getAnimations()[0].effect.getComputedTiming().progress);
  assert(resumed > 0 && resumed < 0.5, 'Re-entry continues from remaining pigment');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await animationCount(), 0);
  assert.equal(await surface.evaluate(node => getComputedStyle(node).clipPath), 'none');
  await group.getByRole('radio', { name: '跟随系统', exact: true }).check();
  assert.equal(await animationCount(), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await group.getByRole('radio', { name: '浅色主题', exact: true }).check();
  await page.waitForTimeout(550);
  assert.equal(await animationCount(), 0, 'No animation runs after completion');
  const hiddenOpacity = await group.locator('.inkra-radio-group__item:not([data-checked]) .inkra-radio-segment__surface').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).opacity));
  assert.deepEqual(hiddenOpacity, ['0', '0']);
  assert.equal(await surface.evaluate(node => getComputedStyle(node).clipPath), 'none');
  for (const application of await page.locator('.color-palette__application').all()) {
    const colors = await application.evaluate(node => {
      const style = getComputedStyle(node);
      return ['--inkra-selection-pigment', '--inkra-accent'].map(token => style.getPropertyValue(token).trim());
    });
    assert.equal(colors[0], colors[1]);
  }
  console.log('PASS: progressive drawing frames, interruption, reduced motion, completed cleanup, light/dark pigment alignment.');
} finally { await browser.close(); }
