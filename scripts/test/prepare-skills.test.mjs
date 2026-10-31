import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkPreparedSkills, prepareSkills } from '../prepare-skills.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'inkra-skills-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'source'), output = join(root, 'public-skills');
  await mkdir(source);
  const skills = ['inkra', 'inkra-docs', 'inkra-design'].map(name => ({ name, description: `Use ${name}` }));
  await writeFile(join(source, 'registry.json'), JSON.stringify({ schemaVersion: 1, skills }));
  for (const { name } of skills) {
    const folder = join(source, name); await mkdir(folder);
    await writeFile(join(folder, 'SKILL.md'), `---\nname: ${name}\ndescription: Use ${name}\n---\n# ${name}\n`);
    await writeFile(join(folder, 'README.md'), 'Install this skill independently.\n');
    await writeFile(join(folder, 'LICENSE'), 'MIT\n');
  }
  return { source, output };
}

test('prepares complete independent archives and reproducible content digests', async t => {
  const { source, output } = await fixture(t);
  const first = await prepareSkills(source, output);
  assert.equal(first.skills, 3);
  const archive = await readFile(join(output, 'inkra.zip'));
  const entries = JSON.parse(execFileSync('python3', ['-c', 'import zipfile,json,sys;print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))', join(output, 'inkra.zip')], { encoding: 'utf8' }));
  assert.deepEqual(entries.sort(), ['inkra/LICENSE', 'inkra/README.md', 'inkra/SKILL.md']);
  const registry = JSON.parse(await readFile(join(output, 'registry.json'), 'utf8'));
  assert.equal(registry.skills[1].entryUrl, '/skills/inkra-docs/SKILL.md');
  const second = await prepareSkills(source, output);
  assert.equal(first.sourceTreeSha256, second.sourceTreeSha256);
  assert.deepEqual(archive, await readFile(join(output, 'inkra.zip')));
  await writeFile(join(source, 'inkra-docs', 'README.md'), 'Updated usage\n');
  const updated = await prepareSkills(source, output);
  assert.notEqual(updated.sourceTreeSha256, first.sourceTreeSha256);
  assert.equal(await readFile(join(output, 'inkra-docs', 'README.md'), 'utf8'), 'Updated usage\n');
});

test('detects edited and unexpected prepared assets', async t => {
  const { source, output } = await fixture(t); await prepareSkills(source, output);
  const original = await readFile(join(output, 'inkra', 'README.md'));
  await writeFile(join(output, 'inkra', 'README.md'), 'tampered');
  await assert.rejects(checkPreparedSkills(output), /mismatch/);
  await writeFile(join(output, 'inkra', 'README.md'), original);
  await writeFile(join(output, 'unexpected.md'), 'extra');
  await assert.rejects(checkPreparedSkills(output), /Refresh the prepared skills/);
});

test('rejects escaping names and destructive source/output overlap', async t => {
  const { source, output } = await fixture(t);
  await assert.rejects(prepareSkills(source, source), /separate output/);
  await assert.rejects(prepareSkills(source, join(source, '..')), /separate output/);
  await writeFile(join(source, 'registry.json'), JSON.stringify({ schemaVersion: 1, skills: [{ name: '../outside', description: 'bad' }] }));
  await assert.rejects(prepareSkills(source, output), /Invalid or duplicate/);
});

test('rejects skill-root symlinks instead of copying an external directory', async t => {
  const { source, output } = await fixture(t);
  const external = join(source, '..', 'external'); await mkdir(external);
  for (const file of ['SKILL.md', 'README.md', 'LICENSE']) await writeFile(join(external, file), 'external');
  await rm(join(source, 'inkra'), { recursive: true }); await symlink(external, join(source, 'inkra'));
  await assert.rejects(prepareSkills(source, output), /symlink/);
});
