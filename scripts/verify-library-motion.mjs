import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];
const results = [];
const cases = [
  { route: 'dropdown-menu', trigger: '笔记操作', selector: '.inkra-menu', enter: 'inkra-menu-enter', exit: 'inkra-menu-exit' },
  { route: 'context-menu', context: true, selector: '.inkra-menu', enter: 'inkra-menu-enter', exit: 'inkra-menu-exit' },
  { route: 'overlay', trigger: '编辑笔记', selector: '.inkra-overlay__content', enter: 'inkra-overlay-content-in', exit: 'inkra-overlay-content-out' },
  { route: 'popover', trigger: '筛选', selector: '.inkra-popover__content', enter: 'inkra-popover-content-in', exit: 'inkra-popover-content-out' },
  { route: 'drawer', trigger: '打开任务抽屉', selector: '.inkra-drawer__content', enter: 'inkra-drawer-right-in', exit: 'inkra-drawer-right-out' },
  { route: 'alert-dialog', trigger: '归档项目', selector: '.inkra-alert-dialog__content', enter: 'inkra-alert-dialog-content-in', exit: 'inkra-alert-dialog-content-out' },
  { route: 'accordion', accordion: true, selector: '[data-library-motion-audit] > .inkra-accordion__content-body', enter: 'inkra-accordion-body-in', exit: 'inkra-accordion-body-out' },
];

async function installAudit(page) {
  await page.addInitScript(() => {
    localStorage.setItem('inkra-docs-locale', 'zh-CN');
    const paints = new WeakMap();
    const ids = new WeakMap();
    let nextId = 0;
    // Count visible-canvas paint commits, not unrelated offscreen texture generation.
    for (const name of ['drawImage', 'clearRect']) {
      const original = CanvasRenderingContext2D.prototype[name];
      CanvasRenderingContext2D.prototype[name] = function (...args) {
        if (this.canvas.isConnected) {
          const counts = paints.get(this.canvas) || { drawImage: 0, clearRect: 0 };
          counts[name] += 1;
          paints.set(this.canvas, counts);
        }
        return original.apply(this, args);
      };
    }
    window.libraryMotionAudit = { selector: '', records: [], closed: [] };
    document.addEventListener('animationstart', event => {
      const audit = window.libraryMotionAudit;
      const element = event.target;
      if (!audit.selector || !element.matches(audit.selector)) return;
      const record = {
        name: event.animationName,
        state: element.closest('[data-state]')?.getAttribute('data-state'),
        running: element.getAnimations().some(animation => animation.playState === 'running'),
        frames: 0, dimensions: [], canvasId: null, drawImage: 0, clearRect: 0, done: false,
      };
      audit.records.push(record);
      let canvas;
      let before;
      const started = performance.now();
      const sample = () => {
        record.frames += 1;
        // Once acquired, retain this exact object even if React replaces descendants.
        canvas ||= element.querySelector('canvas.inkra-pencil-surface__ink, canvas');
        if (canvas) {
          if (!ids.has(canvas)) ids.set(canvas, ++nextId);
          record.canvasId = ids.get(canvas);
          before ||= { ...(paints.get(canvas) || { drawImage: 0, clearRect: 0 }) };
          const dimensions = `${canvas.width}x${canvas.height}`;
          if (canvas.width && canvas.height && record.dimensions.at(-1) !== dimensions) record.dimensions.push(dimensions);
          const current = paints.get(canvas) || before;
          record.drawImage = current.drawImage - before.drawImage;
          record.clearRect = current.clearRect - before.clearRect;
        }
        const running = element.getAnimations().some(animation => animation.animationName === record.name && animation.playState === 'running');
        if (running && element.isConnected && performance.now() - started < 1200) requestAnimationFrame(sample);
        else record.done = true;
      };
      sample();
    }, true);
    new MutationObserver(mutations => {
      const audit = window.libraryMotionAudit;
      if (!audit.selector) return;
      for (const mutation of mutations) {
        const root = mutation.target;
        if (root.getAttribute('data-state') !== 'closed') continue;
        const element = root.matches(audit.selector) ? root : root.querySelector(audit.selector);
        if (element?.isConnected) audit.closed.push({
          reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
          animation: getComputedStyle(element).animationName,
        });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
  });
}

async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('[data-playground-moving]'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function verify(page, test, width) {
  await page.goto(`${base}/docs/components/${test.route}#preview`);
  const playground = page.locator('.component-playground').first();
  await playground.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const config = playground.locator('.playground-config-toggle');
  if (await config.count() && await config.getAttribute('aria-expanded') === 'true') await config.click();
  await settle(page);
  let trigger;
  let content;
  if (test.accordion) {
    const item = playground.locator('.inkra-accordion__item').nth(1);
    trigger = item.locator('.inkra-accordion__trigger');
    content = item.locator('.inkra-accordion__content');
    await content.evaluate(element => element.setAttribute('data-library-motion-audit', ''));
  } else {
    trigger = test.context
      ? playground.locator('[data-context-menu-trigger]').first()
      : playground.locator('.preview-stage').getByRole('button', { name: test.trigger, exact: true });
    content = page.locator(test.selector).first();
  }
  await page.evaluate(selector => { window.libraryMotionAudit.selector = selector; }, test.selector);
  const open = async () => {
    await trigger.focus();
    await page.keyboard.press(test.context ? 'Shift+F10' : 'Enter');
    await content.waitFor({ state: 'visible' });
  };
  const close = async () => {
    if (test.accordion) {
      await trigger.focus();
      await page.keyboard.press('Enter');
    } else await page.keyboard.press('Escape');
    await content.waitFor({ state: 'hidden' });
    await page.waitForFunction(element => document.activeElement === element, await trigger.elementHandle());
    if (test.accordion) assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  };
  await open();
  await page.waitForFunction(name => window.libraryMotionAudit.records.some(record => record.name === name && record.done), test.enter).catch(async error => {
    console.error(test.route, await page.evaluate(() => ({ audit: window.libraryMotionAudit, style: [...document.querySelectorAll(window.libraryMotionAudit.selector)].map(element => getComputedStyle(element).animation) })));
    throw error;
  });
  await content.screenshot({ path: `/tmp/inkra-library-motion-${test.route}-${width}.png` });
  await close();
  await page.waitForFunction(name => window.libraryMotionAudit.records.some(record => record.name === name && record.done), test.exit);
  const normal = await page.evaluate(() => window.libraryMotionAudit.records);
  for (const name of [test.enter, test.exit]) {
    const record = normal.find(entry => entry.name === name);
    assert(record?.running, `${test.route}: ${name} was actually running`);
    assert.equal(record.state, name === test.enter ? 'open' : 'closed');
    assert(record.frames >= 2, `${name}: sampled multiple animation frames`);
    assert(record.canvasId !== null, `${name}: sampled a real descendant canvas`);
    assert(record.dimensions.length <= 2, `${name}: backing canvas resized repeatedly: ${record.dimensions}`);
    assert(record.drawImage <= 6 && record.clearRect <= 6,
      `${name}: canvas repainted per frame (${record.drawImage} draws, ${record.clearRect} clears)`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const before = normal.length;
  await open();
  await settle(page);
  assert.equal(await page.locator(test.selector).first().evaluate(element => getComputedStyle(element).animationName), 'none');
  assert.equal(await page.locator(test.selector).first().evaluate(element => element.getAnimations().filter(animation => animation.playState === 'running').length), 0);
  // Closed content can unmount in the same React commit under reduced motion.
  // A temporary inert clone checks closed/direction specificity even in that case.
  const closedStyle = await page.locator(test.selector).first().evaluate(element => {
    const original = element.closest('[data-state]');
    const probe = original.cloneNode(true);
    probe.removeAttribute('id');
    probe.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    probe.setAttribute('data-state', 'closed');
    probe.setAttribute('aria-hidden', 'true');
    probe.setAttribute('inert', '');
    probe.style.cssText += ';position:fixed;left:-10000px;top:-10000px;visibility:hidden;pointer-events:none';
    original.parentElement.append(probe);
    const target = probe.matches(window.libraryMotionAudit.selector) ? probe : probe.querySelector(window.libraryMotionAudit.selector);
    const value = getComputedStyle(target).animationName;
    probe.remove();
    return value;
  });
  assert.equal(closedStyle, 'none', `${test.route}: reduced closed-state specificity`);
  await close();
  await settle(page);
  const reduced = await page.evaluate(() => window.libraryMotionAudit);
  assert.equal(reduced.records.length, before, `${test.route}: reduced motion must not start entrance or exit animations`);
  assert(reduced.closed.filter(entry => entry.reduced).every(entry => entry.animation === 'none'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  results.push({ route: test.route, width, normal, reducedClosedStyle: closedStyle });
  console.log(`PASS ${test.route} at ${width}px: enter/exit, focus, reduced motion and bounded canvas paints`);
}

try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => errors.push(error.message));
    await installAudit(page);
    for (const test of cases) await verify(page, test, width);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
