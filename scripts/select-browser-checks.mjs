import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { browserSuite } from './browser-checks.mjs';
import { createBrowserSelectionPlan, inspectPullRequestProvenance, parseGitNameStatusZ } from './browser-selection.mjs';

function argumentsMap(values) {
  const result = new Map();
  for (let index = 0; index < values.length; index += 2) {
    assert(values[index]?.startsWith('--') && values[index + 1] !== undefined, `Invalid argument: ${values[index] ?? ''}`);
    result.set(values[index].slice(2), values[index + 1]);
  }
  return result;
}

async function git(args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const output = [];
    const error = [];
    child.stdout.on('data', chunk => output.push(chunk));
    child.stderr.on('data', chunk => error.push(chunk));
    child.once('error', reject);
    child.once('close', code => {
      if (code === 0 || allowFailure) resolve({ code, stdout: Buffer.concat(output), stderr: Buffer.concat(error).toString('utf8') });
      else reject(new Error(`git ${args.join(' ')} failed: ${Buffer.concat(error).toString('utf8')}`));
    });
  });
}

function markdown(plan) {
  const reasons = plan.reasons.length
    ? plan.reasons.map(item => `- \`${item.code}\`: ${item.detail}${item.paths ? ` (${item.paths.map(path => `\`${path}\``).join(', ')})` : ''}`).join('\n')
    : '- No changed paths affect browser coverage.';
  const selected = plan.selectedScripts.length ? plan.selectedScripts.map(script => `\`${script}\``).join(', ') : '_none_';
  return `### Browser selection plan\n\n`
    + `- Mode: **${plan.mode}**\n`
    + `- Tested revision: \`${plan.testedRevision}\`\n`
    + `- Base revision: ${plan.baseRevision ? `\`${plan.baseRevision}\`` : '_none_'}\n`
    + `- Selected: **${plan.selectedCount}** / ${plan.fullSuite.length}\n`
    + `- Browser shards: **${plan.shardCount}**\n`
    + `- Plan identity: \`${plan.planDigest}\`\n\n`
    + `${reasons}\n\n<details><summary>Selected browser checks</summary>\n\n${selected}\n\n</details>\n`;
}

const args = argumentsMap(process.argv.slice(2));
const eventName = args.get('event') || process.env.GITHUB_EVENT_NAME || 'local';
const expectedTestedRevision = args.get('tested') || process.env.GITHUB_SHA;
const output = args.get('output') || '.ci-plan/browser-selection.json';
const summary = args.get('summary') || process.env.GITHUB_STEP_SUMMARY;
const githubOutput = args.get('github-output') || process.env.GITHUB_OUTPUT;
const actualTestedRevision = (await git(['rev-parse', 'HEAD'])).stdout.toString('utf8').trim();
assert.equal(actualTestedRevision, expectedTestedRevision || actualTestedRevision, 'Checked-out tree does not match the requested tested revision');

const baseRevision = args.get('base') || '';
const pullRequestHeadRevision = args.get('pr-head') || '';
let missingBase = false;
let provenanceFailures = [];
let changedEntries = [];
if (eventName === 'pull_request') {
  const provenance = await inspectPullRequestProvenance({
    baseRevision,
    pullRequestHeadRevision,
    testedRevision: actualTestedRevision,
    hasCommit: async revision => (await git(['cat-file', '-e', `${revision}^{commit}`], { allowFailure: true })).code === 0,
    isAncestor: async (ancestor, descendant) => (await git(['merge-base', '--is-ancestor', ancestor, descendant], { allowFailure: true })).code === 0,
  });
  missingBase = provenance.missingBase;
  provenanceFailures = provenance.failures;
  if (!missingBase && !provenanceFailures.length) {
    const diff = await git(['diff', '--name-status', '-z', '-M', baseRevision, actualTestedRevision, '--']);
    changedEntries = parseGitNameStatusZ(diff.stdout.toString('utf8'));
  }
}

const plan = await createBrowserSelectionPlan({
  suite: browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true'),
  eventName,
  baseRevision,
  testedRevision: actualTestedRevision,
  pullRequestHeadRevision,
  changedEntries,
  missingBase,
  provenanceFailures,
});
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(plan, null, 2) + '\n');
if (summary) await appendFile(summary, markdown(plan));
if (githubOutput) {
  const shards = Array.from({ length: plan.shardCount }, (_, index) => index + 1);
  await appendFile(githubOutput, [
    `matrix=${JSON.stringify(shards)}`,
    `shard_count=${plan.shardCount}`,
    `selected_count=${plan.selectedCount}`,
    `plan_digest=${plan.planDigest}`,
    `tested_revision=${plan.testedRevision}`,
  ].join('\n') + '\n');
}
console.log(JSON.stringify(plan, null, 2));
