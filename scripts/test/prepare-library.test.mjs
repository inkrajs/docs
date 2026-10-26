import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('candidate preparation can update only the lockfile without changing local install defaults', async t => {
  const root = await mkdtemp(join(tmpdir(), 'inkra-prepare-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['scripts', 'source/.release', 'bin']) await mkdir(join(root, directory), { recursive: true });
  await copyFile(new URL('../prepare-library.mjs', import.meta.url), join(root, 'scripts/prepare-library.mjs'));
  const archive = Buffer.from('verified test archive');
  const manifest = {
    name: '@inkra/react', version: '1.0.0', filename: 'inkra-react-1.0.0.tgz', commit: 'a'.repeat(40),
    sha256: createHash('sha256').update(archive).digest('hex'), integrity: 'test-fixture-integrity',
  };
  await writeFile(join(root, 'source/.release/manifest.json'), JSON.stringify(manifest));
  await writeFile(join(root, 'source/.release', manifest.filename), archive);
  const npm = join(root, 'bin/npm');
  await writeFile(npm, '#!' + process.execPath + '\n' +
    "require('node:fs').writeFileSync(process.env.NPM_ARGUMENTS, JSON.stringify(process.argv.slice(2)));\n");
  await chmod(npm, 0o755);
  const argsFile = join(root, 'npm-arguments.json');
  const run = flags => execFileSync(process.execPath, [
    join(root, 'scripts/prepare-library.mjs'), join(root, 'source'), ...flags,
  ], { env: { ...process.env, PATH: join(root, 'bin') + ':' + process.env.PATH, NPM_ARGUMENTS: argsFile }, stdio: 'pipe' });
  for (const flags of [[], ['--lockfile-only']]) {
    run(flags);
    const args = JSON.parse(await readFile(argsFile, 'utf8'));
    assert.equal(args.includes('--package-lock-only'), flags.length > 0);
    assert(args.includes('--ignore-scripts'));
    assert.equal(args.at(-1), './vendor/inkra.tgz');
    assert.deepEqual(await readFile(join(root, 'vendor/inkra.tgz')), archive);
    assert.equal(JSON.parse(await readFile(join(root, 'library-candidate.json'), 'utf8')).revision, manifest.commit);
  }
  assert.throws(() => run(['--unknown']), /Unknown preparation option/);
  await writeFile(join(root, 'source/.release', manifest.filename), 'modified archive');
  assert.throws(() => run(['--lockfile-only']), /Candidate checksum mismatch/);
});
