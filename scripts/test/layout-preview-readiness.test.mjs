import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/components/expansion/layoutPreviewReadiness.ts', import.meta.url), 'utf8');
const viewportSource = readFileSync(new URL('../../src/components/expansion/LayoutViewport.tsx', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const { waitForPreviewReadiness } = module;

class FakeLink extends EventTarget {
  sheet = null;
  listeners = 0;
  addEventListener(type, listener, options) {
    if (type === 'load' || type === 'error') this.listeners += 1;
    super.addEventListener(type, listener, options);
  }
  removeEventListener(type, listener, options) {
    if ((type === 'load' || type === 'error') && this.listeners) this.listeners -= 1;
    super.removeEventListener(type, listener, options);
  }
}

function frames() {
  let next = 1;
  const pending = new Map();
  return {
    request(callback) {
      const handle = next++;
      pending.set(handle, callback);
      queueMicrotask(() => {
        if (!pending.has(handle)) return;
        pending.delete(handle);
        callback(performance.now());
      });
      return handle;
    },
    cancel(handle) { pending.delete(handle); },
    count() { return pending.size; },
  };
}

test('preview readiness reports actual successful resources and frames', async () => {
  const link = new FakeLink();
  link.sheet = {};
  const scheduler = frames();
  const result = await waitForPreviewReadiness({
    links: [link],
    fonts: { load: async () => [{}], ready: Promise.resolve(), check: () => true },
    signal: new AbortController().signal,
    requestFrame: scheduler.request,
    cancelFrame: scheduler.cancel,
    timeoutMs: 30,
  });
  assert.deepEqual(result, { styles: 'ready', fonts: 'ready', frames: 'ready' });
  assert.equal(link.listeners, 0);
  assert.equal(scheduler.count(), 0);
});

test('hung stylesheet and fonts degrade within one bounded window and clean listeners', async () => {
  const link = new FakeLink();
  const never = new Promise(() => {});
  const started = performance.now();
  const result = await waitForPreviewReadiness({
    links: [link],
    fonts: { load: () => never, ready: never, check: () => false },
    signal: new AbortController().signal,
    timeoutMs: 20,
  });
  assert.deepEqual(result, { styles: 'timed-out', fonts: 'skipped', frames: 'skipped' });
  assert(performance.now() - started < 200, 'fallback remains bounded');
  assert.equal(link.listeners, 0);
  link.dispatchEvent(new Event('load'));
  assert.deepEqual(result, { styles: 'timed-out', fonts: 'skipped', frames: 'skipped' });
});

test('stylesheet failure is distinct from timeout and does not claim readiness', async () => {
  const link = new FakeLink();
  const resultPromise = waitForPreviewReadiness({
    links: [link], signal: new AbortController().signal, timeoutMs: 40,
  });
  link.dispatchEvent(new Event('error'));
  assert.deepEqual(await resultPromise, { styles: 'failed', fonts: 'skipped', frames: 'skipped' });
  assert.equal(link.listeners, 0);
});

test('abort clears stylesheet listeners and scheduled frames without late completion', async () => {
  const link = new FakeLink();
  const scheduler = frames();
  const controller = new AbortController();
  const resultPromise = waitForPreviewReadiness({
    links: [link],
    signal: controller.signal,
    requestFrame: scheduler.request,
    cancelFrame: scheduler.cancel,
    timeoutMs: 100,
  });
  controller.abort();
  assert.deepEqual(await resultPromise, { styles: 'aborted', fonts: 'skipped', frames: 'aborted' });
  assert.equal(link.listeners, 0);
  assert.equal(scheduler.count(), 0);
});

test('font readiness begins only after styles and requires a registered loaded face', async () => {
  const link = new FakeLink();
  let loadCalls = 0;
  const resultPromise = waitForPreviewReadiness({
    links: [link],
    fonts: { load: async () => { loadCalls += 1; return []; }, ready: Promise.resolve(), check: () => false },
    signal: new AbortController().signal,
    timeoutMs: 40,
  });
  assert.equal(loadCalls, 0, 'font loading waits for stylesheet registration');
  link.sheet = {};
  link.dispatchEvent(new Event('load'));
  assert.deepEqual(await resultPromise, { styles: 'ready', fonts: 'failed', frames: 'skipped' });
  assert.equal(loadCalls, 1, 'font load is attempted once');
});

test('synchronous font errors report failure and leave no deadline work behind', async () => {
  const result = await waitForPreviewReadiness({
    links: [],
    fonts: { load: () => { throw new Error('font unavailable'); }, ready: Promise.resolve(), check: () => false },
    signal: new AbortController().signal,
    timeoutMs: 40,
  });
  assert.deepEqual(result, { styles: 'ready', fonts: 'failed', frames: 'skipped' });
});

test('styles and fonts share one total deadline instead of stacking timeouts', async () => {
  const link = new FakeLink();
  const never = new Promise(() => {});
  const started = performance.now();
  const resultPromise = waitForPreviewReadiness({
    links: [link],
    fonts: { load: () => never, ready: never, check: () => false },
    signal: new AbortController().signal,
    timeoutMs: 30,
  });
  setTimeout(() => { link.sheet = {}; link.dispatchEvent(new Event('load')); }, 20);
  assert.deepEqual(await resultPromise, { styles: 'ready', fonts: 'timed-out', frames: 'skipped' });
  assert(performance.now() - started < 200, 'readiness remains bounded');
  assert.equal(link.listeners, 0);
  assert.match(source, /const startedAt = performance\.now\(\)/);
  assert.match(source, /const remaining = \(\) => Math\.max\(0, timeoutMs - \(performance\.now\(\) - startedAt\)\)/);
  assert.match(source, /const budget = remaining\(\)/);
});

test('synchronous frame scheduler errors report failure', async () => {
  const result = await waitForPreviewReadiness({
    links: [],
    signal: new AbortController().signal,
    requestFrame: () => { throw new Error('frame unavailable'); },
    cancelFrame: () => {},
    timeoutMs: 40,
  });
  assert.deepEqual(result, { styles: 'ready', fonts: 'skipped', frames: 'failed' });
});

test('partial stylesheet listener registration failure cleans earlier listeners', async () => {
  const link = new FakeLink();
  const original = link.addEventListener.bind(link);
  link.addEventListener = (type, listener, options) => {
    if (type === 'error') throw new Error('listener unavailable');
    original(type, listener, options);
  };
  const result = await waitForPreviewReadiness({
    links: [link], signal: new AbortController().signal, timeoutMs: 40,
  });
  assert.deepEqual(result, { styles: 'failed', fonts: 'skipped', frames: 'skipped' });
  assert.equal(link.listeners, 0);
});

test('repeated timeout attempts do not accumulate listeners', async () => {
  const link = new FakeLink();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await waitForPreviewReadiness({
      links: [link], signal: new AbortController().signal, timeoutMs: 5,
    });
    assert.equal(result.styles, 'timed-out');
    assert.equal(link.listeners, 0);
  }
});

test('LayoutViewport mounts readable content after bounded readiness and aborts on cleanup', () => {
  assert.match(viewportSource, /waitForPreviewReadiness\(\{/);
  assert.match(viewportSource, /readinessController\.abort\(\)/);
  assert.match(viewportSource, /result\.styles === 'aborted'/);
  assert.match(viewportSource, /dataset\.previewReadiness/);
  assert.match(viewportSource, /mount && styleReady && createPortal/);
  assert.doesNotMatch(viewportSource, /Promise\.all\(\[\.\.\.mirroredStyles/);
});
