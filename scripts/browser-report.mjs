import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { digest, validateBrowserSelectionPlan } from './browser-plan.mjs';

export function browserPlan(scripts, shard, selection) {
  assert(scripts.length > 0 && new Set(scripts).size === scripts.length, 'Browser suite must be nonempty and unique');
  assert(scripts.every(script => /^verify-[a-z0-9-]+$/.test(script)), 'Invalid browser check name');
  assert(shard === undefined || /^[1-9]\d*\/[1-9]\d*$/.test(shard), 'BROWSER_SHARD must be index/count');
  const [index, count] = shard === undefined ? [1, 1] : shard.split('/').map(Number);
  assert(Number.isSafeInteger(index) && Number.isSafeInteger(count) && index <= count && count <= scripts.length, 'Invalid browser shard bounds');
  return {
    schemaVersion: 2,
    fullSuiteDigest: selection?.fullSuiteDigest ?? createHash('sha256').update(JSON.stringify(scripts)).digest('hex'),
    selectionDigest: selection?.selectedDigest ?? digest(scripts),
    planDigest: selection?.planDigest ?? null,
    testedRevision: selection?.testedRevision ?? null,
    fullSuiteCount: selection?.fullSuite.length ?? scripts.length,
    selectedCount: scripts.length,
    index,
    count,
    scripts: scripts.filter((_, position) => position % count === index - 1),
  };
}

export function checkBrowserReports(reports, selection, suite) {
  validateBrowserSelectionPlan(selection, suite);
  if (selection.selectedCount === 0) {
    assert.deepEqual(reports, [], 'Empty browser plans must not have shard reports');
    return;
  }
  const count = selection.shardCount;
  assert.equal(reports.length, count, 'Missing or extra browser shard reports');
  const indexes = new Set();
  for (const report of reports) {
    assert(!indexes.has(report.index), 'Duplicate browser shard report');
    indexes.add(report.index);
    const plan = browserPlan(selection.selectedScripts, `${report.index}/${count}`, selection);
    for (const key of ['schemaVersion', 'fullSuiteDigest', 'selectionDigest', 'planDigest', 'testedRevision', 'fullSuiteCount', 'selectedCount', 'index', 'count', 'scripts']) {
      assert.deepEqual(report[key], plan[key], `Browser report ${key} mismatch`);
    }
    assert.equal(report.results.length, plan.scripts.length, 'Incomplete browser shard');
    assert.deepEqual(report.results.map(result => result.script).sort(), [...plan.scripts].sort(), 'Missing or duplicate browser checks');
    for (const result of report.results) {
      assert.equal(result.status, 'passed', `Browser check failed: ${result.script}`);
      assert(Number.isFinite(result.durationMs) && result.durationMs >= 0, 'Invalid browser duration');
    }
  }
  assert.deepEqual(
    reports.flatMap(report => report.results.map(result => result.script)).sort(),
    [...selection.selectedScripts].sort(),
    'Selected browser checks were not covered exactly once',
  );
}

export async function writeBrowserReport(report, directory = '.ci-results', summary = process.env.GITHUB_STEP_SUMMARY) {
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `browser-${report.index}-of-${report.count}.json`), JSON.stringify(report, null, 2) + '\n');
  const rows = [...report.results].sort((a, b) => b.durationMs - a.durationMs)
    .map(result => `| ${result.script} | ${result.status} | ${(result.durationMs / 1000).toFixed(1)} |`);
  const markdown = `### Browser shard ${report.index}/${report.count}\n\n${report.results.length}/${report.scripts.length} selected checks completed (${report.selectedCount}/${report.fullSuiteCount} selected overall).\n\nPlan: \`${report.planDigest ?? 'local-full-suite'}\`\n\n| Check | Result | Seconds |\n| --- | --- | ---: |\n${rows.join('\n')}\n`;
  if (summary) await appendFile(summary, markdown);
}
