import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setControls, showPreview, readCode } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const swipe = async (client, from, to, finish = 'touchEnd') => {
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
  for (let step = 1; step <= 12; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
      x: from.x + (to.x - from.x) * step / 12, y: from.y + (to.y - from.y) * step / 12, id: 1,
    }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: finish, touchPoints: [] });
};

try {
  for (const width of [1543, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, hasTouch: true, reducedMotion: 'reduce' });
    const client = await page.context().newCDPSession(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (/Unable to preventDefault/.test(message.text())) errors.push(message.text()); });
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/layout#preview`);
    const playground = page.locator('.component-playground');
    const frame = page.frameLocator('.layout-viewport__canvas');
    const root = frame.locator('.layout-notebook');
    const sidebar = frame.locator('.layout-notebook__sidebar');
    await root.waitFor();
    await playground.getByRole('radio', { name: '390', exact: true }).check();
    const settings = async group => {
      await setControls(playground, true);
      await playground.locator('.property-tabs').getByRole('tab', { name: group, exact: true }).click();
    };
    const gesture = async (open, right, vertical = false) => {
      await root.scrollIntoViewIfNeeded();
      const box = await root.boundingBox();
      const scale = box.width / 390;
      const x = open ? (right ? box.x + box.width - 10 * scale : box.x + 10 * scale) : box.x + box.width / 2;
      const y = box.y + box.height * 0.6;
      await swipe(client, { x, y }, { x: x + (vertical ? 0 : (right ? -1 : 1) * (open ? 1 : -1) * 90 * scale), y: y + (vertical ? -80 * scale : 0) });
    };
    for (const layout of ['侧栏通高', '右侧通高']) {
      await settings('布局');
      await playground.getByRole('radio', { name: layout, exact: true }).check();
      for (const label of ['覆盖抽屉', '全页面导航', '推开页面', '整页推开']) {
        await settings('移动端');
        await playground.getByRole('radio', { name: label, exact: true }).check();
        assert(await playground.getByRole('switch', { name: '滑动手势', exact: true }).isChecked());
        await showPreview(playground);
        if (await sidebar.isVisible()) await frame.locator('[data-sidebar-toggle]').press('Escape');
        for (const rtl of [false, true]) {
          await frame.locator('html').evaluate((node, rtl) => { node.dir = rtl ? 'rtl' : 'ltr'; }, rtl);
          const right = (layout === '右侧通高') !== rtl;
          await gesture(true, right, true);
          assert(await sidebar.isHidden(), 'vertical scrolling does not open navigation');
          await gesture(true, right);
          assert.equal(await root.getAttribute('data-navigation-open'), 'true', `${layout}/${label}/${rtl}: edge swipe opens`);
          await gesture(false, right);
          assert.equal(await root.getAttribute('data-navigation-open'), 'false', `${layout}/${label}/${rtl}: reverse swipe closes`);
        }
      }
    }
    await frame.locator('html').evaluate(node => { node.dir = 'ltr'; });
    await settings('移动端');
    await playground.getByRole('switch', { name: '滑动手势', exact: true }).uncheck();
    await showPreview(playground);
    await gesture(true, true);
    assert(await sidebar.isHidden(), 'the mobile gesture switch disables recognition');
    assert((await readCode(playground)).includes('Boolean(navigation) && false'), 'copied code reflects the gesture switch');
    await settings('移动端');
    await playground.getByRole('switch', { name: '滑动手势', exact: true }).check();
    await showPreview(playground);
    await gesture(true, true);
    await page.screenshot({ path: `/tmp/inkra-layout-gestures-${width}.png` });
    await frame.locator('[data-sidebar-toggle]').press('Escape');
    assert(await sidebar.isHidden(), 'keyboard close remains available after touch');
    await playground.getByRole('radio', { name: '768', exact: true }).check();
    assert.equal(await root.getAttribute('data-compact'), 'false');
    await gesture(false, true);
    assert.equal(await root.getAttribute('data-navigation-open'), 'true', 'desktop panels are not touch-dismissed');
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: four modes, left/right, RTL, vertical scroll, disable, copied code and keyboard`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, hasTouch: true, reducedMotion: 'reduce' });
  const client = await page.context().newCDPSession(page);
  await page.goto(`${base}/docs/components/layout#preview`);
  await page.evaluate(async () => {
    const { React: R, ReactDOM, ReactDOMClient, Layout } = await import('/scripts/fixtures/layout-scroll.mjs');
    document.querySelector('#root').style.display = 'none';
    document.body.style.cssText = 'margin:0; padding:0;';
    const host = document.createElement('div');
    document.body.prepend(host);
    const api = window.swipeFixture = { open: false, requests: 0, clicks: 0, reject: false };
    function Fixture() {
      const [state, set] = R.useState({ enabled: true, open: false, dir: 'ltr' });
      api.update = patch => ReactDOM.flushSync(() => set(current => ({ ...current, ...patch })));
      api.open = state.open;
      return R.createElement(Layout.Root, { id: 'swipe-root', dir: state.dir,
        style: { display: 'block', width: 390, height: 500, overflowY: 'auto' },
        swipeNavigation: { enabled: state.enabled, open: state.open, onOpenChange: open => {
          api.requests++; if (!api.reject) set(current => ({ ...current, open }));
        } },
      }, R.createElement('button', { id: 'swipe-item', style: { width: 300, height: 60 }, onClick: () => api.clicks++ }, 'Item'),
      R.createElement('input', { id: 'swipe-input', style: { display: 'block', width: 300, height: 50 } }),
      R.createElement('div', { id: 'swipe-scroll', style: { width: 300, overflowX: 'auto', height: 60 } }, R.createElement('div', { style: { width: 900 } }, 'Horizontal scroll')),
      R.createElement('div', { id: 'swipe-ignore', 'data-layout-swipe-ignore': '', style: { height: 60 } }, 'Custom tool'),
      R.createElement('div', { id: 'swipe-space', style: { height: 900 } }, 'Content'));
    }
    const root = ReactDOMClient.createRoot(host);
    ReactDOM.flushSync(() => root.render(R.createElement(Fixture)));
    api.unmount = () => ReactDOM.flushSync(() => root.unmount());
  });
  const root = page.locator('#swipe-root');
  const state = () => page.evaluate(() => ({ open: swipeFixture.open, requests: swipeFixture.requests, clicks: swipeFixture.clicks }));
  const update = patch => page.evaluate(patch => swipeFixture.update(patch), patch);
  const move = (x, toX, y = 300, toY = y, finish) => swipe(client, { x, y }, { x: toX, y: toY }, finish);
  await move(100, 190);
  assert.equal((await state()).requests, 0, 'center swipe does not open');
  await move(10, 30);
  assert.equal((await state()).requests, 0, 'short swipe does not open');
  await move(10, 100, 300, 300, 'touchCancel');
  assert.equal((await state()).requests, 0, 'canceled touch does not open');
  await move(10, 100);
  assert.equal((await state()).open, true);
  for (const selector of ['#swipe-input', '#swipe-scroll', '#swipe-ignore']) {
    const box = await page.locator(selector).boundingBox();
    await move(box.x + 180, box.x + 70, box.y + box.height / 2);
    assert.equal((await state()).open, true, `${selector} retains its own gesture`);
  }
  await page.locator('#swipe-input').fill('Draft');
  await move(180, 80, 30);
  assert.equal((await state()).open, false);
  assert.equal((await state()).clicks, 0, 'closing over a button does not activate it');
  assert.equal(await page.locator('#swipe-input').inputValue(), 'Draft');
  await page.locator('#swipe-item').tap();
  assert.equal((await state()).clicks, 1, 'ordinary taps still activate buttons');
  await page.evaluate(() => { swipeFixture.reject = true; });
  const before = (await state()).requests;
  await move(10, 100); await move(10, 100);
  assert.equal((await state()).open, false);
  assert.equal((await state()).requests, before + 2, 'controlled rejection permits another attempt');
  await page.evaluate(() => { swipeFixture.reject = false; });
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 10, y: 300, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 70, y: 300, id: 1 }] });
  await update({ enabled: false });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal((await state()).open, false, 'disabling during a gesture cancels');
  await update({ enabled: true });
  await move(150, 150, 400, 260);
  assert(await root.evaluate(node => node.scrollTop > 0), 'vertical native scrolling actually moves the viewport');
  await root.evaluate(node => { node.scrollTop = 0; });
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 10, y: 300, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 10, y: 300, id: 1 }, { x: 30, y: 350, id: 2 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 110, y: 300, id: 1 }, { x: 130, y: 350, id: 2 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal((await state()).open, false, 'multitouch does not navigate');
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 10, y: 300, id: 1 }] });
  await page.evaluate(() => swipeFixture.unmount());
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('PASS installed-package touch exclusions, cancellation, controls, click suppression, scrolling and cleanup');
  await page.close();
} finally {
  await browser.close();
}
