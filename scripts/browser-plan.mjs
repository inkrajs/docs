import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const shaPattern = /^[0-9a-f]{40}$/;

export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateBrowserSelectionPlan(plan, suite, { expectedTestedRevision, expectedPlanDigest } = {}) {
  assert.equal(plan.schemaVersion, 1, 'Unsupported browser selection plan schema');
  assert.equal(plan.repository, 'inkrajs/docs', 'Browser plan repository mismatch');
  assert(shaPattern.test(plan.testedRevision), 'Invalid tested revision');
  if (expectedTestedRevision) assert.equal(plan.testedRevision, expectedTestedRevision, 'Browser plan tested revision mismatch');
  assert.deepEqual(plan.fullSuite, suite, 'Browser plan is stale for the current suite');
  assert.equal(plan.fullSuiteDigest, digest(suite), 'Browser plan full suite digest mismatch');
  assert(['full', 'incremental'].includes(plan.mode), 'Invalid browser plan mode');
  assert.deepEqual(plan.selectedScripts, suite.filter(check => plan.selectedScripts.includes(check)), 'Selected checks must preserve suite order and membership');
  assert.equal(new Set(plan.selectedScripts).size, plan.selectedScripts.length, 'Duplicate selected browser checks');
  assert.equal(plan.selectedDigest, digest(plan.selectedScripts), 'Selected browser digest mismatch');
  assert.equal(plan.selectedCount, plan.selectedScripts.length, 'Selected browser count mismatch');
  assert.deepEqual(plan.skippedScripts, suite.filter(check => !plan.selectedScripts.includes(check)), 'Skipped browser list mismatch');
  assert.equal(plan.skippedCount, plan.skippedScripts.length, 'Skipped browser count mismatch');
  assert.equal(plan.shardCount, Math.min(4, plan.selectedCount), 'Browser shard count mismatch');
  const { planDigest, ...unsigned } = plan;
  assert.equal(planDigest, digest(unsigned), 'Browser plan identity mismatch');
  if (expectedPlanDigest) assert.equal(planDigest, expectedPlanDigest, 'Browser plan does not match the trusted build output');
  if (plan.mode === 'full') assert.deepEqual(plan.selectedScripts, suite, 'Full browser plan must select the current suite');
  return plan;
}

export async function readBrowserSelectionPlan(path, suite, options) {
  const plan = JSON.parse(await readFile(path, 'utf8'));
  return validateBrowserSelectionPlan(plan, suite, options);
}
