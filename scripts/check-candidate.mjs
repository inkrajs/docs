import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const candidate = JSON.parse(await readFile(new URL('library-candidate.json', root), 'utf8'));
assert.equal(candidate.name, '@inkra/react');
assert([undefined, 'registry'].includes(candidate.source), 'Unknown library source');
const fromRegistry = candidate.source === 'registry';
let archive;
let archiveUrl = 'file:vendor/inkra.tgz';
if (fromRegistry) {
  assert(/^\d+\.\d+\.\d+$/.test(candidate.version), 'Pin an exact released version');
  assert(/^[0-9a-f]{40}$/.test(candidate.revision), 'Pin the released source commit');
  const response = await fetch('https://registry.npmjs.org/' + encodeURIComponent(candidate.name) + '/' + candidate.version, { signal: AbortSignal.timeout(30000) });
  assert(response.ok, `Registry metadata request failed: ${response.status}`);
  const published = await response.json();
  assert.equal(published.name, candidate.name);
  assert.equal(published.version, candidate.version);
  assert.equal(published.dist.integrity, candidate.integrity, 'Published integrity changed');
  archiveUrl = published.dist.tarball;
  assert.equal(new URL(archiveUrl).origin, 'https://registry.npmjs.org');
  const download = await fetch(archiveUrl, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  assert(download.ok, `Registry archive request failed: ${download.status}`);
  archive = Buffer.from(await download.arrayBuffer());
} else {
  archive = await readFile(new URL('vendor/inkra.tgz', root));
}
assert.equal(createHash('sha256').update(archive).digest('hex'), candidate.sha256, 'Candidate archive changed');
assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), candidate.integrity, 'Candidate integrity changed');
assert(candidate.revision === null || /^[0-9a-f]{40}$/.test(candidate.revision), 'Candidate revision must be an exact commit or explicitly uncommitted');
assert.equal((await lstat(new URL('node_modules/@inkra/react', root))).isSymbolicLink(), false, 'Docs must use an installed archive, not a source workspace link');
const installed = JSON.parse(await readFile(new URL('node_modules/@inkra/react/package.json', root), 'utf8'));
assert.equal(installed.version, candidate.version);
assert.equal(installed.name, '@inkra/react');
assert.equal(candidate.name, installed.name);
const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
assert.equal(lock.packages['node_modules/@inkra/react'].integrity, candidate.integrity);
assert.equal(lock.packages['node_modules/@inkra/react'].resolved, archiveUrl);
const dependency = fromRegistry ? candidate.version : 'file:vendor/inkra.tgz';
assert.equal(lock.packages[''].dependencies['@inkra/react'], dependency);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
assert.equal(pkg.dependencies['@inkra/react'], dependency);
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path) continue;
  assert(!entry.link, `Unexpected workspace link: ${path}`);
  if (path === 'node_modules/@inkra/react') continue;
  assert.equal(new URL(entry.resolved).origin, 'https://registry.npmjs.org', `Non-public dependency: ${path}`);
  assert(entry.integrity, `Missing integrity: ${path}`);
}
assert.equal(candidate.repository, 'inkrajs/inkra');
console.log('Docs candidate identity, archive checksum and installed-package boundary passed.');
