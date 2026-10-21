import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const candidate = JSON.parse(await readFile(new URL('library-candidate.json', root), 'utf8'));
const archive = await readFile(new URL('vendor/inkra.tgz', root));
assert.equal(createHash('sha256').update(archive).digest('hex'), candidate.sha256, 'Candidate archive changed');
assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), candidate.integrity, 'Candidate integrity changed');
assert(candidate.revision === null || /^[0-9a-f]{40}$/.test(candidate.revision), 'Candidate revision must be an exact commit or explicitly uncommitted');
assert.equal((await lstat(new URL('node_modules/inkra', root))).isSymbolicLink(), false, 'Docs must use an installed archive, not a source workspace link');
const installed = JSON.parse(await readFile(new URL('node_modules/inkra/package.json', root), 'utf8'));
assert.equal(installed.version, candidate.version);
assert.equal(installed.name, 'inkra');
const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
assert.equal(lock.packages['node_modules/inkra'].integrity, candidate.integrity);
assert.equal(lock.packages['node_modules/inkra'].resolved, 'file:vendor/inkra.tgz');
assert.equal(lock.packages[''].dependencies.inkra, 'file:vendor/inkra.tgz');
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path) continue;
  assert(!entry.link, `Unexpected workspace link: ${path}`);
  if (path === 'node_modules/inkra') continue;
  assert.equal(new URL(entry.resolved).origin, 'https://registry.npmjs.org', `Non-public dependency: ${path}`);
  assert(entry.integrity, `Missing integrity: ${path}`);
}
assert.equal(candidate.repository, 'inkrajs/inkra');
console.log('Docs candidate identity, archive checksum and installed-package boundary passed.');
