import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { browserSuite } from '../browser-checks.mjs';
import { browserPlan, checkBrowserReports, writeBrowserReport } from '../browser-report.mjs';

function reportsFor(suite) {
  return Array.from({ length: 4 }, (_, index) => {
    const plan = browserPlan(suite, `${index + 1}/4`);
    return { ...plan, results: plan.scripts.map(script => ({ script, status: 'passed', durationMs: 1 })) };
  });
}

for (const homepage of [false, true]) {
  test(`four shards cover the entire suite once (homepage=${homepage})`, () => {
    const suite = browserSuite(homepage);
    assert.equal(suite.length, homepage ? 103 : 102);
    const reports = reportsFor(suite);
    assert.deepEqual(reports.flatMap(report => report.scripts).sort(), [...suite].sort());
    assert(Math.max(...reports.map(report => report.scripts.length)) <= Math.ceil(suite.length / 4));
    checkBrowserReports(reports.reverse(), suite, 4);
    assert.deepEqual(browserPlan(suite).scripts, suite);
  });
}

test('invalid shard configurations fail before running checks', () => {
  const suite = browserSuite();
  for (const shard of ['', '0/4', '5/4', '1/0', '1/999', '1.5/4', 'NaN/4', '01/4', '1/9007199254740992']) {
    assert.throws(() => browserPlan(suite, shard));
  }
  assert.throws(() => browserPlan([], '1/1'));
  assert.throws(() => browserPlan(['verify-one', 'verify-one']));
  assert.throws(() => browserPlan(['../verify-one']));
});

test('coverage gate rejects missing, duplicate, stale, incomplete and failed evidence', () => {
  const suite = browserSuite();
  const mutations = [
    reports => reports.pop(),
    reports => reports.push(reports[0]),
    reports => { reports[1] = reports[0]; },
    reports => { reports[0].suiteDigest = 'stale'; },
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
    const reports = reportsFor(suite);
    mutate(reports);
    assert.throws(() => checkBrowserReports(reports, suite, 4));
  }
  assert.throws(() => checkBrowserReports(reportsFor(suite), browserSuite(true), 4));
  assert.throws(() => checkBrowserReports([], suite, 0));
});

test('failed runs persist machine-readable results and a duration summary', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'inkra-browser-report-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const report = reportsFor(browserSuite())[0];
  report.results[0] = { ...report.results[0], status: 'failed', durationMs: 1234, error: 'timeout' };
  const summary = join(directory, 'summary.md');
  await writeBrowserReport(report, directory, summary);
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'browser-1-of-4.json'), 'utf8')), report);
  assert.match(await readFile(summary, 'utf8'), /failed \| 1\.2/);
});
