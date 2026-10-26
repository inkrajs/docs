import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { browserSuite } from '../browser-checks.mjs';
import { digest } from '../browser-plan.mjs';
import { browserPlan, checkBrowserReports, writeBrowserReport } from '../browser-report.mjs';

function selectionFor(suite, selectedScripts = suite) {
  const selected = suite.filter(script => selectedScripts.includes(script));
  const plan = {
    schemaVersion: 1,
    repository: 'inkrajs/docs',
    eventName: 'pull_request',
    testedRevision: 'a'.repeat(40),
    baseRevision: 'b'.repeat(40),
    pullRequestHeadRevision: 'c'.repeat(40),
    mode: selected.length === suite.length ? 'full' : 'incremental',
    reasons: [],
    changedEntries: [],
    fullSuite: [...suite],
    fullSuiteDigest: digest(suite),
    selectedScripts: selected,
    selectedDigest: digest(selected),
    selectedCount: selected.length,
    skippedScripts: suite.filter(script => !selected.includes(script)),
    skippedCount: suite.length - selected.length,
    shardCount: Math.min(4, selected.length),
  };
  return { ...plan, planDigest: digest(plan) };
}

function reportsFor(selection) {
  return Array.from({ length: selection.shardCount }, (_, index) => {
    const plan = browserPlan(selection.selectedScripts, `${index + 1}/${selection.shardCount}`, selection);
    return { ...plan, results: plan.scripts.map(script => ({ script, status: 'passed', durationMs: 1 })) };
  });
}

for (const homepage of [false, true]) {
  test(`dynamic shards cover a selected suite once (homepage=${homepage})`, () => {
    const suite = browserSuite(homepage);
    const selected = suite.slice(0, 7);
    const selection = selectionFor(suite, selected);
    const reports = reportsFor(selection);
    assert.equal(selection.shardCount, 4);
    assert.deepEqual(reports.flatMap(report => report.scripts).sort(), [...selected].sort());
    checkBrowserReports(reports.reverse(), selection, suite);
    assert.deepEqual(browserPlan(suite).scripts, suite);
  });
}

test('small selections use only the required shard count and empty selections require no reports', () => {
  const suite = browserSuite();
  for (const count of [1, 2, 3]) {
    const selection = selectionFor(suite, suite.slice(0, count));
    assert.equal(selection.shardCount, count);
    checkBrowserReports(reportsFor(selection), selection, suite);
  }
  const empty = selectionFor(suite, []);
  assert.equal(empty.shardCount, 0);
  checkBrowserReports([], empty, suite);
  assert.throws(() => checkBrowserReports([{ index: 1 }], empty, suite));
});

test('invalid shard configurations fail before running checks', () => {
  const suite = browserSuite();
  for (const shard of ['', '0/4', '5/4', '1/0', '1/999', '1.5/4', 'NaN/4', '01/4', '1/9007199254740992']) {
    assert.throws(() => browserPlan(suite, shard));
  }
  assert.throws(() => browserPlan([], '1/1'));
  assert.throws(() => browserPlan(['verify-one', 'verify-one']));
  assert.throws(() => browserPlan(['../verify-one']));
});

test('coverage gate rejects missing, duplicate, stale, incomplete, failed and wrong-plan evidence', () => {
  const suite = browserSuite();
  const selection = selectionFor(suite, suite.slice(0, 9));
  const mutations = [
    reports => reports.pop(),
    reports => reports.push(reports[0]),
    reports => { reports[1] = reports[0]; },
    reports => { reports[0].planDigest = 'stale'; },
    reports => { reports[0].selectionDigest = 'stale'; },
    reports => { reports[0].testedRevision = 'd'.repeat(40); },
    reports => { reports[0].scripts.reverse(); },
    reports => { reports[0].results.pop(); },
    reports => { reports[0].results[1] = reports[0].results[0]; },
    reports => { reports[0].results[0].status = 'failed'; },
    reports => { reports[0].results[0].status = 'skipped'; },
    reports => { reports[0].results[0].durationMs = -1; },
    reports => { reports[0].count = 3; },
    reports => { reports[0].index = 0; },
  ];
  for (const mutate of mutations) {
    const reports = structuredClone(reportsFor(selection));
    mutate(reports);
    assert.throws(() => checkBrowserReports(reports, selection, suite));
  }
  assert.throws(() => checkBrowserReports(reportsFor(selection), selection, browserSuite(true)));
});

test('failed runs persist machine-readable plan identity and a duration summary', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'inkra-browser-report-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const selection = selectionFor(browserSuite(), browserSuite().slice(0, 5));
  const report = reportsFor(selection)[0];
  report.results[0] = { ...report.results[0], status: 'failed', durationMs: 1234, error: 'timeout' };
  const summary = join(directory, 'summary.md');
  await writeBrowserReport(report, directory, summary);
  assert.deepEqual(JSON.parse(await readFile(join(directory, `browser-1-of-${selection.shardCount}.json`), 'utf8')), report);
  const text = await readFile(summary, 'utf8');
  assert.match(text, /failed \| 1\.2/);
  assert.match(text, new RegExp(selection.planDigest));
});
