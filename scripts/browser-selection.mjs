import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import ts from 'typescript';

import {
  browserCheckComponentOverrides,
  browserCheckModuleOverrides,
  fullFallbackPaths,
  noBrowserImpactPaths,
  registeredBrowserChecks,
  sourceOwnerOverrides,
} from './browser-impact-registry.mjs';
import { digest } from './browser-plan.mjs';

export { digest, readBrowserSelectionPlan, validateBrowserSelectionPlan } from './browser-plan.mjs';

const sourceExtensions = ['.mjs', '.js', '.ts', '.tsx', '.css', '.json'];
const shaPattern = /^[0-9a-f]{40}$/;

function safePath(value) {
  assert(typeof value === 'string' && value.length > 0, 'Changed path must be nonempty');
  assert(!value.includes('\0') && !value.startsWith('/') && !value.includes('\\'), `Unsafe changed path: ${value}`);
  const normalized = posix.normalize(value);
  assert(normalized === value && !normalized.split('/').includes('..'), `Unsafe changed path: ${value}`);
  return normalized;
}

export function parseGitNameStatusZ(output) {
  const fields = output.split('\0');
  if (fields.at(-1) === '') fields.pop();
  const entries = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    assert(/^(?:[ACDMRTUXB]|R\d{1,3}|C\d{1,3})$/.test(status), `Invalid git status: ${status}`);
    if (status.startsWith('R') || status.startsWith('C')) {
      assert(index + 1 < fields.length, `Incomplete git ${status} entry`);
      entries.push({ status, previousPath: safePath(fields[index++]), path: safePath(fields[index++]) });
    } else {
      assert(index < fields.length, `Incomplete git ${status} entry`);
      entries.push({ status, path: safePath(fields[index++]) });
    }
  }
  return entries.sort((left, right) => `${left.path}\0${left.previousPath ?? ''}`.localeCompare(`${right.path}\0${right.previousPath ?? ''}`));
}

async function listRepositoryFiles(root, directories = ['scripts', 'src']) {
  // Foundation pages render candidate source mode. Resolve that real root
  // dependency instead of treating every PR as an unknown-import full fallback.
  const files = (await readdir(root)).filter(path => path === 'library-candidate.json');
  async function visit(path) {
    for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
      const next = posix.join(path, entry.name);
      if (entry.isDirectory()) await visit(next);
      else files.push(next);
    }
  }
  for (const directory of directories) await visit(directory);
  return files.sort();
}

function resolveLocalReference(from, specifier, files) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return undefined;
  const base = posix.normalize(posix.join(posix.dirname(from), specifier));
  const withoutRuntimeExtension = base.replace(/\.(?:m?js)$/, '');
  const candidates = [
    base,
    ...sourceExtensions.map(extension => base + extension),
    ...sourceExtensions.map(extension => posix.join(base, `index${extension}`)),
    ...(withoutRuntimeExtension === base ? [] : ['.ts', '.tsx'].map(extension => withoutRuntimeExtension + extension)),
  ];
  return candidates.find(candidate => files.has(candidate));
}

export function auditLocalReferences(path, source, files) {
  const scriptKind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, scriptKind);
  const references = new Set();
  const unresolvedModules = new Set();
  const constantSpecifiers = new Map();
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && ts.isStringLiteralLike(declaration.initializer)) {
        constantSpecifiers.set(declaration.name.text, declaration.initializer.text);
      }
    }
  }
  const knownNonRepositoryModule = node => {
    const text = node.getText(tree);
    return /^process\.env\.[A-Z0-9_]+\s*\|\|\s*['"][^./]/.test(text)
      || (ts.isTemplateExpression(node) && /^(?:data:|\/@fs)/.test(node.head.text));
  };
  const addSpecifier = (specifier, { required = false } = {}) => {
    const resolved = resolveLocalReference(path, specifier, files);
    if (resolved) references.add(resolved);
    else if (required && (specifier.startsWith('./') || specifier.startsWith('../'))) unresolvedModules.add(specifier);
  };
  const add = (node, { required = false } = {}) => {
    if (!node) return;
    if (!ts.isStringLiteralLike(node)) {
      if (ts.isIdentifier(node) && constantSpecifiers.has(node.text)) {
        addSpecifier(constantSpecifiers.get(node.text), { required });
        return;
      }
      if (required && !knownNonRepositoryModule(node)) unresolvedModules.add(`<non-literal: ${node.getText(tree)}>`);
      return;
    }
    addSpecifier(node.text, { required });
  };
  const visit = node => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier, { required: true });
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) add(node.arguments[0], { required: true });
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL') add(node.arguments?.[0]);
    if (ts.isStringLiteralLike(node) && /^(?:\.\.\/|\.\/)(?:fixtures|metadata|helpers?)\//.test(node.text)) add(node);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return { references: [...references], unresolvedModules: [...unresolvedModules] };
}

async function repositoryGraph(root) {
  const paths = await listRepositoryFiles(root);
  const files = new Set(paths);
  const dependencies = new Map();
  const reverse = new Map();
  const sources = new Map();
  const unresolvedModules = [];
  for (const path of paths) {
    if (!/\.(?:mjs|js|ts|tsx)$/.test(path)) continue;
    const source = await readFile(join(root, path), 'utf8');
    sources.set(path, source);
    const { references: refs, unresolvedModules: unresolved } = auditLocalReferences(path, source, files);
    dependencies.set(path, refs);
    unresolvedModules.push(...unresolved
      .filter(specifier => !specifier.startsWith('<non-literal:') || path.startsWith('src/'))
      .filter(() => !path.startsWith('scripts/test/'))
      .map(specifier => ({ path, specifier })));
    for (const dependency of refs) {
      const dependents = reverse.get(dependency) ?? new Set();
      dependents.add(path);
      reverse.set(dependency, dependents);
    }
  }
  return { dependencies, files, paths, reverse, sources, unresolvedModules };
}

function kebabCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
}

function directSourceOwners(path) {
  if (sourceOwnerOverrides[path]) return sourceOwnerOverrides[path];
  const match = path.match(/^src\/components\/(?:expansion\/)?([A-Z][A-Za-z0-9]*)Examples\.(?:ts|tsx)$/);
  return match ? [kebabCase(match[1])] : [];
}

function reverseDependents(path, reverse) {
  const seen = new Set([path]);
  const pending = [path];
  while (pending.length) {
    const current = pending.shift();
    for (const dependent of reverse.get(current) ?? []) {
      if (seen.has(dependent)) continue;
      seen.add(dependent);
      pending.push(dependent);
    }
  }
  seen.delete(path);
  return seen;
}

function ownersForPath(path, graph) {
  const owners = new Set(directSourceOwners(path));
  for (const dependent of reverseDependents(path, graph.reverse)) {
    for (const owner of directSourceOwners(dependent)) owners.add(owner);
  }
  return owners;
}

export function globalConsumersForPath(path, graph) {
  const consumers = new Set();
  if (directSourceOwners(path).length) return consumers;
  const seen = new Set([path]);
  const pending = [path];
  while (pending.length) {
    const current = pending.shift();
    for (const dependent of graph.reverse.get(current) ?? []) {
      if (seen.has(dependent)) continue;
      seen.add(dependent);
      if (directSourceOwners(dependent).length) continue;
      if (matchesAny(dependent, fullFallbackPaths)) consumers.add(dependent);
      else pending.push(dependent);
    }
  }
  return consumers;
}

function routeComponents(source) {
  return new Set([...source.matchAll(/\/(?:docs\/)?components\/([a-z0-9-]+)/g)].map(match => match[1]));
}

function checkImpactRegistry(suite, graph) {
  const suiteSet = new Set(suite);
  const registered = new Set(registeredBrowserChecks);
  const missing = suite.filter(check => !registered.has(check));
  const stale = registeredBrowserChecks.filter(check => !suiteSet.has(check));
  const impacts = new Map();
  const unmapped = [];
  for (const check of suite) {
    const source = graph.sources.get(`scripts/${check}.mjs`) ?? '';
    const components = routeComponents(source);
    for (const component of browserCheckComponentOverrides[check] ?? []) components.add(component);
    const modules = new Set(browserCheckModuleOverrides[check] ?? []);
    if (!components.size && !modules.size) unmapped.push(check);
    impacts.set(check, { components, modules });
  }
  return { impacts, missing, stale, unmapped };
}

function impactedBrowserChecks(path, graph, suite) {
  const checks = new Set();
  for (const dependent of reverseDependents(path, graph.reverse)) {
    const match = dependent.match(/^scripts\/(verify-[a-z0-9-]+)\.mjs$/);
    if (match && suite.includes(match[1])) checks.add(match[1]);
  }
  return checks;
}

function reason(code, detail, paths = []) {
  return { code, detail, ...(paths.length ? { paths: [...new Set(paths)].sort() } : {}) };
}

export async function inspectPullRequestProvenance({
  baseRevision,
  pullRequestHeadRevision,
  testedRevision,
  hasCommit,
  isAncestor,
}) {
  let missingBase = false;
  const failures = [];
  if (!baseRevision || !(await hasCommit(baseRevision))) missingBase = true;
  else if (!(await isAncestor(baseRevision, testedRevision))) {
    failures.push(reason('base-not-ancestor', 'The requested pull request base is not an ancestor of the tested revision', [baseRevision]));
  }
  if (!pullRequestHeadRevision) {
    failures.push(reason('missing-pr-head', 'The pull request head revision was not provided'));
  } else if (!(await hasCommit(pullRequestHeadRevision))) {
    failures.push(reason('pr-head-unavailable', 'The requested pull request head commit is unavailable', [pullRequestHeadRevision]));
  } else if (!(await isAncestor(pullRequestHeadRevision, testedRevision))) {
    failures.push(reason('pr-head-not-ancestor', 'The requested pull request head is not an ancestor of the tested revision', [pullRequestHeadRevision]));
  }
  return { failures, missingBase };
}

function matchesAny(path, patterns) {
  return patterns.some(pattern => pattern.test(path));
}

export async function createBrowserSelectionPlan({
  root = process.cwd(), suite, eventName, baseRevision = '', testedRevision,
  pullRequestHeadRevision = '', changedEntries = [], missingBase = false, provenanceFailures = [],
}) {
  assert(Array.isArray(suite) && suite.length > 0 && new Set(suite).size === suite.length, 'Browser suite must be nonempty and unique');
  assert(shaPattern.test(testedRevision), 'testedRevision must be an exact commit');
  if (baseRevision) assert(shaPattern.test(baseRevision), 'baseRevision must be an exact commit');
  if (pullRequestHeadRevision) assert(shaPattern.test(pullRequestHeadRevision), 'pullRequestHeadRevision must be an exact commit');
  const graph = await repositoryGraph(root);
  const registry = checkImpactRegistry(suite, graph);
  const fallback = [];
  const reasons = [];
  const selected = new Set();

  if (eventName !== 'pull_request') fallback.push(reason('non-pull-request', `${eventName || 'unknown'} runs retain full browser coverage`));
  if (missingBase) fallback.push(reason('missing-base', 'The pull request base commit was unavailable, so changed paths are not trustworthy'));
  fallback.push(...provenanceFailures);
  if (registry.missing.length || registry.stale.length || registry.unmapped.length) {
    fallback.push(reason('impact-registry-incomplete', 'Every current browser check must have explicit registry coverage', [
      ...registry.missing.map(check => `missing:${check}`),
      ...registry.stale.map(check => `stale:${check}`),
      ...registry.unmapped.map(check => `unmapped:${check}`),
    ]));
  }
  if (graph.unresolvedModules.length) {
    fallback.push(reason('unresolved-local-import', 'Every relative module import must resolve before incremental impact can be trusted',
      graph.unresolvedModules.map(({ path, specifier }) => `${path} -> ${specifier}`)));
  }

  const entries = changedEntries.map(entry => ({
    status: entry.status,
    path: safePath(entry.path),
    ...(entry.previousPath ? { previousPath: safePath(entry.previousPath) } : {}),
  })).sort((left, right) => `${left.path}\0${left.previousPath ?? ''}`.localeCompare(`${right.path}\0${right.previousPath ?? ''}`));

  if (eventName === 'pull_request' && !missingBase) {
    for (const entry of entries) {
      const paths = entry.previousPath ? [entry.previousPath, entry.path] : [entry.path];
      for (const path of paths) {
        if (matchesAny(path, fullFallbackPaths)) {
          fallback.push(reason('full-impact-path', `${path} can affect the public shell, build, candidate, suite or report trust`, [path]));
          continue;
        }
        if (matchesAny(path, noBrowserImpactPaths)) {
          reasons.push(reason('no-browser-impact', `${path} is documentation-only`, [path]));
          continue;
        }
        const verify = path.match(/^scripts\/(verify-[a-z0-9-]+)\.mjs$/);
        if (verify) {
          if (suite.includes(verify[1]) && registeredBrowserChecks.includes(verify[1])) {
            selected.add(verify[1]);
            reasons.push(reason('browser-check-changed', `${verify[1]} changed`, [path]));
          } else fallback.push(reason('unregistered-browser-check', `${path} is not in the trusted browser impact registry`, [path]));
          continue;
        }
        if (path.startsWith('scripts/test/')) {
          const dependencies = graph.dependencies.get(path) ?? [];
          const dependentChecks = new Set();
          for (const dependency of dependencies) for (const check of impactedBrowserChecks(dependency, graph, suite)) dependentChecks.add(check);
          for (const check of dependentChecks) selected.add(check);
          reasons.push(reason('contract-test-changed', `${path} remains covered by the full contract build${dependentChecks.size ? ' and selects browser consumers of its helpers' : ''}`, [path]));
          continue;
        }
        if (path.startsWith('scripts/')) {
          const checks = impactedBrowserChecks(path, graph, suite);
          if (!checks.size) fallback.push(reason('unresolved-script-impact', `${path} has no trusted browser consumer`, [path]));
          else {
            for (const check of checks) selected.add(check);
            reasons.push(reason('transitive-browser-helper', `${path} selects every importing browser check`, [path]));
          }
          continue;
        }
        if (path.startsWith('src/')) {
          const globalConsumers = globalConsumersForPath(path, graph);
          if (globalConsumers.size) {
            fallback.push(reason('shared-global-impact', `${path} reaches the application shell without crossing a component ownership boundary`, [...globalConsumers]));
            continue;
          }
          const owners = ownersForPath(path, graph);
          if (!owners.size && (entry.status === 'D' || (entry.previousPath === path && entry.status.startsWith('R')))) {
            fallback.push(reason('deleted-source-unresolved', `${path} was removed and has no direct component owner`, [path]));
            continue;
          }
          if (!owners.size) {
            fallback.push(reason('unknown-source-impact', `${path} has no component/module owner`, [path]));
            continue;
          }
          const checks = new Set(suite.filter(check => [...owners].some(owner => registry.impacts.get(check)?.components.has(owner))));
          for (const check of impactedBrowserChecks(path, graph, suite)) checks.add(check);
          if (!checks.size) fallback.push(reason('component-without-check', `${[...owners].join(', ')} has no registered browser consumer`, [path]));
          else {
            checks.forEach(check => selected.add(check));
            reasons.push(reason('component-impact', `${path} affects ${[...owners].sort().join(', ')}`, [path]));
          }
          continue;
        }
        fallback.push(reason('unknown-path', `${path} is not covered by an incremental rule`, [path]));
      }
    }
  }

  const mode = fallback.length ? 'full' : 'incremental';
  const selectedScripts = mode === 'full' ? [...suite] : suite.filter(check => selected.has(check));
  const skippedScripts = suite.filter(check => !selectedScripts.includes(check));
  const plan = {
    schemaVersion: 1,
    repository: 'inkrajs/docs',
    eventName,
    testedRevision,
    baseRevision: baseRevision || null,
    pullRequestHeadRevision: pullRequestHeadRevision || null,
    mode,
    reasons: [...fallback, ...reasons],
    changedEntries: entries,
    fullSuite: [...suite],
    fullSuiteDigest: digest(suite),
    selectedScripts,
    selectedDigest: digest(selectedScripts),
    selectedCount: selectedScripts.length,
    skippedScripts,
    skippedCount: skippedScripts.length,
    shardCount: Math.min(4, selectedScripts.length),
  };
  return { ...plan, planDigest: digest(plan) };
}

export function repositoryRelative(root, path) {
  return relative(resolve(root), resolve(path)).split('\\').join('/');
}
