import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserSuite } from './browser-checks.mjs';
import { readBrowserSelectionPlan } from './browser-plan.mjs';
import { checkBrowserReports, checkFullBrowserReports } from './browser-report.mjs';

const directory = process.argv[2] || '.ci-results';
const planPath = process.argv[3] || '.ci-plan/browser-selection.json';
const fullShardCount = /^[1-9]\d*$/.test(planPath) ? Number(planPath) : null;
const suite = browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true');
const actualRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const expectedRevision = process.env.EXPECTED_TESTED_REVISION || process.env.DOCS_REF || actualRevision;
assert.equal(actualRevision, expectedRevision, 'Final browser gate is running against the wrong source revision');
const selection = fullShardCount === null ? await readBrowserSelectionPlan(planPath, suite, {
  expectedTestedRevision: expectedRevision,
  expectedPlanDigest: process.env.EXPECTED_BROWSER_PLAN_DIGEST,
}) : null;
let files = [];
try { files = (await readdir(directory)).filter(file => /^browser-\d+-of-\d+\.json$/.test(file)); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const reports = await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8'))));
const browserResult = process.env.BROWSER_JOB_RESULT;
if (fullShardCount !== null) {
  assert(!process.env.EXPECTED_BROWSER_PLAN_DIGEST, 'A trusted selection plan cannot use full-suite compatibility mode');
  if (browserResult) assert.equal(browserResult, 'success', 'Full browser shards did not succeed');
  checkFullBrowserReports(reports, suite, fullShardCount);
  console.log(`All ${suite.length} full-suite browser checks passed exactly once across ${fullShardCount} shards.`);
} else {
  if (selection.selectedCount === 0) {
    if (browserResult) assert.equal(browserResult, 'skipped', 'Only a trusted empty plan may skip the browser job');
  } else if (browserResult) assert.equal(browserResult, 'success', 'Selected browser shards did not succeed');
  checkBrowserReports(reports, selection, suite);
  if (selection.localValidation) {
    console.log(selection.localValidation.exemptedScripts.length + ' browser checks locally confirmed / CI waived by '
      + selection.localValidation.attestation.actor.login + '; these were not executed online.');
  }
  console.log(selection.selectedCount === 0
    ? `Trusted empty plan ${selection.planDigest}: 0 browser checks selected; browser job correctly skipped.`
    : `All ${selection.selectedCount} selected browser checks passed exactly once across ${selection.shardCount} shards (plan ${selection.planDigest}).`);
}
