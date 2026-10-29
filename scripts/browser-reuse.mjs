import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserSuite } from './browser-checks.mjs';
import { browserCheckComponentOverrides, browserCheckModuleOverrides, fullFallbackPaths, sourceOwnerOverrides } from './browser-impact-registry.mjs';

// Bump this when input ownership, normalization or runtime analysis changes.
export const browserReuseAlgorithm = 'inkra-browser-inputs/v1';
export const browserReuseMaxAgeMs = 90 * 24 * 60 * 60 * 1000;
const sha = /^[a-f0-9]{40}$/;
const sha256 = /^[a-f0-9]{64}$/;
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));
const ordered = values => [...new Set(values)].sort();
let ts;
const isScript = path => /\.(?:[cm]?js|[jt]sx?)$/.test(path);
const safePath = path => typeof path === 'string' && path.length > 0 && !path.includes('\\') && !path.includes('\0')
  && !path.startsWith('/') && posix.normalize(path) === path && !path.split('/').includes('..');

async function listFiles(root, prefix = '') {
  if (!existsSync(root)) return [];
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Cannot establish browser inputs through symbolic link: ${path}`);
    if (entry.isDirectory()) result.push(...await listFiles(join(root, entry.name), path));
    else result.push(path);
  }
  return result.sort();
}

function treeFor(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
}

function resolveRelative(from, specifier, files) {
  const path = posix.normalize(specifier.startsWith('/') ? specifier.slice(1) : posix.join(posix.dirname(from), specifier));
  if (!safePath(path)) return undefined;
  const base = path.replace(/\.(?:m?js)$/, '');
  return [path, ...['.ts', '.tsx', '.js', '.mjs', '.css', '.json'].flatMap(extension => [path + extension, posix.join(path, 'index' + extension)]),
    ...(base === path ? [] : [base + '.ts', base + '.tsx'])].find(candidate => files.has(candidate));
}

// Includes fixtures loaded inside page.evaluate via absolute /scripts/... imports,
// relative assets and literal new URL/readFile references, not just JS imports.
function references(path, source, files) {
  const tree = treeFor(path, source);
  const local = new Set(), imports = [], unknown = [];
  const add = specifier => {
    if (specifier.startsWith('.') || specifier.startsWith('/scripts/') || specifier.startsWith('/src/')) {
      const target = resolveRelative(path, specifier, files);
      if (target) local.add(target);
      else unknown.push(specifier);
    }
  };
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      add(specifier);
      if (specifier === '@inkra/react' || specifier.startsWith('@inkra/react/')) {
        const clause = node.importClause;
        if (!clause?.isTypeOnly) imports.push({ specifier, names: clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements.filter(element => !element.isTypeOnly).map(element => element.propertyName?.text ?? element.name.text) : null });
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) add(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(tree) === 'require')) {
      const specifier = node.arguments[0];
      if (specifier && ts.isStringLiteralLike(specifier)) {
        add(specifier.text);
        if (specifier.text === '@inkra/react' || specifier.text.startsWith('@inkra/react/')) imports.push({ specifier: specifier.text, names: null });
      } else unknown.push(node.getText(tree));
    }
    if (ts.isNewExpression(node) && node.expression.getText(tree) === 'URL' && node.arguments?.[1]?.getText(tree) === 'import.meta.url') {
      const specifier = node.arguments[0];
      if (ts.isStringLiteralLike(specifier) && !/^[a-z]+:/i.test(specifier.text)) add(specifier.text.startsWith('.') ? specifier.text : './' + specifier.text);
      else if (!ts.isStringLiteralLike(specifier)) unknown.push(node.getText(tree));
    }
    if (ts.isCallExpression(node) && /^(?:[a-zA-Z_$][\w$]*\.)?(?:readFile|readFileSync|existsSync)$/.test(node.expression.getText(tree))) {
      const specifier = node.arguments[0];
      if (specifier && ts.isStringLiteralLike(specifier) && !specifier.text.startsWith('/')) {
        if (files.has(specifier.text)) local.add(specifier.text);
        else add(specifier.text.startsWith('.') ? specifier.text : './' + specifier.text);
      } else if (!specifier || !ts.isNewExpression(specifier)) unknown.push(node.getText(tree));
    }
    if (ts.isStringLiteralLike(node) && /^(?:\.?\.?\/|\/scripts\/|\/src\/)/.test(node.text)) {
      // Paths containing query/hash or URL patterns are not module identities.
      if (!/[?#*]/.test(node.text) && files.has(resolveRelative(path, node.text, files))) add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return { local: [...local], imports, unknown, tree };
}

// ESM evaluates all re-exported modules, including modules whose named exports
// a check does not use. Bind their eager code globally. Function bodies remain
// module inputs only when top-level evaluation cannot invoke them; otherwise the
// complete module and its imports become global inputs.
function eagerModule(refs, source) {
  const lazyReactCalls = new Set(), lazyReactContainers = new Set(), spans = [];
  for (const statement of refs.tree.statements) if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === 'react') {
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const element of bindings.elements)
      if (['forwardRef', 'memo', 'createContext'].includes(element.propertyName?.text ?? element.name.text)) lazyReactCalls.add(element.name.text);
  }
  for (const statement of refs.tree.statements) if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations)
    if (ts.isIdentifier(declaration.name) && declaration.initializer && ts.isCallExpression(declaration.initializer)
      && lazyReactCalls.has(declaration.initializer.expression.getText(refs.tree))) lazyReactContainers.add(declaration.name.text);
  let unsafe = false;
  const visit = node => {
    if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) unsafe = true;
    if (ts.isFunctionLike(node) && node.body) {
      spans.push([node.body.getStart(refs.tree), node.body.end]);
      return;
    }
    if (ts.isCallExpression(node) && !lazyReactCalls.has(node.expression.getText(refs.tree))) unsafe = true;
    if (ts.isNewExpression(node)) unsafe = true;
    if (ts.isPropertyAccessExpression(node) && !(node.name.text === 'displayName' && ts.isIdentifier(node.expression) && lazyReactContainers.has(node.expression.text))) unsafe = true;
    if (ts.isBinaryExpression(node) && !(node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left)
      && node.left.name.text === 'displayName' && ts.isIdentifier(node.left.expression) && lazyReactContainers.has(node.left.expression.text))) unsafe = true;
    if (ts.isElementAccessExpression(node) || ts.isTaggedTemplateExpression(node) || ts.isAwaitExpression(node)
      || ts.isSpreadElement(node) || ts.isSpreadAssignment(node) || ts.isTemplateExpression(node) || ts.isForOfStatement(node)
      || ts.isForInStatement(node) || ts.isPostfixUnaryExpression(node)
      || (ts.isPrefixUnaryExpression(node) && node.operator !== ts.SyntaxKind.ExclamationToken)) unsafe = true;
    ts.forEachChild(node, visit);
  };
  visit(refs.tree);
  let skeleton = source;
  for (const [start, end] of spans.sort((a, b) => b[0] - a[0])) skeleton = skeleton.slice(0, start) + '{}' + skeleton.slice(end);
  return { skeleton, unsafe };
}

function directOwners(path) {
  if (sourceOwnerOverrides[path]) return sourceOwnerOverrides[path];
  const match = path.match(/^src\/components\/(?:expansion\/)?([A-Z][A-Za-z0-9]*)Examples\.(?:tsx?|css)$/);
  return match ? [match[1].replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()] : [];
}

function normalizePackageInputs(pkg, lock) {
  const normalized = structuredClone(pkg);
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) if (normalized[group]) delete normalized[group]['@inkra/react'];
  const locked = structuredClone(lock);
  // The archive's runtime files and dependency configuration are hashed below;
  // only its publication identity is irrelevant to a browser input fingerprint.
  for (const [path, entry] of Object.entries(locked.packages ?? {})) {
    if (path === 'node_modules/@inkra/react') delete locked.packages[path];
    else for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) if (entry[group]) delete entry[group]['@inkra/react'];
  }
  return { package: normalized, lock: locked };
}

export async function createBrowserInputInventory({ root = process.cwd(), suite = browserSuite(true),
  docsRevision, environment = process.env.BROWSER_REUSE_ENVIRONMENT || '', candidateSha256,
} = {}) {
  root = resolve(root);
  ts ||= (await import('typescript')).default;
  docsRevision ||= execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const candidate = JSON.parse(await readFile(join(root, 'library-candidate.json'), 'utf8'));
  candidateSha256 ||= candidate.sha256;
  assert(sha.test(docsRevision), 'Browser input inventory needs an exact docs revision');
  assert(sha256.test(candidateSha256), 'Browser input inventory needs a candidate SHA-256');
  const docsPaths = ordered([...((await Promise.all(['src', 'scripts', 'public'].map(async directory =>
    (await listFiles(join(root, directory), directory))))).flat()), 'library-candidate.json']);
  const files = new Set(docsPaths);
  const contents = new Map(await Promise.all(docsPaths.map(async path => [path, await readFile(join(root, path))])));
  // The module/package identity gates verify publication metadata. The only
  // candidate metadata used for rendering the component shell is its source mode;
  // checks of foundation/version UI conservatively retain the complete metadata.
  const candidateContents = contents.get('library-candidate.json');
  contents.set('library-candidate.json', Buffer.from(JSON.stringify({ source: candidate.source || 'candidate' })));
  const graph = new Map(), reverse = new Map();
  for (const path of docsPaths.filter(isScript)) {
    const refs = references(path, contents.get(path).toString(), files);
    graph.set(path, refs);
    for (const target of refs.local) {
      const consumers = reverse.get(target) ?? new Set();
      consumers.add(path); reverse.set(target, consumers);
    }
  }
  const ownership = new Map();
  const globalOwnership = new Map();
  const reachesGlobal = path => {
    if (globalOwnership.has(path)) return globalOwnership.get(path);
    const pending = [path], seen = new Set();
    while (pending.length) {
      const current = pending.pop();
      if (seen.has(current)) continue;
      seen.add(current);
      if (current.startsWith('src/') && fullFallbackPaths.some(pattern => pattern.test(current))) { globalOwnership.set(path, true); return true; }
      if (directOwners(current).length) continue;
      for (const consumer of reverse.get(current) ?? []) if (consumer.startsWith('src/')) pending.push(consumer);
    }
    globalOwnership.set(path, false); return false;
  };
  const owners = path => {
    if (ownership.has(path)) return ownership.get(path);
    const result = new Set(), seen = new Set(), pending = [path];
    while (pending.length) {
      const current = pending.pop();
      if (seen.has(current)) continue;
      seen.add(current);
      const direct = directOwners(current);
      if (direct.length) direct.forEach(owner => result.add(owner));
      else for (const consumer of reverse.get(current) ?? []) if (consumer.startsWith('src/')) pending.push(consumer);
    }
    ownership.set(path, result); return result;
  };
  const globals = docsPaths.filter(path => path.startsWith('public/') || (path.startsWith('src/')
    && (path.endsWith('.css') || owners(path).size === 0 || reachesGlobal(path))));
  const configPaths = (await readdir(root)).filter(path => /^(?:index\.html|vite\.config\.[^/]+|tsconfig(?:\.[^/]+)?\.json)$/.test(path));
  const controlPaths = ['browser-reuse.mjs', 'browser-checks.mjs', 'browser-check-runner.mjs', 'browser-impact-registry.mjs',
    'browser-selection.mjs', 'browser-plan.mjs', 'browser-report.mjs', 'browser-local-validation.mjs', 'browser-smoke.mjs',
    'run-browser-ci.sh', 'check-browser-reports.mjs'].map(path => 'scripts/' + path).filter(path => files.has(path));
  for (const path of configPaths) contents.set(path, await readFile(join(root, path)));
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
  const packageInputs = normalizePackageInputs(pkg, lock);
  const libraryRoot = join(root, 'node_modules/@inkra/react');
  const libraryPaths = await listFiles(libraryRoot);
  const librarySet = new Set(libraryPaths);
  const libraryContents = new Map(await Promise.all(libraryPaths.map(async path => [path, await readFile(join(libraryRoot, path))])));
  const libraryPackage = JSON.parse(libraryContents.get('package.json').toString());
  const runtimeConfig = Object.fromEntries(['name', 'type', 'sideEffects', 'dependencies', 'peerDependencies', 'peerDependenciesMeta',
    'optionalDependencies', 'imports', 'browser'].filter(key => libraryPackage[key] !== undefined).map(key => [key, libraryPackage[key]]));
  const libraryGraph = new Map();
  for (const path of libraryPaths.filter(path => isScript(path) && !path.endsWith('.d.ts'))) libraryGraph.set(path, references(path, libraryContents.get(path).toString(), librarySet));
  const eager = new Map([...libraryGraph].map(([path, refs]) => [path, eagerModule(refs, libraryContents.get(path).toString())]));
  const eagerFull = new Set(), eagerPending = [...eager].filter(([, data]) => data.unsafe).map(([path]) => path);
  while (eagerPending.length) {
    const path = eagerPending.pop();
    if (eagerFull.has(path)) continue;
    eagerFull.add(path);
    eagerPending.push(...(libraryGraph.get(path)?.local ?? []));
  }
  const common = [
    { path: '$algorithm', sha256: digest(browserReuseAlgorithm) },
    { path: '$environment', sha256: digest({ environment, node: process.versions.node, platform: process.platform, arch: process.arch }) },
    { path: '$dependencies', sha256: digest(packageInputs) },
    { path: '$library-runtime-config', sha256: digest(runtimeConfig) },
    { path: '$library-eager-code', sha256: digest([...eager].map(([path, data]) => ({ path,
      sha256: hash(eagerFull.has(path) ? libraryContents.get(path) : data.skeleton) }))) },
  ];
  const pureBarrel = refs => refs && refs.tree.statements.length > 0 && refs.tree.statements.every(statement =>
    ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteralLike(statement.moduleSpecifier));
  function exportedTargets(path, name, seen = new Set()) {
    const key = path + '\0' + name;
    if (seen.has(key)) return [];
    seen = new Set(seen).add(key);
    const refs = libraryGraph.get(path);
    if (!refs) return [];
    if (!pureBarrel(refs)) {
      const exported = refs.tree.statements.some(statement => {
        if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause))
          return statement.exportClause.elements.some(element => element.name.text === name);
        if (!(statement.modifiers ?? []).some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) return false;
        if (statement.name?.text === name) return true;
        return ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => declaration.name?.text === name);
      });
      return exported ? [path] : [];
    }
    const targets = [];
    for (const statement of refs.tree.statements) {
      const target = resolveRelative(path, statement.moduleSpecifier.text, librarySet);
      if (!target) return [];
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) if (element.name.text === name)
          targets.push(...exportedTargets(target, element.propertyName?.text ?? element.name.text, seen));
      } else if (!statement.exportClause) targets.push(...exportedTargets(target, name, seen));
    }
    return ordered(targets);
  }
  function exportedPath(specifier) {
    const subpath = specifier === '@inkra/react' ? '.' : './' + specifier.slice('@inkra/react/'.length);
    const target = libraryPackage.exports?.[subpath];
    const runtimeTargets = value => typeof value === 'string' ? [value] : value && typeof value === 'object'
      ? Object.entries(value).filter(([condition]) => condition !== 'types').flatMap(([, nested]) => runtimeTargets(nested)) : [];
    const alternatives = ordered(runtimeTargets(target));
    // Vite/browser conditional exports can differ from Node import resolution.
    // Ambiguous conditions require the complete installed runtime inventory.
    if (alternatives.length > 1) return undefined;
    const path = alternatives[0] || (subpath === '.' ? libraryPackage.module || libraryPackage.main : undefined);
    return path && path.startsWith('./') && librarySet.has(path.slice(2)) ? { path: path.slice(2), subpath, target } : undefined;
  }
  const entries = [];
  for (const script of suite) {
    assert(/^verify-[a-z0-9-]+$/.test(script), 'Invalid browser check');
    const checkPath = 'scripts/' + script + '.mjs';
    assert(files.has(checkPath), `Browser check missing: ${checkPath}`);
    const source = contents.get(checkPath).toString();
    const components = new Set([...source.matchAll(/\/(?:docs\/)?components\/([a-z0-9-]+)/g)].map(match => match[1]));
    for (const component of browserCheckComponentOverrides[script] ?? []) components.add(component);
    const modules = browserCheckModuleOverrides[script] ?? [];
    let conservative = (!components.size && !modules.length)
      || /\/(?:docs\/)?components\/\$\{/.test(source)
      || /["'`]\/(?:docs\/)?components\/["'`]\s*\+/.test(source);
    const docsInputPaths = new Set([...globals, ...configPaths, ...controlPaths, checkPath]);
    for (const path of docsPaths.filter(path => path.startsWith('src/'))) if ([...owners(path)].some(owner => components.has(owner))) docsInputPaths.add(path);
    const pending = [...docsInputPaths];
    const visited = new Set();
    while (pending.length) {
      const path = pending.pop();
      if (visited.has(path)) continue;
      visited.add(path);
      const refs = graph.get(path);
      if (!refs) continue;
      // Generic runner helpers use computed imports/commands; their bytes are
      // global inputs. Unknown runtime imports in a test/app/fixture need all inputs.
      if (refs.unknown.length && !controlPaths.includes(path)) conservative = true;
      for (const target of refs.local) {
        // The shell imports all route examples. The named route ownership boundary
        // prevents an unrelated example's bytes becoming global inputs.
        if (path.startsWith('src/') && (owners(path).size === 0 || reachesGlobal(path)) && owners(target).size && !reachesGlobal(target) && ![...owners(target)].some(owner => components.has(owner))) continue;
        docsInputPaths.add(target); pending.push(target);
      }
    }
    if (conservative) for (const path of docsPaths.filter(path => !path.startsWith('scripts/test/') && !/^scripts\/verify-/.test(path))) docsInputPaths.add(path);
    const libraryInputs = new Set(libraryPaths.filter(path => !path.endsWith('.d.ts') && !isScript(path) && path !== 'package.json' && !/^(?:README|LICENSE)/.test(path)));
    const importDescriptors = [];
    const libraryPending = [];
    if (!conservative) for (const path of docsInputPaths) for (const imported of graph.get(path)?.imports ?? []) {
      const target = exportedPath(imported.specifier);
      if (!target) { conservative = true; break; }
      importDescriptors.push({ specifier: imported.specifier, export: target.target, names: imported.names });
      if (imported.names?.length && pureBarrel(libraryGraph.get(target.path))) {
        for (const name of imported.names) {
          const targets = exportedTargets(target.path, name);
          if (targets.length !== 1) { conservative = true; break; }
          importDescriptors.push({ specifier: imported.specifier, name, target: targets[0] });
          libraryPending.push(...targets);
        }
      } else libraryPending.push(target.path);
    }
    while (libraryPending.length && !conservative) {
      const path = libraryPending.pop();
      if (libraryInputs.has(path)) continue;
      libraryInputs.add(path);
      const refs = libraryGraph.get(path);
      if (refs?.unknown.length) { conservative = true; break; }
      if (refs) libraryPending.push(...refs.local);
    }
    if (conservative) for (const path of libraryPaths.filter(path => !path.endsWith('.d.ts') && path !== 'package.json' && !/^(?:README|LICENSE)/.test(path))) libraryInputs.add(path);
    const inputs = [...common, { path: '$library-imports', sha256: digest(importDescriptors) },
      ...ordered(docsInputPaths).map(path => ({ path: 'docs/' + path, sha256: hash(path === 'library-candidate.json' && conservative ? candidateContents : contents.get(path)) })),
      ...ordered(libraryInputs).map(path => ({ path: '@inkra/react/' + path, sha256: hash(libraryContents.get(path)) }))].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    entries.push({ script, fingerprint: digest(inputs), reusable: Boolean(environment), scope: conservative ? 'conservative-runtime' : 'module', inputs });
  }
  const inventory = { schemaVersion: 1, kind: 'inkra-browser-inputs', algorithm: browserReuseAlgorithm, docsRevision, candidateSha256,
    environment, analysis: { eagerFullModules: [...eagerFull].sort() }, entries };
  return { ...inventory, inventoryDigest: digest(inventory) };
}

export function validateBrowserInputInventory(inventory, suite) {
  assert.equal(inventory?.schemaVersion, 1, 'Unsupported browser input inventory');
  assert.equal(inventory.kind, 'inkra-browser-inputs', 'Wrong browser inventory kind');
  assert.equal(inventory.algorithm, browserReuseAlgorithm, 'Browser input algorithm changed');
  assert(sha.test(inventory.docsRevision) && sha256.test(inventory.candidateSha256), 'Invalid browser input identities');
  assert.deepEqual(inventory.entries.map(entry => entry.script), suite, 'Browser inventory suite mismatch');
  for (const entry of inventory.entries) {
    assert.equal(typeof entry.reusable, 'boolean', 'Invalid browser reuse eligibility');
    assert(!entry.reusable || Boolean(inventory.environment), 'Unbound browser environment cannot reuse results');
    assert.deepEqual(entry.inputs.map(input => input.path), ordered(entry.inputs.map(input => input.path)), 'Duplicate or unordered browser inputs');
    for (const input of entry.inputs) assert(typeof input.path === 'string' && sha256.test(input.sha256), 'Invalid browser input');
    assert.equal(entry.fingerprint, digest(entry.inputs), 'Browser input fingerprint mismatch');
  }
  const { inventoryDigest, ...unsigned } = inventory;
  assert.equal(inventoryDigest, digest(unsigned), 'Browser input inventory digest mismatch');
  return inventory;
}

function validateOrigin(origin, now = Date.now(), requireFresh = false) {
  assert.equal(origin?.repository, 'inkrajs/inkra', 'Historical browser origin repository mismatch');
  assert(Number.isSafeInteger(origin.runId) && origin.runId > 0 && Number.isSafeInteger(origin.runAttempt) && origin.runAttempt > 0,
    'Invalid historical browser origin run');
  assert(sha.test(origin.headSha) && sha.test(origin.docsRevision) && sha256.test(origin.planDigest), 'Invalid historical browser origin revision');
  const created = Date.parse(origin.createdAt);
  assert(Number.isFinite(created) && created <= now + 60_000 && (!requireFresh || now - created <= browserReuseMaxAgeMs), 'Historical browser result expired or has invalid creation time');
}

export function validateBrowserReuseBaseline(baseline, { now = Date.now() } = {}) {
  assert.equal(baseline?.schemaVersion, 1, 'Unsupported browser baseline wrapper');
  assert.equal(baseline.trusted, true, 'Browser history must come from the trusted workflow resolver');
  const origin = baseline.origin, receipt = baseline.receipt;
  assert.equal(origin?.repository, 'inkrajs/inkra', 'Browser history repository mismatch');
  assert.equal(origin.workflowPath, '.github/workflows/publish.yml', 'Browser history workflow mismatch');
  assert(Number.isSafeInteger(origin.artifactId) && origin.artifactId > 0 && /^sha256:[a-f0-9]{64}$/.test(origin.artifactDigest), 'Browser history needs an immutable artifact identity');
  assert.equal(receipt?.schemaVersion, 1, 'Unsupported browser history receipt');
  assert.equal(receipt.kind, 'inkra-browser-reuse', 'Browser history receipt kind mismatch');
  for (const key of ['repository', 'runId', 'runAttempt', 'headSha']) assert.equal(receipt[key], origin[key], `Browser history ${key} provenance mismatch`);
  assert(sha.test(receipt.docsRevision) && sha256.test(receipt.planDigest) && sha256.test(receipt.inputInventoryDigest), 'Invalid browser history receipt identity');
  validateOrigin({ ...origin, docsRevision: receipt.docsRevision, planDigest: receipt.planDigest, createdAt: receipt.createdAt }, now);
  assert.equal(new Set(receipt.entries.map(entry => entry.script)).size, receipt.entries.length, 'Duplicate historical browser checks');
  for (const entry of receipt.entries) {
    assert(/^verify-[a-z0-9-]+$/.test(entry.script) && sha256.test(entry.fingerprint), 'Invalid historical browser check');
    assert(['passed', 'local'].includes(entry.status), 'Historical browser check did not pass');
    if (entry.status === 'passed') validateOrigin(entry.origin, now);
    else assert.equal(entry.origin, undefined, 'Local confirmation cannot mint an online historical pass');
  }
  return baseline;
}

export function applyBrowserReuse(plan, inventory, baseline, { now = Date.now(), forceFull = false } = {}) {
  assert(!plan.historicalReuse && !plan.inputInventory, 'Browser history may be applied only once');
  validateBrowserInputInventory(inventory, plan.fullSuite);
  assert.equal(inventory.docsRevision, plan.testedRevision, 'Browser inventory targets a different docs revision');
  const current = new Map(inventory.entries.map(entry => [entry.script, entry]));
  let available = new Map(), validatedBaseline;
  let historyDecision = forceFull ? 'forced-online' : baseline?.reason || 'no-trusted-history';
  if (baseline?.trusted && !forceFull) {
    try {
      validateBrowserReuseBaseline(baseline, { now });
      validatedBaseline = structuredClone(baseline);
      available = new Map(baseline.receipt.entries.filter(entry => entry.status === 'passed' && now - Date.parse(entry.origin.createdAt) <= browserReuseMaxAgeMs).map(entry => [entry.script, entry]));
      historyDecision = 'validated-history';
    } catch (error) {
      // Historical cache data is optional. Invalid evidence never disables a
      // current check and need not prevent ordinary online validation.
      historyDecision = 'invalid-history: ' + error.message;
    }
  }
  const reused = plan.selectedScripts.filter(script => current.get(script).reusable
    && available.get(script)?.fingerprint === current.get(script).fingerprint);
  const selected = plan.selectedScripts.filter(script => !reused.includes(script));
  const { planDigest: _oldDigest, ...unsigned } = plan;
  const next = { ...unsigned, inputInventory: structuredClone(inventory), historyDecision,
    ...(reused.length ? { historicalReuse: { schemaVersion: 1, originalSelectedScripts: [...plan.selectedScripts],
      baseline: validatedBaseline, baselineDigest: digest(validatedBaseline),
      entries: reused.map(script => structuredClone(available.get(script))) } } : {}),
    mode: reused.length ? 'incremental' : plan.mode,
    selectedScripts: selected, selectedDigest: digest(selected), selectedCount: selected.length,
    skippedScripts: plan.fullSuite.filter(script => !selected.includes(script)), skippedCount: plan.fullSuite.length - selected.length,
    shardCount: Math.min(4, selected.length) };
  return { ...next, planDigest: digest(next) };
}

export function validateBrowserReuse(plan, suite, { now = Date.now(), candidateSha256 = process.env.EXPECTED_CANDIDATE_SHA256 } = {}) {
  if (!plan.inputInventory) {
    assert(!plan.historicalReuse, 'Browser history requires current fingerprints');
    return plan;
  }
  const inventory = validateBrowserInputInventory(plan.inputInventory, suite);
  assert.equal(inventory.docsRevision, plan.testedRevision, 'Browser inventory revision mismatch');
  if (candidateSha256) assert.equal(inventory.candidateSha256, candidateSha256, 'Browser inventory candidate mismatch');
  const receipt = plan.historicalReuse;
  if (receipt) {
    assert.equal(receipt.schemaVersion, 1, 'Unsupported historical browser partition');
    validateBrowserReuseBaseline(receipt.baseline, { now });
    assert.equal(receipt.baselineDigest, digest(receipt.baseline), 'Historical browser baseline digest mismatch');
    assert.deepEqual(receipt.originalSelectedScripts, suite.filter(script => receipt.originalSelectedScripts.includes(script)), 'Invalid original historical selection');
    const current = new Map(inventory.entries.map(entry => [entry.script, entry]));
    const historical = new Map(receipt.baseline.receipt.entries.filter(entry => entry.status === 'passed' && now - Date.parse(entry.origin.createdAt) <= browserReuseMaxAgeMs).map(entry => [entry.script, entry]));
    const expected = receipt.originalSelectedScripts.filter(script => current.get(script).reusable && historical.get(script)?.fingerprint === current.get(script).fingerprint);
    assert(expected.length > 0, 'Empty historical reuse receipt');
    assert.deepEqual(receipt.entries, expected.map(script => historical.get(script)), 'Historical checks differ from trusted matching passes');
    assert.deepEqual(plan.selectedScripts, receipt.originalSelectedScripts.filter(script => !expected.includes(script)), 'Historical and online browser checks do not partition the original selection');
    assert.equal(plan.mode, 'incremental', 'Historical browser reuse must keep its receipt');
  }
  if (plan.eventName === 'release') {
    const local = plan.localValidation?.exemptedScripts ?? [];
    const history = receipt?.entries.map(entry => entry.script) ?? [];
    const covered = [...plan.selectedScripts, ...local, ...history];
    assert.equal(new Set(covered).size, covered.length, 'Browser release coverage overlaps');
    assert.deepEqual(ordered(covered), ordered(suite), 'Release checks need online, local or historical evidence');
  }
  return plan;
}

export function createBrowserReuseReceipt(plan, { repository = process.env.GITHUB_REPOSITORY, runId = Number(process.env.GITHUB_RUN_ID),
  runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT), headSha = process.env.GITHUB_SHA, createdAt = new Date().toISOString() } = {}) {
  validateBrowserReuse(plan, plan.fullSuite);
  assert(plan.inputInventory, 'Browser receipt requires a current input inventory');
  const origin = { repository, runId, runAttempt, headSha, docsRevision: plan.testedRevision, planDigest: plan.planDigest, createdAt };
  validateOrigin(origin);
  const history = new Map((plan.historicalReuse?.entries ?? []).map(entry => [entry.script, entry]));
  const local = new Set(plan.localValidation?.exemptedScripts ?? []);
  const entries = plan.inputInventory.entries.map(entry => {
    if (history.has(entry.script)) return structuredClone(history.get(entry.script));
    if (local.has(entry.script)) return { script: entry.script, fingerprint: entry.fingerprint, status: 'local' };
    assert(plan.selectedScripts.includes(entry.script), 'Cannot mint a historical result for a skipped browser test');
    return { script: entry.script, fingerprint: entry.fingerprint, status: 'passed', origin: structuredClone(origin) };
  });
  return { schemaVersion: 1, kind: 'inkra-browser-reuse', repository, runId, runAttempt, headSha, createdAt,
    docsRevision: plan.testedRevision, planDigest: plan.planDigest, inputInventoryDigest: plan.inputInventory.inventoryDigest, entries };
}

async function main() {
  const [command, ...values] = process.argv.slice(2);
  const args = new Map();
  for (let index = 0; index < values.length; index += 2) {
    assert(values[index]?.startsWith('--') && values[index + 1] && !args.has(values[index]), 'Invalid browser reuse arguments');
    args.set(values[index], values[index + 1]);
  }
  if (command === 'inventory') {
    const inventory = await createBrowserInputInventory({ root: args.get('--root'),
      suite: browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true') });
    const output = args.get('--output') || '.ci-plan/browser-inputs.json';
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(inventory, null, 2) + '\n');
    console.log(`Browser fingerprints: ${inventory.entries.length}; environment bound: ${Boolean(inventory.environment)}.`);
  } else if (command === 'apply') {
    const planPath = args.get('--plan');
    assert(planPath && args.has('--inputs'), 'Pass --plan and --inputs');
    const plan = JSON.parse(await readFile(planPath, 'utf8'));
    const inventory = JSON.parse(await readFile(args.get('--inputs'), 'utf8'));
    const baseline = args.has('--baseline') ? JSON.parse(await readFile(args.get('--baseline'), 'utf8')) : undefined;
    const { validateBrowserSelectionPlan } = await import('./browser-plan.mjs');
    validateBrowserSelectionPlan(plan, plan.fullSuite);
    const next = applyBrowserReuse(plan, inventory, baseline, { forceFull: process.env.BROWSER_REUSE_FORCE_FULL === 'true' });
    validateBrowserSelectionPlan(next, next.fullSuite);
    await writeFile(args.get('--output') || planPath, JSON.stringify(next, null, 2) + '\n');
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, [
      `matrix=${JSON.stringify(Array.from({ length: next.shardCount }, (_, index) => index + 1))}`,
      `shard_count=${next.shardCount}`, `selected_count=${next.selectedCount}`, `plan_digest=${next.planDigest}`,
      `tested_revision=${next.testedRevision}`].join('\n') + '\n');
    const reused = next.historicalReuse?.entries ?? [];
    const text = `### Historical browser coverage\n\n${reused.length} unchanged checks reused from successful CI; ${next.localValidation?.exemptedScripts.length ?? 0} locally confirmed; ${next.selectedCount} selected online.\n`
      + (reused.length ? reused.map(entry => `- ${entry.script}: [original online pass](https://github.com/${entry.origin.repository}/actions/runs/${entry.origin.runId}) (${entry.origin.createdAt})`).join('\n') + '\n' : `No matching trusted historical result (${baseline?.reason || 'cache miss or changed inputs'}).\n`);
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text);
  } else throw new Error('Use browser-reuse.mjs inventory --output <path> or apply --plan <path> --inputs <path> [--baseline <path>]');
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exitCode = 1; });
