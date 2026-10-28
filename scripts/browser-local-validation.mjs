import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserSuite } from './browser-checks.mjs';

export const browserLocalEnvironment = 'chromium-playwright1.64.1-react19.3.1';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sha = /^[0-9a-f]{40}$/;
const sha256 = /^[0-9a-f]{64}$/;

// Aliases intentionally contain only exclusively owned checks. For example,
// verify-utility-components also covers Slot/Hotkey and cannot be waived by Log.
export function browserLocalValidationGroups(suite = browserSuite(true)) {
  const groups = Object.fromEntries(suite.map(script => [`browser:${script}`, [script]]));
  groups['browser:log'] = ['verify-log-refinement'].filter(script => suite.includes(script));
  groups['browser:number-ticker'] = ['verify-number-ticker-exact', 'verify-number-ticker-morph', 'verify-number-ticker-compact']
    .filter(script => suite.includes(script));
  return groups;
}

function ordered(suite, values) {
  return suite.filter(script => values.includes(script));
}

function validateAttestation(attestation, plan) {
  assert.equal(attestation?.accepted, true, 'Browser exemption requires an accepted local validation');
  assert.equal(attestation.repository, 'inkrajs/docs', 'Local validation repository mismatch');
  assert(sha.test(attestation.head), 'Invalid local validation head');
  assert(sha.test(attestation.base), 'Invalid local validation base');
  assert.equal(attestation.targetRevision, plan.testedRevision, 'Local validation target revision mismatch');
  assert(sha.test(attestation.headTree) && sha.test(attestation.targetTree), 'Local validation needs exact source tree identities');
  assert.equal(attestation.targetTree, attestation.headTree, 'Local validation target tree differs from the tested PR head');
  if (plan.pullRequestHeadRevision) {
    assert.equal(attestation.head, plan.pullRequestHeadRevision, 'Local validation must match the requested PR head');
  }
  assert.equal(attestation.base, plan.baseRevision, 'Local validation must match the PR base');
  assert(Number.isSafeInteger(attestation.actor?.id) && attestation.actor.id > 0, 'Local validation has no actor identity');
  assert(typeof attestation.actor?.login === 'string' && attestation.actor.login.length > 0, 'Local validation has no actor login');
  assert(Number.isSafeInteger(attestation.prNumber) && attestation.prNumber > 0, 'Local validation has no PR number');
  assert(Array.isArray(attestation.declarations), 'Local validation declarations are missing');
  assert(attestation.browserGroups && typeof attestation.browserGroups === 'object' && !Array.isArray(attestation.browserGroups),
    'Local validation needs the trusted base browser group policy');
}

function trustedGroups(attestation, requestedGroups) {
  if (requestedGroups) assert.deepEqual(requestedGroups, attestation.browserGroups, 'Browser group policy must match the trusted PR base');
  return attestation.browserGroups;
}

function eligibleGroups(attestation, environment, allowedGroups, suite) {
  const groups = [];
  const seen = new Set();
  for (const declaration of attestation.declarations) {
    assert(declaration && typeof declaration.group === 'string', 'Invalid local validation group');
    assert(!seen.has(declaration.group), 'Duplicate local validation group');
    seen.add(declaration.group);
    assert(Object.hasOwn(allowedGroups, declaration.group), `Unsupported browser group: ${declaration.group}`);
    const scripts = allowedGroups[declaration.group];
    assert(Array.isArray(scripts) && scripts.length > 0 && new Set(scripts).size === scripts.length
      && scripts.every(script => suite.includes(script)), 'Browser group contains an unknown or duplicate check');
    assert(Array.isArray(declaration.environments) && declaration.environments.length > 0,
      'Local validation environments are missing');
    assert(typeof declaration.reason === 'string' && declaration.reason.trim().length > 0, 'Local validation reason is missing');
    const evidence = new URL(declaration.evidence);
    assert(['http:', 'https:'].includes(evidence.protocol) && !evidence.username && !evidence.password,
      'Local validation evidence must be an HTTP(S) report URL without credentials');
    if (declaration.environments.includes(environment)) groups.push(declaration.group);
  }
  return groups;
}

export function applyBrowserLocalValidation(plan, attestation, {
  environment = browserLocalEnvironment,
  allowedGroups,
  candidateSha256,
} = {}) {
  if (!attestation?.accepted) return plan;
  assert(!plan.localValidation, 'A browser selection may apply local validation only once');
  validateAttestation(attestation, plan);
  allowedGroups = trustedGroups(attestation, allowedGroups);
  const groups = eligibleGroups(attestation, environment, allowedGroups, plan.fullSuite);
  const exemptedScripts = ordered(plan.fullSuite, groups.flatMap(group => allowedGroups[group]))
    .filter(script => plan.selectedScripts.includes(script));
  if (!exemptedScripts.length) return plan;
  assert(sha256.test(candidateSha256), 'Browser exemption requires the current candidate SHA-256');
  assert.equal(attestation.candidateSha256, candidateSha256, 'Browser local validation candidate mismatch');
  const exemptedGroups = groups.filter(group => allowedGroups[group].some(script => exemptedScripts.includes(script)));
  const selectedScripts = plan.selectedScripts.filter(script => !exemptedScripts.includes(script));
  const { planDigest: _oldDigest, ...unsigned } = plan;
  const next = {
    ...unsigned,
    mode: 'incremental',
    selectedScripts,
    selectedDigest: digest(selectedScripts),
    selectedCount: selectedScripts.length,
    skippedScripts: plan.fullSuite.filter(script => !selectedScripts.includes(script)),
    skippedCount: plan.fullSuite.length - selectedScripts.length,
    shardCount: Math.min(4, selectedScripts.length),
    localValidation: {
      schemaVersion: 1,
      environment,
      candidateSha256,
      attestation: structuredClone(attestation),
      originalSelectedScripts: [...plan.selectedScripts],
      exemptedGroups,
      exemptedScripts,
      allowedGroupsDigest: digest(allowedGroups),
    },
  };
  return { ...next, planDigest: digest(next) };
}

export function validateBrowserLocalValidation(plan, suite, {
  allowedGroups,
  candidateSha256 = process.env.EXPECTED_CANDIDATE_SHA256,
} = {}) {
  if (!plan.localValidation) return plan;
  const receipt = plan.localValidation;
  assert.equal(receipt.schemaVersion, 1, 'Unknown browser local validation receipt');
  assert.equal(receipt.environment, browserLocalEnvironment, 'Browser local validation environment mismatch');
  assert(sha256.test(receipt.candidateSha256), 'Invalid browser local validation candidate SHA-256');
  assert.equal(receipt.attestation.candidateSha256, receipt.candidateSha256, 'Browser local validation candidate receipt mismatch');
  if (candidateSha256) assert.equal(receipt.candidateSha256, candidateSha256, 'Browser local validation does not cover the current candidate');
  validateAttestation(receipt.attestation, plan);
  allowedGroups = trustedGroups(receipt.attestation, allowedGroups);
  assert.equal(receipt.allowedGroupsDigest, digest(allowedGroups), 'Browser local validation group policy changed');
  assert.deepEqual(receipt.originalSelectedScripts, ordered(suite, receipt.originalSelectedScripts),
    'Original browser selection must preserve suite order and contain unique checks');
  const eligible = eligibleGroups(receipt.attestation, receipt.environment, allowedGroups, suite);
  const expected = ordered(suite, eligible.flatMap(group => allowedGroups[group]))
    .filter(script => receipt.originalSelectedScripts.includes(script));
  assert(expected.length > 0, 'A browser local validation receipt must exempt at least one selected check');
  assert.deepEqual(receipt.exemptedScripts, expected, 'Browser exemption does not match approved groups');
  assert.deepEqual(receipt.exemptedGroups, eligible.filter(group => allowedGroups[group].some(script => expected.includes(script))),
    'Browser exemption groups mismatch');
  assert.deepEqual(plan.selectedScripts, receipt.originalSelectedScripts.filter(script => !expected.includes(script)),
    'Online and locally confirmed browser checks must partition the original selection');
  assert.equal(plan.mode, 'incremental', 'A local validation browser selection must retain its exemption receipt');
  return plan;
}

async function main() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index], value = process.argv[index + 1];
    assert(['--plan', '--attestation', '--environment', '--output', '--policy', '--candidate'].includes(key) && value,
      `Invalid browser local validation argument: ${key}`);
    assert(!args.has(key), `Duplicate browser local validation argument: ${key}`);
    args.set(key, value);
  }
  const planPath = args.get('--plan');
  const attestationPath = args.get('--attestation');
  assert(planPath && attestationPath, 'Pass --plan and --attestation');
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  const attestation = JSON.parse(await readFile(attestationPath, 'utf8'));
  const environment = args.get('--environment') || browserLocalEnvironment;
  const allowedGroups = args.has('--policy')
    ? JSON.parse(await readFile(args.get('--policy'), 'utf8')).browser_groups : undefined;
  const candidate = JSON.parse(await readFile(args.get('--candidate') || new URL('../library-candidate.json', import.meta.url), 'utf8'));
  const candidateSha256 = candidate.sha256;
  assert(sha256.test(candidateSha256), 'Invalid current candidate SHA-256');
  if (process.env.EXPECTED_CANDIDATE_SHA256) {
    assert.equal(candidateSha256, process.env.EXPECTED_CANDIDATE_SHA256, 'Browser local validation candidate input mismatch');
  }
  const { validateBrowserSelectionPlan } = await import('./browser-plan.mjs');
  validateBrowserSelectionPlan(plan, plan.fullSuite);
  const next = applyBrowserLocalValidation(plan, attestation, { environment, allowedGroups, candidateSha256 });
  validateBrowserSelectionPlan(next, next.fullSuite);
  validateBrowserLocalValidation(next, next.fullSuite, { allowedGroups, candidateSha256 });
  const output = args.get('--output') || planPath;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(next, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, [
      `matrix=${JSON.stringify(Array.from({ length: next.shardCount }, (_, index) => index + 1))}`,
      `shard_count=${next.shardCount}`,
      `selected_count=${next.selectedCount}`,
      `plan_digest=${next.planDigest}`,
      `tested_revision=${next.testedRevision}`,
    ].join('\n') + '\n');
  }
  const receipt = next.localValidation;
  const lines = receipt ? [
    '### Locally confirmed browser tests',
    '',
    `PR #${receipt.attestation.prNumber}, confirmed by ${receipt.attestation.actor.login} (id ${receipt.attestation.actor.id}).`,
    `Head: \`${receipt.attestation.head}\`; base: \`${receipt.attestation.base}\`.`,
    `Environment: \`${receipt.environment}\`.`,
    `Candidate SHA-256: \`${receipt.candidateSha256}\`.`,
    '',
    ...receipt.exemptedGroups.map(group => {
      const declaration = receipt.attestation.declarations.find(item => item.group === group);
      return `- ${group}: ${declaration.reason} ([local report](${declaration.evidence}))`;
    }),
    '',
    `${receipt.exemptedScripts.length} locally confirmed checks are exempted from online execution; ${next.selectedCount} remain online. This is a maintainer attestation, not an online test pass.`,
  ] : ['### Locally confirmed browser tests', '', 'No selected browser tests were exempted; normal online coverage remains.'];
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

// Let this module finish evaluating before the CLI imports browser-plan, which
// imports the pure receipt validator above.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
