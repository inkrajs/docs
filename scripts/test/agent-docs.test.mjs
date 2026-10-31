import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after, before } from 'node:test';
import { foundationComponents } from '../../src/componentRoutes.ts';
import { generateAgentDocs, inside, validateIdentity } from '../generate-agent-docs.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
let temporary, outputDir, result;
before(async () => {
  temporary = await mkdtemp(path.join(os.tmpdir(), 'inkra-agent-docs-'));
  outputDir = path.join(temporary, 'site');
  result = await generateAgentDocs({ root, outputDir });
});
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });
const json = async file => JSON.parse(await readFile(file, 'utf8'));

test('catalog covers every canonical component route exactly once with resolvable documents', async () => {
  const catalog = await json(path.join(outputDir, 'ai/components.json'));
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(new Set(catalog.components.map(item => item.slug)), new Set(['button', ...foundationComponents]));
  assert.equal(catalog.components.length, foundationComponents.length + 1);
  assert.equal(new Set(catalog.components.map(item => item.markdownUrl)).size, catalog.components.length);
  for (const component of catalog.components) {
    assert(component.summary.zh && component.summary.en && component.category);
    assert(component.exports.length > 0);
    assert.equal(component.importPath, '@inkra/react');
    for (const [property, suffix] of [['markdownUrl', '.md'], ['typesUrl', '.d.ts']]) {
      const url = new URL(component[property], 'http://localhost:4242/');
      assert.equal(url.origin, 'http://localhost:4242');
      assert(url.pathname.endsWith(suffix));
      assert((await readFile(inside(outputDir, url.pathname.slice(1)), 'utf8')).length > 20);
    }
    assert.equal(new URL(component.apiUrl, 'http://localhost').hash, '#api');
  }
});

test('snapshot binds to the installed package and rejects version, name and lock mismatches', async () => {
  const candidate = await json(path.join(root, 'library-candidate.json'));
  const installed = await json(path.join(root, 'node_modules/@inkra/react/package.json'));
  const lock = await json(path.join(root, 'package-lock.json'));
  const docs = await json(path.join(root, 'package.json'));
  assert.equal(result.catalog.package.version, installed.version);
  assert.equal(result.catalog.package.source, candidate.source ?? 'candidate');
  assert.throws(() => validateIdentity(candidate, { ...installed, version: '0.0.0' }, lock, docs), /Installed version/);
  assert.throws(() => validateIdentity(candidate, { ...installed, name: '@other/library' }, lock, docs), /Installed package name/);
  const changedLock = structuredClone(lock);
  changedLock.packages['node_modules/@inkra/react'].integrity = 'changed';
  assert.throws(() => validateIdentity(candidate, installed, changedLock, docs), /integrity/);
  if (process.env.GITHUB_ACTIONS !== 'true') assert.equal(result.catalog.docsRevision, null, 'Local builds must not masquerade as deployed commits');
});

test('component APIs are actual readable declarations, with the Icon alias and button family intact', async () => {
  const bySlug = new Map(result.catalog.components.map(item => [item.slug, item]));
  assert.deepEqual(bySlug.get('icon').exports, ['PencilIcon']);
  assert.deepEqual(bySlug.get('button').exports, ['Button', 'ButtonLink', 'ButtonGroup']);
  for (const component of result.catalog.components) {
    const typesRelative = component.typesUrl.slice('/ai/types/'.length);
    const actual = await readFile(path.join(root, 'node_modules/@inkra/react/dist', typesRelative), 'utf8');
    const copied = await readFile(path.join(outputDir, component.typesUrl.slice(1)), 'utf8');
    assert.equal(copied, actual, component.name);
    const markdown = await readFile(path.join(outputDir, component.markdownUrl.slice(1)), 'utf8');
    assert(markdown.includes('```ts\n' + actual.trimEnd() + '\n```'), `${component.name} must contain its API, not only link to a JS page shell`);
    for (const exported of component.exports) assert(markdown.includes(exported));
    assert(markdown.includes(`@inkra/react@${result.catalog.package.version}`));
  }
});

test('declaration tree preserves every file and links local transitive types', async () => {
  assert(result.declarationCount > 100);
  const dependency = await readFile(path.join(outputDir, 'ai/components/dependency-graph.md'), 'utf8');
  assert(dependency.includes('/ai/types/dependency-graph/model.d.ts'));
  assert(dependency.includes('/ai/types/node-graph/index.d.ts'));
  assert.equal(await readFile(path.join(outputDir, 'ai/types/dependency-graph/model.d.ts'), 'utf8'),
    await readFile(path.join(root, 'node_modules/@inkra/react/dist/dependency-graph/model.d.ts'), 'utf8'));
  const componentFiles = await readdir(path.join(outputDir, 'ai/components'));
  assert.equal(componentFiles.length, result.catalog.components.length);
});

test('static examples are identified honestly and discovery explains independent versions', async () => {
  assert(result.catalog.components.some(item => item.exampleCount > 0));
  const button = result.catalog.components.find(item => item.slug === 'button');
  assert(button.exampleCount > 0);
  const markdown = await readFile(path.join(outputDir, button.markdownUrl.slice(1)), 'utf8');
  assert(markdown.includes('statically extracted documentation excerpts'));
  assert(!markdown.includes('<DocsIcon'));
  const llms = await readFile(path.join(outputDir, 'llms.txt'), 'utf8');
  assert(llms.includes('/ai/components.json') && llms.includes('/skills/registry.json'));
  assert(llms.includes('installed package are separate facts'));
  assert(llms.includes('@inkra/react/styles.css'));
  for (const component of result.catalog.components) assert(llms.includes(component.markdownUrl));
});

test('generated path boundaries reject escape and absolute paths', () => {
  assert.throws(() => inside('/tmp/inkra-docs', '../outside'), /escapes/);
  assert.throws(() => inside('/tmp/inkra-docs', '/outside'), /relative/);
  assert.throws(() => inside('/tmp/inkra-docs', '.'), /escapes/);
  assert.equal(inside('/tmp/inkra-docs', 'types/../components/button.md'), '/tmp/inkra-docs/components/button.md');
});
