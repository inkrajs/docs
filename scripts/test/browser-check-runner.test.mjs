import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBrowserChecks, runBrowserScript } from '../browser-check-runner.mjs';

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

test('browser runner can collect every failure while completing all checks', async () => {
  const completed = [];
  await assert.rejects(runBrowserChecks(['fail-one', 'pass', 'fail-two', 'last'], {
    workers: 2, failFast: false, run: async script => {
      await setTimeout(2);
      completed.push(script);
      if (script.startsWith('fail')) throw new Error(script);
    },
  }), error => error instanceof AggregateError && error.errors.length === 2);
  assert.deepEqual(completed.sort(), ['fail-one', 'fail-two', 'last', 'pass']);
});

test('runner records timing and errors without omitting subsequent checks', async () => {
  const results = [];
  await assert.rejects(runBrowserChecks(['fail', 'pass'], {
    failFast: false, onResult: result => results.push(result),
    run: async script => { if (script === 'fail') throw Error('intentional failure'); },
  }), /intentional failure/);
  assert.deepEqual(results.map(result => result.status), ['failed', 'passed']);
  assert.equal(results[0].error, 'intentional failure');
  assert(results.every(result => Number.isFinite(result.durationMs) && result.durationMs >= 0));
});

test('real child output is saved and a stuck child is terminated', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'inkra-browser-runner-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'verify-pass.mjs'), "console.log('stdout marker'); console.error('stderr marker');");
  await writeFile(join(directory, 'verify-stuck.mjs'), [
    "import { spawn } from 'node:child_process';",
    "console.log('started'); process.on('SIGTERM', () => {});",
    "if (process.platform !== 'win32') spawn(process.execPath, ['-e', 'setInterval(() => {}, 100)'], { stdio: 'inherit' });",
    "setInterval(() => {}, 100);",
  ].join('\n'));
  const options = { scriptDirectory: directory, logDirectory: join(directory, 'logs') };
  await runBrowserScript('verify-pass', options);
  const log = await readFile(join(directory, 'logs/verify-pass.log'), 'utf8');
  assert.match(log, /stdout marker/);
  assert.match(log, /stderr marker/);
  await assert.rejects(runBrowserScript('verify-stuck', { ...options, timeoutMs: 500, killGraceMs: 50 }), /timed out/);
  assert.match(await readFile(join(directory, 'logs/verify-stuck.log'), 'utf8'), /started/);
});
