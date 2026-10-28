import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { browserSuite } from '../browser-checks.mjs';
import { browserPlan, checkBrowserReports } from '../browser-report.mjs';
import { applyBrowserLocalValidation, browserLocalEnvironment, browserLocalValidationGroups, validateBrowserLocalValidation } from '../browser-local-validation.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const suite = ['verify-log-refinement', 'verify-number-ticker-exact', 'verify-utility-components', 'verify-grid-docs'];
const allowedGroups = browserLocalValidationGroups(suite);
const head = 'a'.repeat(40), base = 'b'.repeat(40), candidateSha256 = 'c'.repeat(64);
const options = { allowedGroups, candidateSha256 };

function planFor(selectedScripts = suite) {
  const plan = {
    schemaVersion: 1, repository: 'inkrajs/docs', eventName: 'pull_request',
    testedRevision: head, baseRevision: base, pullRequestHeadRevision: head,
    mode: selectedScripts.length === suite.length ? 'full' : 'incremental',
    reasons: [], changedEntries: [], fullSuite: [...suite], fullSuiteDigest: digest(suite),
    selectedScripts: [...selectedScripts], selectedDigest: digest(selectedScripts), selectedCount: selectedScripts.length,
    skippedScripts: suite.filter(script => !selectedScripts.includes(script)), skippedCount: suite.length - selectedScripts.length,
    shardCount: Math.min(4, selectedScripts.length),
  };
  return { ...plan, planDigest: digest(plan) };
}
function attestation(group = 'browser:log', environments = [browserLocalEnvironment]) {
  return {
    schemaVersion: 1, accepted: true, repository: 'inkrajs/docs', head, base, candidateSha256,
    targetRevision: head, headTree: 'e'.repeat(40), targetTree: 'e'.repeat(40), browserGroups: structuredClone(allowedGroups),
    actor: { id: 51358815, login: 'NWYLZW' }, prNumber: 25, reasons: [],
    declarations: [{ group, environments, evidence: 'https://example.invalid/local-report/25', reason: 'Desktop/mobile and keyboard checks passed locally' }],
  };
}

test('local confirmation removes only exact owned browser checks and keeps mixed-module coverage online', () => {
  const next = applyBrowserLocalValidation(planFor(), attestation(), options);
  assert.deepEqual(next.selectedScripts, suite.slice(1));
  assert.deepEqual(next.localValidation.exemptedScripts, ['verify-log-refinement']);
  assert(next.selectedScripts.includes('verify-utility-components'), 'mixed Log/Slot/Hotkey coverage remains online');
  assert.equal(next.selectedCount, 3);
  assert.equal(next.shardCount, 3);
  assert.notEqual(next.planDigest, planFor().planDigest);
  assert.equal(next.mode, 'incremental');
  validateBrowserLocalValidation(next, suite, options);
});

test('unaccepted and unmatched environment declarations keep normal coverage without an exemption receipt', () => {
  const plan = planFor();
  assert.equal(applyBrowserLocalValidation(plan, { ...attestation(), accepted: false }, options), plan);
  assert.equal(applyBrowserLocalValidation(plan, null, options), plan);
  assert.equal(applyBrowserLocalValidation(plan, attestation('browser:log', ['another-environment']), options), plan);
  assert.equal(applyBrowserLocalValidation(planFor(suite.slice(1)), attestation(), options).localValidation, undefined);
});

test('head/base, repository and actor bindings cannot be borrowed from another PR', () => {
  for (const patch of [
    { head: 'c'.repeat(40) }, { base: 'c'.repeat(40) }, { repository: 'another/repo' },
    { actor: { id: 0, login: 'NWYLZW' } }, { actor: { id: 51358815, login: '' } }, { prNumber: 0 },
  ]) assert.throws(() => applyBrowserLocalValidation(planFor(), { ...attestation(), ...patch }, options));
  const mergeRevision = 'd'.repeat(40);
  const merge = { ...planFor(), testedRevision: mergeRevision };
  assert.throws(() => applyBrowserLocalValidation(merge, attestation(), options), 'a receipt cannot silently move to a merge preview');
  const mergedAttestation = { ...attestation(), targetRevision: mergeRevision };
  assert.doesNotThrow(() => applyBrowserLocalValidation(merge, mergedAttestation, options), 'verified identical tree supports the bound merge preview');
  const release = { ...merge, pullRequestHeadRevision: null };
  assert.doesNotThrow(() => applyBrowserLocalValidation(release, mergedAttestation, options), 'release uses a verified identical merged tree');
  assert.throws(() => applyBrowserLocalValidation(release, { ...mergedAttestation, targetTree: 'f'.repeat(40) }, options));
});

test('unknown groups, malformed evidence and duplicate declarations fail closed', () => {
  assert.throws(() => applyBrowserLocalValidation(planFor(), attestation('browser:unknown'), options));
  for (const patch of [
    { evidence: 'file:///tmp/report.json' }, { evidence: 'https://user:secret@example.invalid/report' },
    { reason: ' ' }, { environments: [] },
  ]) {
    const declaration = attestation();
    Object.assign(declaration.declarations[0], patch);
    assert.throws(() => applyBrowserLocalValidation(planFor(), declaration, options));
  }
  const duplicate = attestation(); duplicate.declarations.push({ ...duplicate.declarations[0] });
  assert.throws(() => applyBrowserLocalValidation(planFor(), duplicate, options));
  assert.throws(() => applyBrowserLocalValidation(planFor(), attestation(), { allowedGroups: { 'browser:log': ['verify-missing'] } }));
});

test('all locally confirmed checks produce a trusted zero-run plan and never silently waive another test', () => {
  const plan = planFor(['verify-log-refinement']);
  const next = applyBrowserLocalValidation(plan, attestation(), options);
  assert.deepEqual(next.selectedScripts, []);
  assert.equal(next.shardCount, 0);
  assert.equal(next.selectedCount, 0);
  assert.deepEqual(next.localValidation.originalSelectedScripts, ['verify-log-refinement']);
  validateBrowserLocalValidation(next, suite, options);
  assert.throws(() => applyBrowserLocalValidation(next, attestation(), options), 'double application is rejected');
});

test('browser evidence cannot waive a different candidate even when docs commits match', () => {
  assert.throws(() => applyBrowserLocalValidation(planFor(), attestation(), { allowedGroups }));
  assert.throws(() => applyBrowserLocalValidation(planFor(), attestation(), { allowedGroups, candidateSha256: 'd'.repeat(64) }));
  const next = applyBrowserLocalValidation(planFor(), attestation(), options);
  assert.throws(() => validateBrowserLocalValidation(next, suite, { allowedGroups, candidateSha256: 'd'.repeat(64) }));
  next.localValidation.attestation.candidateSha256 = 'd'.repeat(64);
  assert.throws(() => validateBrowserLocalValidation(next, suite, options));
});

test('PR-side group changes cannot widen the trusted base policy', () => {
  const broader = { ...allowedGroups, 'browser:log': ['verify-log-refinement', 'verify-grid-docs'] };
  assert.throws(() => applyBrowserLocalValidation(planFor(), attestation(), { allowedGroups: broader, candidateSha256 }));
  const next = applyBrowserLocalValidation(planFor(), attestation(), { candidateSha256 });
  assert(next.selectedScripts.includes('verify-grid-docs'));
  assert.doesNotThrow(() => validateBrowserLocalValidation(next, suite, { candidateSha256 }));
});

test('receipt validation rejects policy, environment, partition and approved-group tampering', () => {
  const original = applyBrowserLocalValidation(planFor(), attestation(), options);
  for (const mutate of [
    plan => { plan.localValidation.environment = 'wrong'; },
    plan => { plan.localValidation.candidateSha256 = 'd'.repeat(64); },
    plan => { plan.localValidation.allowedGroupsDigest = 'wrong'; },
    plan => { plan.localValidation.exemptedScripts.push('verify-grid-docs'); },
    plan => { plan.localValidation.exemptedGroups.push('browser:verify-grid-docs'); },
    plan => { plan.selectedScripts.pop(); },
    plan => { plan.localValidation.originalSelectedScripts.push('verify-missing'); },
    plan => { plan.localValidation.attestation.head = 'c'.repeat(40); },
    plan => { plan.localValidation.attestation.base = 'c'.repeat(40); },
    plan => { plan.localValidation.attestation.targetRevision = 'c'.repeat(40); },
    plan => { plan.localValidation.attestation.targetTree = 'c'.repeat(40); },
    plan => { plan.localValidation.attestation.browserGroups['browser:log'].push('verify-grid-docs'); },
    plan => { plan.mode = 'full'; },
  ]) {
    const changed = structuredClone(original); mutate(changed);
    assert.throws(() => validateBrowserLocalValidation(changed, suite, options));
  }
});

test('checked-in policy exposes only current exact browser tests with explicit runtime and authorized user', async () => {
  const policy = JSON.parse(await readFile(new URL('../../.github/local-validation-policy.json', import.meta.url), 'utf8'));
  assert.deepEqual(policy.browser_groups, browserLocalValidationGroups(browserSuite(true)));
  assert.deepEqual(policy.allowed_users, [{ id: 51358815, login: 'NWYLZW' }]);
  for (const group of Object.keys(policy.browser_groups)) assert.deepEqual(policy.allowed_groups[group], [browserLocalEnvironment]);
  assert.equal(Object.keys(policy.allowed_groups).length, Object.keys(policy.browser_groups).length);
});

test('coverage gate requires online passes for every nonconfirmed check and accepts only a trusted empty plan', () => {
  const plan = applyBrowserLocalValidation(planFor(), attestation(), options);
  const reports = Array.from({ length: plan.shardCount }, (_, index) => {
    const shard = browserPlan(plan.selectedScripts, `${index + 1}/${plan.shardCount}`, plan);
    return { ...shard, results: shard.scripts.map(script => ({ script, status: 'passed', durationMs: 1 })) };
  });
  checkBrowserReports(reports, plan, suite);
  assert.throws(() => checkBrowserReports(reports.slice(1), plan, suite), 'local confirmation cannot hide an absent online shard');
  const failed = structuredClone(reports);
  failed[0].results[0].status = 'failed';
  assert.throws(() => checkBrowserReports(failed, plan, suite), 'online failures remain blocking');
  const empty = applyBrowserLocalValidation(planFor(['verify-log-refinement']), attestation(), options);
  checkBrowserReports([], empty, suite);
  assert.throws(() => checkBrowserReports(reports, empty, suite), 'a fully local plan still rejects unrelated evidence');
});

test('CLI writes a resealed trusted plan, dynamic job outputs and an explicit local-confirmation summary', async t => {
  const root = await mkdtemp(join(tmpdir(), 'inkra-browser-local-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'));
  await mkdir(join(root, '.github'));
  for (const file of ['browser-local-validation.mjs', 'browser-plan.mjs', 'browser-checks.mjs']) {
    await copyFile(new URL(`../${file}`, import.meta.url), join(root, 'scripts', file));
  }
  await writeFile(join(root, '.github/local-validation-policy.json'), JSON.stringify({ browser_groups: allowedGroups }));
  await writeFile(join(root, 'library-candidate.json'), JSON.stringify({ sha256: candidateSha256 }));
  await writeFile(join(root, 'plan.json'), JSON.stringify(planFor()));
  await writeFile(join(root, 'attestation.json'), JSON.stringify(attestation()));
  const outputs = join(root, 'outputs'), summary = join(root, 'summary');
  const stdout = execFileSync(process.execPath, [
    join(root, 'scripts/browser-local-validation.mjs'), '--plan', join(root, 'plan.json'),
    '--attestation', join(root, 'attestation.json'),
  ], { cwd: root, env: { ...process.env, EXPECTED_CANDIDATE_SHA256: candidateSha256, GITHUB_OUTPUT: outputs, GITHUB_STEP_SUMMARY: summary }, encoding: 'utf8' });
  const next = JSON.parse(await readFile(join(root, 'plan.json'), 'utf8'));
  validateBrowserLocalValidation(next, suite, options);
  assert.match(await readFile(outputs, 'utf8'), /selected_count=3/);
  assert.match(await readFile(outputs, 'utf8'), new RegExp(`plan_digest=${next.planDigest}`));
  assert.match(await readFile(summary, 'utf8'), /NWYLZW.*51358815/);
  assert.match(stdout, /not an online test pass/);
});
