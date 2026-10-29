import assert from 'node:assert/strict';
import test from 'node:test';

import { browserSuite } from '../browser-checks.mjs';
import { validateBrowserSelectionPlan } from '../browser-plan.mjs';
import {
  auditLocalReferences,
  createBrowserSelectionPlan,
  globalConsumersForPath,
  inspectPullRequestProvenance,
  parseGitNameStatusZ,
} from '../browser-selection.mjs';

const revision = 'a'.repeat(40);
const base = 'b'.repeat(40);
const suite = browserSuite();
const changed = (...entries) => createBrowserSelectionPlan({
  suite,
  eventName: 'pull_request',
  baseRevision: base,
  testedRevision: revision,
  pullRequestHeadRevision: 'c'.repeat(40),
  changedEntries: entries,
});

test('isolated component and cross-component composition changes select focused checks', async () => {
  const infinite = await changed({ status: 'M', path: 'src/components/InfiniteScrollExamples.tsx' });
  assert.deepEqual(infinite.selectedScripts, ['verify-infinite-scroll']);
  const loading = await changed({ status: 'M', path: 'src/components/LoadingExamples.tsx' });
  assert.deepEqual(loading.selectedScripts, ['verify-loading', 'verify-infinite-scroll']);
  const masonry = await changed({ status: 'M', path: 'src/components/MasonryExamples.css' });
  assert.deepEqual(masonry.selectedScripts, ['verify-infinite-scroll', 'verify-masonry']);
});

test('reverse transitive helpers and helper contract tests select their browser consumers', async () => {
  const helper = await changed({ status: 'M', path: 'scripts/playground-controls.mjs' });
  assert(helper.selectedScripts.includes('verify-minimal-playgrounds'));
  assert(helper.selectedScripts.includes('verify-utility-components'));
  assert(helper.selectedCount < suite.length);
  const helperTest = await changed({ status: 'M', path: 'scripts/test/playground-test-helpers.test.mjs' });
  assert(helperTest.reasons.some(item => item.code === 'contract-test-changed'));
  assert(helperTest.selectedScripts.some(check => check.startsWith('verify-')));
});

test('changed browser checks select themselves', async () => {
  const plan = await changed({ status: 'M', path: 'scripts/verify-loading.mjs' });
  assert.deepEqual(plan.selectedScripts, ['verify-loading']);
});

test('deletions and renames inspect every path without trusting missing helper history', async () => {
  const deletedOwner = await changed({ status: 'D', path: 'src/components/GuideExamples.tsx' });
  assert.deepEqual(deletedOwner.selectedScripts, ['verify-guide']);
  const deletedHelper = await changed({ status: 'D', path: 'src/components/deletedSharedHelper.ts' });
  assert.equal(deletedHelper.mode, 'full');
  assert(deletedHelper.reasons.some(item => item.code === 'deleted-source-unresolved'));
  const renamed = await changed({ status: 'R100', previousPath: 'src/components/LoadingExamples.tsx', path: 'src/components/InfiniteScrollExamples.tsx' });
  assert(renamed.selectedScripts.includes('verify-loading'));
  assert(renamed.selectedScripts.includes('verify-infinite-scroll'));
});

test('unknown, candidate, lockfile, config and missing base changes fall back to full', async () => {
  for (const path of ['mystery.bin', 'docs/runtime.mjs', 'library-candidate.json', 'package-lock.json', 'vite.config.ts', '.github/workflows/check.yml']) {
    const plan = await changed({ status: 'M', path });
    assert.equal(plan.mode, 'full', path);
    assert.deepEqual(plan.selectedScripts, suite);
  }
  const missing = await createBrowserSelectionPlan({ suite, eventName: 'pull_request', testedRevision: revision, missingBase: true });
  assert.equal(missing.mode, 'full');
  assert(missing.reasons.some(item => item.code === 'missing-base'));
});

test('candidate metadata imports resolve while metadata changes retain full coverage', async () => {
  const unchanged = await changed({ status: 'M', path: 'README.md' });
  assert.equal(unchanged.mode, 'incremental');
  assert(!unchanged.reasons.some(item => item.code === 'unresolved-local-import'));
  const candidate = await changed({ status: 'M', path: 'library-candidate.json' });
  assert.equal(candidate.mode, 'full');
  assert(candidate.reasons.some(item => item.code === 'full-impact-path'));
});

test('non-PR runs remain full and known documentation-only changes produce a trusted empty plan', async () => {
  const main = await createBrowserSelectionPlan({ suite, eventName: 'push', testedRevision: revision });
  assert.equal(main.mode, 'full');
  assert.equal(main.shardCount, 4);
  const empty = await changed({ status: 'M', path: 'README.md' });
  assert.equal(empty.mode, 'incremental');
  assert.equal(empty.selectedCount, 0);
  assert.equal(empty.shardCount, 0);
  assert.deepEqual(empty.skippedScripts, suite);
});

test('new browser checks without explicit registry coverage force full selection', async () => {
  const expanded = [...suite, 'verify-unregistered-check'];
  const plan = await createBrowserSelectionPlan({
    suite: expanded,
    eventName: 'pull_request',
    baseRevision: base,
    testedRevision: revision,
    changedEntries: [{ status: 'M', path: 'README.md' }],
  });
  assert.equal(plan.mode, 'full');
  assert(plan.reasons.some(item => item.code === 'impact-registry-incomplete'));
});

test('plan validation binds suite order, tested revision, digests and identity', async () => {
  const plan = await changed({ status: 'M', path: 'scripts/verify-guide.mjs' });
  validateBrowserSelectionPlan(plan, suite, { expectedTestedRevision: revision });
  for (const mutate of [
    value => { value.testedRevision = 'd'.repeat(40); },
    value => { value.fullSuite.reverse(); },
    value => { value.selectedScripts.push('verify-loading'); },
    value => { value.planDigest = 'stale'; },
  ]) {
    const copy = structuredClone(plan);
    mutate(copy);
    assert.throws(() => validateBrowserSelectionPlan(copy, suite, { expectedTestedRevision: revision }));
  }
  assert.throws(() => validateBrowserSelectionPlan(plan, suite, {
    expectedTestedRevision: revision,
    expectedPlanDigest: 'd'.repeat(64),
  }));
});

test('NUL-delimited git parser preserves rename paths and rejects unsafe input', () => {
  assert.deepEqual(parseGitNameStatusZ('M\0src/a.ts\0R100\0src/old name.ts\0src/new name.ts\0'), [
    { status: 'M', path: 'src/a.ts' },
    { status: 'R100', previousPath: 'src/old name.ts', path: 'src/new name.ts' },
  ]);
  assert.throws(() => parseGitNameStatusZ('M\0../escape.ts\0'));
  assert.throws(() => parseGitNameStatusZ('R100\0only-one-path\0'));
});

test('impact graph resolves TypeScript behind runtime extensions and records unknown module edges', () => {
  const files = new Set(['src/helper.ts', 'src/view.tsx']);
  const audit = auditLocalReferences('src/view.tsx', "import './helper.js'; import './missing.js'; import(target); require(loader);", files);
  assert.deepEqual(audit.references, ['src/helper.ts']);
  assert.deepEqual(audit.unresolvedModules, ['./missing.js', '<non-literal: target>', '<non-literal: loader>']);
});

test('script graph resolves simple top-level constant import and require targets', () => {
  const files = new Set(['scripts/helper.mjs', 'scripts/check.mjs']);
  const audit = auditLocalReferences('scripts/check.mjs', "const target = './helper.mjs'; import(target); require(target);", files);
  assert.deepEqual(audit.references, ['scripts/helper.mjs']);
  assert.deepEqual(audit.unresolvedModules, []);
});

test('component ownership boundaries do not hide separate global consumers', () => {
  const componentOnly = {
    reverse: new Map([
      ['src/shared.ts', new Set(['src/components/LoadingExamples.tsx'])],
      ['src/components/LoadingExamples.tsx', new Set(['src/components/FoundationPages.tsx'])],
      ['src/components/FoundationPages.tsx', new Set(['src/App.tsx'])],
    ]),
  };
  assert.deepEqual([...globalConsumersForPath('src/shared.ts', componentOnly)], []);

  const sharedWithShell = structuredClone(componentOnly);
  sharedWithShell.reverse.get('src/shared.ts').add('src/shell.ts');
  sharedWithShell.reverse.set('src/shell.ts', new Set(['src/App.tsx']));
  assert.deepEqual([...globalConsumersForPath('src/shared.ts', sharedWithShell)], ['src/App.tsx']);
});

test('pull request provenance fails closed for missing or mismatched base and head revisions', async () => {
  const available = new Set([base, revision]);
  const ancestry = new Set([`${base}:${revision}`]);
  const inspect = (baseRevision, pullRequestHeadRevision) => inspectPullRequestProvenance({
    baseRevision,
    pullRequestHeadRevision,
    testedRevision: revision,
    hasCommit: async value => available.has(value),
    isAncestor: async (ancestor, descendant) => ancestry.has(`${ancestor}:${descendant}`),
  });
  assert.deepEqual(await inspect(base, ''), {
    missingBase: false,
    failures: [{ code: 'missing-pr-head', detail: 'The pull request head revision was not provided' }],
  });
  assert.deepEqual((await inspect('d'.repeat(40), 'e'.repeat(40))).failures.map(item => item.code), ['pr-head-unavailable']);
  available.add('f'.repeat(40));
  assert.deepEqual((await inspect(base, 'f'.repeat(40))).failures.map(item => item.code), ['pr-head-not-ancestor']);
  available.add('d'.repeat(40));
  assert.deepEqual((await inspect('d'.repeat(40), 'f'.repeat(40))).failures.map(item => item.code), ['base-not-ancestor', 'pr-head-not-ancestor']);

  const plan = await createBrowserSelectionPlan({
    suite,
    eventName: 'pull_request',
    baseRevision: base,
    testedRevision: revision,
    pullRequestHeadRevision: 'f'.repeat(40),
    provenanceFailures: (await inspect(base, 'f'.repeat(40))).failures,
  });
  assert.equal(plan.mode, 'full');
  assert(plan.reasons.some(item => item.code === 'pr-head-not-ancestor'));
});
