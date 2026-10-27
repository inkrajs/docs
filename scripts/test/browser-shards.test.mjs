import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSuite } from '../browser-checks.mjs';
import { balancedBrowserShards } from '../browser-shards.mjs';
import { browserTimings } from '../browser-timings.mjs';

function makespan(scripts) {
  const workers = [0, 0];
  for (const script of scripts) {
    const index = workers[0] <= workers[1] ? 0 : 1;
    workers[index] += browserTimings[script];
  }
  return Math.max(...workers);
}

test('timings are positive measured hints, never a filter for new checks', () => {
  for (const duration of Object.values(browserTimings)) assert(Number.isFinite(duration) && duration > 0);
  const scripts = [...browserSuite(true), 'verify-new-check'];
  for (const count of [1, 2, 3, 4]) {
    const shards = balancedBrowserShards(scripts, count);
    assert(shards.every(shard => shard.length > 0));
    assert.deepEqual(shards.flat().sort(), [...scripts].sort());
    assert.deepEqual(shards, balancedBrowserShards(scripts, count));
  }
});

test('unknown and invalid timings fall back to stable equal scheduling', () => {
  const scripts = ['verify-a', 'verify-b', 'verify-c', 'verify-d'];
  assert.deepEqual(balancedBrowserShards(scripts, 2, { 'verify-a': -1, 'verify-b': NaN }),
    [['verify-a', 'verify-c'], ['verify-b', 'verify-d']]);
});

test('recorded release replay lowers the longest two-worker shard without extra workers', () => {
  // Replay only measurements that existed in this release; new checks still
  // run through the coverage/default-weight tests above, without invented timings.
  const suite = browserSuite(true).filter(script => Object.hasOwn(browserTimings, script));
  assert(suite.length > 100, 'replay retains the recorded release suite');
  const before = Array.from({ length: 4 }, (_, shard) => suite.filter((_, index) => index % 4 === shard));
  const after = balancedBrowserShards(suite, 4);
  const oldMaximum = Math.max(...before.map(makespan));
  const newMaximum = Math.max(...after.map(makespan));
  assert(newMaximum < oldMaximum * 0.85, `${oldMaximum}ms -> ${newMaximum}ms`);
  console.log(`Historical scheduling simulation only: ${oldMaximum}ms -> ${newMaximum}ms`);
});
