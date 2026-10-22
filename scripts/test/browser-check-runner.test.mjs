import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { runBrowserChecks } from '../browser-check-runner.mjs';

for (const workers of [1, 2]) {
  test(`browser runner executes every check once with at most ${workers} workers`, async () => {
    let active = 0;
    let peak = 0;
    const completed = [];
    const scripts = ['one', 'two', 'three', 'four'];
    await runBrowserChecks(scripts, { workers, run: async script => {
      peak = Math.max(peak, ++active);
      await setTimeout(5);
      completed.push(script);
      active--;
    } });
    assert.equal(peak, workers);
    assert.equal(active, 0);
    assert.deepEqual(completed.sort(), [...scripts].sort());
  });
}

test('browser runner stops scheduling after failure and waits for active cleanup', async () => {
  const started = [];
  let cleaned = false;
  await assert.rejects(runBrowserChecks(['fail', 'active', 'never'], { workers: 2, run: async script => {
    started.push(script);
    if (script === 'fail') { await setTimeout(1); throw new Error('check failed'); }
    await setTimeout(10);
    cleaned = true;
  } }), /check failed/);
  assert.deepEqual(started, ['fail', 'active']);
  assert(cleaned);
});

test('browser runner rejects unbounded concurrency', async () => {
  for (const workers of [0, 3, NaN]) {
    await assert.rejects(runBrowserChecks([], { workers }), /must be 1 or 2/);
  }
});
