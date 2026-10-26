import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { browserSuite } from '../browser-checks.mjs';
import { digest } from '../browser-plan.mjs';
import { browserPlan } from '../browser-report.mjs';

const workflow = await readFile(new URL('../../.github/workflows/check.yml', import.meta.url), 'utf8');
const lockfile = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const playwrightImageDigest = '47b510dd9230bf0b9bfc9b20102241e577ea7a99334ab4c3ca19f19770e9b8ea';

test('workflow creates one trusted plan from the exact checked-out PR tree', () => {
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /node scripts\/select-browser-checks\.mjs/);
  assert.match(workflow, /--tested \"\$TESTED_SHA\"/);
  assert.match(workflow, /PR_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /name: docs-browser-plan[\s\S]*path: \.ci-plan\/browser-selection\.json[\s\S]*include-hidden-files: true/);
});

test('workflow uses a dynamic matrix and starts no browser job for a trusted empty plan', () => {
  assert.match(workflow, /if: needs\.build\.outputs\.browser_selected_count != '0'/);
  assert.match(workflow, /shard: \$\{\{ fromJSON\(needs\.build\.outputs\.browser_matrix\) \}\}/);
  assert.doesNotMatch(workflow, /shard:\s*\[1, 2, 3, 4\]/);
  assert.match(workflow, /BROWSER_SHARD: \$\{\{ matrix\.shard \}\}\/\$\{\{ needs\.build\.outputs\.browser_shard_count \}\}/);
});

test('browser shards use the exact prebuilt Playwright image without repeated browser installation', () => {
  const version = lockfile.packages['node_modules/playwright'].version;
  assert.equal(version, '1.64.1');
  assert.match(workflow, new RegExp(`image: mcr\\.microsoft\\.com/playwright:v${version.replaceAll('.', '\\.')}-noble@sha256:${playwrightImageDigest}`));
  assert.match(workflow, /options: --ipc=host/);
  assert.doesNotMatch(workflow, /playwright install(?:\s|$)/);
  assert.match(workflow, /name: Install npm dependencies and verify image Chromium\n\s+shell: bash/);
  assert.match(workflow, /await chromium\.launch\(\{ headless: true \}\)/);
  assert.match(workflow, /await browser\.close\(\)/);
  assert.match(workflow, /started=\$SECONDS/);
  assert.match(workflow, /Browser shard setup:/);
});

test('every shard and the final gate consume the same plan and tested revision', () => {
  assert.match(workflow, /BROWSER_SELECTION_PLAN: \.ci-plan\/browser-selection\.json/);
  assert.match(workflow, /EXPECTED_TESTED_REVISION: \$\{\{ needs\.build\.outputs\.tested_revision \}\}/g);
  assert.equal((workflow.match(/EXPECTED_BROWSER_PLAN_DIGEST: \$\{\{ needs\.build\.outputs\.browser_plan_digest \}\}/g) ?? []).length, 2);
  assert.match(workflow, /BROWSER_JOB_RESULT: \$\{\{ needs\.browser\.result \}\}/);
  assert.match(workflow, /node scripts\/check-browser-reports\.mjs \.ci-results \.ci-plan\/browser-selection\.json/);
  assert.equal((workflow.match(/name: docs-browser-plan/g) ?? []).length, 3, 'build uploads and browser/docs jobs each download the plan');
});

test('final gate runs without node_modules and rejects a mismatched trusted digest', async t => {
  const root = await mkdtemp(join(tmpdir(), 'inkra-browser-gate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'), { recursive: true });
  for (const file of ['browser-checks.mjs', 'browser-plan.mjs', 'browser-report.mjs', 'check-browser-reports.mjs']) {
    await copyFile(new URL(`../${file}`, import.meta.url), join(root, 'scripts', file));
  }
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'ci@example.invalid'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'CI'], { cwd: root });
  execFileSync('git', ['add', 'scripts'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const suite = browserSuite();
  const selectedScripts = suite.slice(0, 1);
  const unsigned = {
    schemaVersion: 1,
    repository: 'inkrajs/docs',
    eventName: 'pull_request',
    testedRevision: revision,
    baseRevision: 'b'.repeat(40),
    pullRequestHeadRevision: 'c'.repeat(40),
    mode: 'incremental',
    reasons: [],
    changedEntries: [],
    fullSuite: suite,
    fullSuiteDigest: digest(suite),
    selectedScripts,
    selectedDigest: digest(selectedScripts),
    selectedCount: 1,
    skippedScripts: suite.slice(1),
    skippedCount: suite.length - 1,
    shardCount: 1,
  };
  const selection = { ...unsigned, planDigest: digest(unsigned) };
  const reportPlan = browserPlan(selectedScripts, '1/1', selection);
  const report = { ...reportPlan, results: [{ script: selectedScripts[0], status: 'passed', durationMs: 1 }] };
  await mkdir(join(root, '.ci-plan'));
  await mkdir(join(root, '.ci-results'));
  await writeFile(join(root, '.ci-plan/browser-selection.json'), JSON.stringify(selection));
  await writeFile(join(root, '.ci-results/browser-1-of-1.json'), JSON.stringify(report));
  const env = {
    ...process.env,
    BROWSER_JOB_RESULT: 'success',
    EXPECTED_BROWSER_PLAN_DIGEST: selection.planDigest,
    EXPECTED_TESTED_REVISION: revision,
  };
  const args = ['scripts/check-browser-reports.mjs', '.ci-results', '.ci-plan/browser-selection.json'];
  assert.match(execFileSync(process.execPath, args, { cwd: root, env, encoding: 'utf8' }), /All 1 selected browser checks passed/);
  assert.throws(() => execFileSync(process.execPath, args, {
    cwd: root,
    env: { ...env, EXPECTED_BROWSER_PLAN_DIGEST: 'd'.repeat(64) },
    stdio: 'pipe',
  }));
});
