import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
assert(process.argv[2], 'Pass the inkra checkout path containing a verified .release/manifest.json.');
assert(process.argv.slice(3).every(argument => argument === '--lockfile-only'), 'Unknown preparation option');
const lockfileOnly = process.argv.includes('--lockfile-only');
const source = resolve(process.argv[2]);
const manifest = JSON.parse(await readFile(resolve(source, '.release/manifest.json'), 'utf8'));
assert.equal(manifest.name, '@inkra/react');
assert(/^[\w.-]+\.tgz$/.test(manifest.filename), 'Invalid candidate filename');
const archive = resolve(source, '.release', manifest.filename);
const sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
assert.equal(sha256, manifest.sha256, 'Candidate checksum mismatch');
await mkdir(resolve(root, 'vendor'), { recursive: true });
await copyFile(archive, resolve(root, 'vendor/inkra.tgz'));
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org',
  ...(lockfileOnly ? ['--package-lock-only'] : []), './vendor/inkra.tgz'], { cwd: root, stdio: 'inherit' });
// Vite watches this imported manifest; restart only after the new package is installed.
await writeFile(resolve(root, 'library-candidate.json'), JSON.stringify({
  repository: 'inkrajs/inkra',
  name: manifest.name,
  revision: manifest.commit,
  version: manifest.version,
  sha256,
  integrity: manifest.integrity,
}, null, 2) + '\n');
console.log(lockfileOnly
  ? 'Prepared the verified candidate and lockfile. Run npm ci before building.'
  : 'Prepared and installed the verified Inkra candidate. This does not publish anything.');
