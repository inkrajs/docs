import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { applyBrowserReuse, browserReuseMaxAgeMs, createBrowserInputInventory, createBrowserReuseReceipt,
  validateBrowserInputInventory, validateBrowserReuseBaseline } from '../browser-reuse.mjs';
import { browserPlan, checkBrowserReports } from '../browser-report.mjs';
import { validateBrowserSelectionPlan } from '../browser-plan.mjs';
import { applyBrowserLocalValidation, browserLocalEnvironment } from '../browser-local-validation.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const head = 'a'.repeat(40), base = 'b'.repeat(40), candidate = 'c'.repeat(64);
const suite = ['verify-log-refinement', 'verify-slider-refinement'];
const environment = 'immutable-playwright-image@sha256:test-node24-workers2';
const identity = { repository: 'inkrajs/inkra', runId: 10, runAttempt: 1, headSha: 'd'.repeat(40), createdAt: new Date().toISOString() };

async function put(root, path, value) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), typeof value === 'string' ? value : JSON.stringify(value));
}
async function fixture(context) {
  const root = await mkdtemp(join(tmpdir(), 'inkra-browser-reuse-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  for (const [path, value] of Object.entries({
    'library-candidate.json': { sha256: candidate, version: '1.0.0', source: 'candidate' },
    'package.json': { dependencies: { '@inkra/react': 'file:vendor/inkra.tgz', react: '19.3.1' } },
    'package-lock.json': { lockfileVersion: 3, packages: { '': { dependencies: { '@inkra/react': '1.0.0', react: '19.3.1' } },
      'node_modules/@inkra/react': { version: '1.0.0', integrity: 'old-archive' }, 'node_modules/react': { version: '19.3.1', integrity: 'react-stable' } } },
    'vite.config.ts': 'export default { server: { host: "127.0.0.1" } };',
    'src/App.tsx': 'import { Button } from "@inkra/react"; import { LogExamples } from "./components/LogExamples"; import { SliderExamples } from "./components/SliderExamples"; export const App = () => Button;',
    'src/components/LogExamples.tsx': 'import { Log } from "@inkra/react"; export const LogExamples = () => Log;',
    'src/components/SliderExamples.tsx': 'import { Slider } from "@inkra/react"; export const SliderExamples = () => Slider;',
    'src/styles.css': ':root { color: black; }',
    'public/font.woff2': 'font-v1',
    'scripts/verify-log-refinement.mjs': 'import "./helper.mjs"; const route="/docs/components/log"; await import("/scripts/fixtures/LogFixture.tsx");',
    'scripts/verify-slider-refinement.mjs': 'const route="/docs/components/slider";',
    'scripts/helper.mjs': 'export const helper = 1;',
    'scripts/fixtures/LogFixture.tsx': 'import { Log } from "@inkra/react"; export const Fixture=Log;',
    'node_modules/@inkra/react/package.json': { name: '@inkra/react', version: '1.0.0', type: 'module',
      exports: { '.': { import: './dist/index.js' }, './styles.css': './dist/styles.css' }, dependencies: { shared: '1.0.0' } },
    'node_modules/@inkra/react/dist/index.js': 'export { Button } from "./Button.js"; export { Log } from "./log/index.js"; export { Slider } from "./slider/index.js";',
    'node_modules/@inkra/react/dist/Button.js': 'export const Button = "button";',
    'node_modules/@inkra/react/dist/log/index.js': 'import { forwardRef } from "react"; import { shared } from "../shared.js"; export const Log = forwardRef(function Log(){ return shared + "log"; }); Log.displayName = "Log";',
    'node_modules/@inkra/react/dist/slider/index.js': 'import { shared } from "../shared.js"; export const Slider = () => shared + "slider";',
    'node_modules/@inkra/react/dist/shared.js': 'export const shared = "shared-v1";',
    'node_modules/@inkra/react/dist/styles.css': ':root { --ink: black; }',
  })) await put(root, path, value);
  return root;
}
const inventory = root => createBrowserInputInventory({ root, suite, docsRevision: head, environment });
function plan() {
  const result = { schemaVersion: 1, repository: 'inkrajs/docs', eventName: 'release', testedRevision: head,
    baseRevision: base, pullRequestHeadRevision: null, mode: 'full', reasons: [], changedEntries: [],
    fullSuite: [...suite], fullSuiteDigest: digest(suite), selectedScripts: [...suite], selectedDigest: digest(suite),
    selectedCount: suite.length, skippedScripts: [], skippedCount: 0, shardCount: suite.length };
  return { ...result, planDigest: digest(result) };
}
function reportsFor(selection, status = 'passed') {
  return Array.from({ length: selection.shardCount }, (_, index) => {
    const report = browserPlan(selection.selectedScripts, `${index + 1}/${selection.shardCount}`, selection);
    return { ...report, results: report.scripts.map(script => ({ script, status, durationMs: 10 })) };
  });
}
function baseline(inputs) {
  const selection = applyBrowserReuse(plan(), inputs, { schemaVersion: 1, trusted: false, reason: 'first-run' });
  checkBrowserReports(reportsFor(selection), selection, suite);
  const receipt = createBrowserReuseReceipt(selection, identity);
  return { schemaVersion: 1, trusted: true, origin: { repository: identity.repository, runId: identity.runId,
    runAttempt: identity.runAttempt, headSha: identity.headSha, artifactId: 100, artifactDigest: 'sha256:' + 'f'.repeat(64),
    workflowPath: '.github/workflows/publish.yml' }, receipt };
}
const fingerprints = inputs => inputs.entries.map(entry => entry.fingerprint);

test('unchanged runtime and version-only archive changes reuse actual successful history', async context => {
  const root = await fixture(context);
  const first = await inventory(root), previous = baseline(first);
  const pkg = JSON.parse(await readFile(join(root, 'node_modules/@inkra/react/package.json')));
  pkg.version = '1.0.1'; await put(root, 'node_modules/@inkra/react/package.json', pkg);
  await put(root, 'library-candidate.json', { sha256: 'e'.repeat(64), version: '1.0.1', source: 'candidate' });
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json')));
  lock.packages['node_modules/@inkra/react'] = { version: '1.0.1', integrity: 'new-archive' };
  await put(root, 'package-lock.json', lock);
  const next = await inventory(root);
  assert.deepEqual(fingerprints(next), fingerprints(first));
  const selection = applyBrowserReuse(plan(), next, previous);
  validateBrowserSelectionPlan(selection, suite);
  assert.equal(selection.selectedCount, 0);
  checkBrowserReports([], selection, suite);
  const receipt = createBrowserReuseReceipt(selection, { ...identity, runId: 11 });
  assert.deepEqual(receipt.entries.map(entry => entry.origin.runId), [10, 10]);
  assert.deepEqual(receipt.entries.map(entry => entry.origin.createdAt), [identity.createdAt, identity.createdAt]);
});

test('an isolated component implementation or example change selects only its consumers', async context => {
  const root = await fixture(context), first = await inventory(root), previous = baseline(first);
  assert(first.entries.every(entry => entry.scope === 'module'));
  await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; import { shared } from "../shared.js"; export const Log = forwardRef(function Log(){ return shared + "changed-log"; }); Log.displayName = "Log";');
  const selection = applyBrowserReuse(plan(), await inventory(root), previous);
  assert.deepEqual(selection.selectedScripts, [suite[0]]);
  assert.deepEqual(selection.historicalReuse.entries.map(entry => entry.script), [suite[1]]);
  await put(root, 'src/components/SliderExamples.tsx', 'import { Slider } from "@inkra/react"; export const SliderExamples = () => [Slider];');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
});

test('test helpers and browser-side dynamic fixtures invalidate their actual consumer', async context => {
  const root = await fixture(context), first = await inventory(root);
  for (const [path, value] of [['scripts/helper.mjs', 'export const helper = 2;'],
    ['scripts/fixtures/LogFixture.tsx', 'import { Log } from "@inkra/react"; export const Fixture = [Log];']]) {
    await put(root, path, value);
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), baseline(first)).selectedScripts, [suite[0]]);
  }
});

test('shared implementation, global styles, assets, external dependencies and config invalidate consumers', async context => {
  const root = await fixture(context);
  for (const [path, value] of [
    ['node_modules/@inkra/react/dist/shared.js', 'export const shared = "shared-v2";'],
    ['node_modules/@inkra/react/dist/styles.css', ':root { --ink: red; }'],
    ['src/styles.css', ':root { color: red; }'], ['public/font.woff2', 'font-v2'],
    ['vite.config.ts', 'export default { server: { host: "localhost" } };'],
    ['package-lock.json', { packages: { 'node_modules/react': { version: '19.4.0', integrity: 'changed' } } }],
  ]) {
    const previous = baseline(await inventory(root));
    await put(root, path, value);
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite, path);
  }
});

test('missing, untrusted, malformed, failed and provenance-mismatched history keeps current checks online', async context => {
  const inputs = await inventory(await fixture(context)), previous = baseline(inputs);
  for (const value of [undefined, { schemaVersion: 1, trusted: false }, { ...previous, trusted: false },
    { ...previous, receipt: { ...previous.receipt, schemaVersion: 999 } },
    { ...previous, origin: { ...previous.origin, headSha: 'e'.repeat(40) } },
    { ...previous, receipt: { ...previous.receipt, entries: [{ ...previous.receipt.entries[0], status: 'failed' }] } }]) {
    const selection = applyBrowserReuse(plan(), inputs, value);
    assert.deepEqual(selection.selectedScripts, suite);
    assert.equal(selection.historicalReuse, undefined);
  }
  const mismatch = structuredClone(previous); mismatch.receipt.entries[0].fingerprint = '1'.repeat(64);
  assert.deepEqual(applyBrowserReuse(plan(), inputs, mismatch).selectedScripts, [suite[0]]);
  assert.deepEqual(applyBrowserReuse(plan(), inputs, previous, { forceFull: true }).selectedScripts, suite);
});

test('expired original passes rerun without refreshing inherited timestamps or discarding fresh peers', async context => {
  const inputs = await inventory(await fixture(context)), previous = baseline(inputs);
  previous.receipt.entries[0].origin.createdAt = new Date(Date.now() - browserReuseMaxAgeMs - 1000).toISOString();
  const selection = applyBrowserReuse(plan(), inputs, previous);
  assert.deepEqual(selection.selectedScripts, [suite[0]]);
  assert.equal(selection.historicalReuse.entries[0].origin.createdAt, identity.createdAt);
});

test('input and history tampering, missing/duplicate reports, failures and coverage gaps are rejected', async context => {
  const inputs = await inventory(await fixture(context)), previous = baseline(inputs);
  const corrupt = structuredClone(inputs); corrupt.entries[0].inputs[0].sha256 = '1'.repeat(64);
  assert.throws(() => validateBrowserInputInventory(corrupt, suite), /fingerprint/);
  const duplicate = structuredClone(previous); duplicate.receipt.entries.push(duplicate.receipt.entries[0]);
  assert.throws(() => validateBrowserReuseBaseline(duplicate), /Duplicate/);
  const online = applyBrowserReuse(plan(), inputs, undefined);
  assert.throws(() => checkBrowserReports(reportsFor(online).slice(1), online, suite), /Missing/);
  assert.throws(() => checkBrowserReports(reportsFor(online, 'failed'), online, suite), /failed/);
  assert.throws(() => checkBrowserReports([reportsFor(online)[0], reportsFor(online)[0]], online, suite), /Duplicate/);
  const reused = applyBrowserReuse(plan(), inputs, previous);
  reused.historicalReuse.baseline.receipt.entries[0].fingerprint = '1'.repeat(64);
  const { planDigest: _, ...unsigned } = reused; reused.planDigest = digest(unsigned);
  assert.throws(() => validateBrowserSelectionPlan(reused, suite), /baseline digest/);
  const gap = applyBrowserReuse(plan(), inputs, undefined);
  gap.selectedScripts = []; gap.selectedDigest = digest([]); gap.selectedCount = 0;
  gap.skippedScripts = [...suite]; gap.skippedCount = suite.length; gap.shardCount = 0; gap.mode = 'incremental';
  const { planDigest: __, ...missing } = gap; gap.planDigest = digest(missing);
  assert.throws(() => validateBrowserSelectionPlan(gap, suite), /need online, local or historical/);
});

test('local confirmations and historical passes partition release coverage without minting local history', async context => {
  const inputs = await inventory(await fixture(context)), previous = baseline(inputs);
  const allowedGroups = { 'browser:log': [suite[0]] };
  const attestation = { accepted: true, repository: 'inkrajs/docs', head, base, candidateSha256: candidate,
    targetRevision: head, headTree: 'e'.repeat(40), targetTree: 'e'.repeat(40), browserGroups: allowedGroups,
    actor: { id: 51358815, login: 'NWYLZW' }, prNumber: 1,
    declarations: [{ group: 'browser:log', environments: [browserLocalEnvironment], reason: 'Actual local test passed', evidence: 'https://example.invalid/report' }] };
  const local = applyBrowserLocalValidation(plan(), attestation, { allowedGroups, candidateSha256: candidate });
  const selection = applyBrowserReuse(local, inputs, previous);
  validateBrowserSelectionPlan(selection, suite);
  assert.equal(selection.selectedCount, 0);
  checkBrowserReports([], selection, suite);
  const receipt = createBrowserReuseReceipt(selection, { ...identity, runId: 11 });
  assert.deepEqual(receipt.entries.map(entry => entry.status), ['local', 'passed']);
  assert.equal(receipt.entries[0].origin, undefined);
  const subsequent = { ...previous, origin: { ...previous.origin, runId: 11 }, receipt };
  assert.deepEqual(applyBrowserReuse(plan(), inputs, subsequent).selectedScripts, [suite[0]]);
});

test('an unbound environment never reuses and changed environment invalidates every fingerprint', async context => {
  const root = await fixture(context), inputs = await inventory(root), previous = baseline(inputs);
  const changed = await createBrowserInputInventory({ root, suite, docsRevision: head, environment: environment + '-changed' });
  assert.deepEqual(applyBrowserReuse(plan(), changed, previous).selectedScripts, suite);
  const unbound = await createBrowserInputInventory({ root, suite, docsRevision: head, environment: '' });
  assert.deepEqual(applyBrowserReuse(plan(), unbound, previous).selectedScripts, suite);
});

test('helpers with component and global consumers remain global inputs', async context => {
  const root = await fixture(context);
  await put(root, 'src/shared.ts', 'export const value = "first";');
  await put(root, 'src/App.tsx', 'import { value } from "./shared"; import { LogExamples } from "./components/LogExamples"; import { SliderExamples } from "./components/SliderExamples"; export const App = value;');
  await put(root, 'src/components/LogExamples.tsx', 'import { value } from "../shared"; import { Log } from "@inkra/react"; export const LogExamples = () => [value, Log];');
  const previous = baseline(await inventory(root));
  await put(root, 'src/shared.ts', 'export const value = "changed";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
});

test('eager re-export side effects and ambiguous browser exports cannot hide unrelated runtime changes', async context => {
  const root = await fixture(context);
  await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'globalThis.sideEffect = "first"; export const Log = () => "log";');
  let previous = baseline(await inventory(root));
  await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'globalThis.sideEffect = "changed"; export const Log = () => "log";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  const pkg = JSON.parse(await readFile(join(root, 'node_modules/@inkra/react/package.json')));
  pkg.exports['.'] = { browser: './dist/browser.js', import: './dist/index.js' };
  await put(root, 'node_modules/@inkra/react/package.json', pkg);
  await put(root, 'node_modules/@inkra/react/dist/browser.js', 'export const Log = () => "first";');
  previous = baseline(await inventory(root));
  await put(root, 'node_modules/@inkra/react/dist/browser.js', 'export const Log = () => "changed";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
});

test('bare relative URL and readFile fixture references are bound to their consumer', async context => {
  const root = await fixture(context);
  await put(root, 'scripts/fixtures/case.json', { value: 1 });
  await put(root, 'scripts/verify-log-refinement.mjs', 'const route="/docs/components/log"; const a = new URL("fixtures/case.json", import.meta.url); const b = readFile("scripts/fixtures/case.json");');
  const previous = baseline(await inventory(root));
  await put(root, 'scripts/fixtures/case.json', { value: 2 });
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, [suite[0]]);
});

test('mixed static and dynamic catalog routes conservatively cover every component example', async context => {
  const root = await fixture(context);
  await put(root, 'scripts/verify-log-refinement.mjs', 'const route="/docs/components/log"; for(const component of components) { const other = `/docs/components/${component}`; }');
  const inputs = await inventory(root), previous = baseline(inputs);
  assert.equal(inputs.entries[0].scope, 'conservative-runtime');
  await put(root, 'src/components/SliderExamples.tsx', 'import { Slider } from "@inkra/react"; export const SliderExamples = () => [Slider];');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
});

test('CLI seals zero-online plans, emits dynamic outputs and preserves original historical audit links', async context => {
  const root = await fixture(context), inputs = await inventory(root), previous = baseline(inputs);
  await put(root, 'plan.json', plan()); await put(root, 'inputs.json', inputs); await put(root, 'baseline.json', previous);
  const outputPath = join(root, 'outputs.txt'), summaryPath = join(root, 'summary.md');
  execFileSync(process.execPath, [fileURLToPath(new URL('../browser-reuse.mjs', import.meta.url)), 'apply', '--plan', join(root, 'plan.json'),
    '--inputs', join(root, 'inputs.json'), '--baseline', join(root, 'baseline.json')], { encoding: 'utf8',
    env: { ...process.env, GITHUB_OUTPUT: outputPath, GITHUB_STEP_SUMMARY: summaryPath, BROWSER_REUSE_FORCE_FULL: 'false' } });
  const result = JSON.parse(await readFile(join(root, 'plan.json'), 'utf8'));
  validateBrowserSelectionPlan(result, suite);
  assert.equal(result.selectedCount, 0);
  assert.match(await readFile(outputPath, 'utf8'), /matrix=\[\]\nshard_count=0\nselected_count=0/);
  assert.match(await readFile(summaryPath, 'utf8'), /2 unchanged checks reused from successful CI/);
  assert.match(await readFile(summaryPath, 'utf8'), /actions\/runs\/10/);
});

test('eager getters, iterable constructors and globally installed callbacks cannot hide function-body changes', async context => {
  const root = await fixture(context);
  for (const source of [
    'const value = { get current() { return "FIRST"; } }; export const Log = () => value.current;',
    'const values = { *[Symbol.iterator]() { yield ["value", "FIRST"]; } }; const current = new Map(values); export const Log = () => current;',
    'globalThis.handler = () => "FIRST"; export const Log = () => "log";',
  ]) {
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', source);
    const previous = baseline(await inventory(root));
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', source.replace('FIRST', 'CHANGED'));
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  }
});

test('owned docs initialization is global while ordinary render bodies remain selective', async context => {
  const root = await fixture(context);
  let previous = baseline(await inventory(root));
  await put(root, 'src/components/LogExamples.tsx', 'import { Log } from "@inkra/react"; export const LogExamples = () => [Log];');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, [suite[0]]);
  for (const source of [
    'import { Log } from "@inkra/react"; globalThis.handler = () => "FIRST"; export const LogExamples = () => Log;',
    'import { Log } from "@inkra/react"; const props = { get value(){return "FIRST";} }; const item = <Log {...props}/>; export const LogExamples = () => item;',
  ]) {
    await put(root, 'src/components/LogExamples.tsx', source);
    previous = baseline(await inventory(root));
    await put(root, 'src/components/LogExamples.tsx', source.replace('FIRST', 'CHANGED'));
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  }
});

test('unsafe owned docs initializers bind their local helpers and called library functions globally', async context => {
  const root = await fixture(context);
  await put(root, 'src/components/logValue.ts', 'export const value = () => "FIRST";');
  await put(root, 'src/components/LogExamples.tsx', 'import { value } from "./logValue"; import { Log } from "@inkra/react"; const current = value() + Log(); export const LogExamples = () => current;');
  let previous = baseline(await inventory(root));
  await put(root, 'src/components/logValue.ts', 'export const value = () => "CHANGED";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  previous = baseline(await inventory(root));
  await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; import { shared } from "../shared.js"; export const Log = forwardRef(function Log(){ return shared + "changed-log"; }); Log.displayName = "Log";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
});

test('an unrelated eager helper call does not globalize imports used only by deferred renders', async context => {
  const root = await fixture(context);
  await put(root, 'src/components/icons.ts', 'export const iconPaths = () => "icon";');
  await put(root, 'src/components/LogExamples.tsx', 'import { iconPaths } from "./icons"; import { Log } from "@inkra/react"; const icon = iconPaths(); export const LogExamples = () => [Log, icon];');
  const previous = baseline(await inventory(root));
  await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; import { shared } from "../shared.js"; export const Log = forwardRef(function Log(){ return shared + "changed-log"; }); Log.displayName = "Log";');
  assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, [suite[0]]);
});

test('deferred local functions passed to unknown eager calls retain all potentially executed imports', async context => {
  const root = await fixture(context);
  for (const callback of ['function render(){return Log();} const current = unknownCall(render);', 'const current = unknownCall(() => Log());']) {
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; export const Log = forwardRef(function Log(){ return "first"; }); Log.displayName = "Log";');
    await put(root, 'src/components/LogExamples.tsx', 'import { Log } from "@inkra/react"; ' + callback + ' export const LogExamples = () => current;');
    const previous = baseline(await inventory(root));
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; export const Log = forwardRef(function Log(){ return "changed"; }); Log.displayName = "Log";');
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  }
});

test('publication metadata remains normalized only while UI consumers read source alone', async context => {
  const root = await fixture(context);
  for (const field of ['source', 'version']) {
    await put(root, 'src/components/FoundationPages.tsx', `import candidate from "../../library-candidate.json"; export function FoundationPage(){ return ${field === 'source' ? "'source' in candidate && candidate.source === 'registry'" : 'candidate.' + field}; }`);
    await put(root, 'library-candidate.json', { sha256: candidate, source: 'candidate', version: '1.0.0' });
    const previous = baseline(await inventory(root));
    await put(root, 'library-candidate.json', { sha256: 'e'.repeat(64), source: 'candidate', version: '1.0.1' });
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, field === 'source' ? [] : suite);
  }
});

test('callbacks escaping through globals, object arguments and JSX retain the library bodies they can expose', async context => {
  const root = await fixture(context);
  for (const expression of ['globalThis.handler = () => Log();', 'const result = unknownCall({ render: () => Log() });',
    'globalThis.element = <Log/>;', 'const result = unknownCall(<Log/>);']) {
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; export const Log = forwardRef(function Log(){ return "first"; }); Log.displayName = "Log";');
    await put(root, 'src/components/LogExamples.tsx', 'import { Log } from "@inkra/react"; ' + expression + ' export const LogExamples = () => Log;');
    const previous = baseline(await inventory(root));
    await put(root, 'node_modules/@inkra/react/dist/log/index.js', 'import { forwardRef } from "react"; export const Log = forwardRef(function Log(){ return "changed"; }); Log.displayName = "Log";');
    assert.deepEqual(applyBrowserReuse(plan(), await inventory(root), previous).selectedScripts, suite);
  }
});

test('workers reject an inventory recorded against a different actual Node runtime', async context => {
  const inputs = await inventory(await fixture(context));
  inputs.runtime.node = '0.0.0';
  assert.throws(() => validateBrowserInputInventory(inputs, suite), /runtime differs/);
});
