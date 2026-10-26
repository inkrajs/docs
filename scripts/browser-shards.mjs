import { browserTimings } from './browser-timings.mjs';

export function balancedBrowserShards(scripts, count, timings = browserTimings) {
  const shards = Array.from({ length: count }, () => ({ scripts: [], load: 0 }));
  const duration = script => Number.isFinite(timings[script]) && timings[script] > 0 ? timings[script] : 30000;
  // Longest first keeps the two workers busy; stable suite order breaks ties.
  const ordered = scripts.map((script, index) => ({ script, index }))
    .sort((a, b) => duration(b.script) - duration(a.script) || a.index - b.index);
  for (const { script } of ordered) {
    const shard = shards.reduce((best, next) => next.load < best.load ? next : best);
    shard.scripts.push(script);
    shard.load += duration(script);
  }
  return shards.map(shard => shard.scripts);
}
