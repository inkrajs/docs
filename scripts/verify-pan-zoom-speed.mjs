import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/components/pan-zoom#preview');
  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/pan-zoom-speed.tsx');
    window.fixture = mount(container);
  });
  const viewport = page.locator('.inkra-pan-zoom__viewport:visible');
  await viewport.waitFor();
  async function configure(props = {}) {
    await page.waitForTimeout(300);
    await page.evaluate(props => window.fixture.configure(props), props);
    await page.evaluate(() => window.fixture.reset());
    await viewport.hover({ position: { x: 220, y: 160 } });
  }
  const scale = () => page.evaluate(() => window.fixture.transform().scale);
  async function wheel(delta) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(300);
    return scale();
  }
  await configure();
  assert(Math.abs(await wheel(-100) - 1.1) < 0.001, '100 wheel units increase scale by only 0.1');
  assert(Math.abs(await wheel(100) - 1) < 0.001, 'opposite wheel delta restores scale');
  for (const [step, expected] of [[0.0005, 1.05], [0.002, 1.2], [0, 1.1], [-1, 1.1]]) {
    await configure({ wheelStep: step });
    assert(Math.abs(await wheel(-100) - expected) < 0.001, 'custom steps and invalid-value fallback');
  }
  await configure();
  assert(Math.abs(await wheel(-2) - 1.002) < 0.001, 'small touchpad deltas retain precision');
  await configure({ wheel: 'modifier' });
  assert.equal(await wheel(-100), 1, 'plain wheel remains page scrolling');
  await page.keyboard.down('Control');
  assert(Math.abs(await wheel(-100) - 1.1) < 0.001, 'modifier wheel uses the gentle step');
  await page.keyboard.up('Control');
  for (const props of [{ wheel: 'disabled' }, { disabled: true }, { readOnly: true }]) {
    await configure(props);
    assert.equal(await wheel(-100), 1, 'disabled/read-only policies are preserved');
  }
  await configure({ maxScale: 1.05, minScale: 0.95 });
  assert.equal(await wheel(-100), 1.05, 'maximum scale is respected');
  assert.equal(await wheel(200), 0.95, 'minimum scale is respected');
  await configure({ value: { x: 0, y: 0, scale: 1 } });
  assert.equal(await wheel(-100), 1, 'rejected controlled changes reconcile');
  assert.deepEqual(errors, []);
  console.log('PASS wheel speed, fine deltas, configuration, policies, bounds and controlled reconciliation');
} finally {
  await browser.close();
}
