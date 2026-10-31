import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultOutput = fileURLToPath(new URL('../public/skills/', import.meta.url));
const hash = data => createHash('sha256').update(data).digest('hex');
const validName = name => typeof name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
async function filesIn(directory, prefix = '') {
  const result = [];
  for (const name of (await readdir(join(directory, prefix))).sort()) {
    assert(!name.startsWith('.'), `Hidden skill asset: ${name}`);
    const path = join(prefix, name), stat = await lstat(join(directory, path));
    assert(!stat.isSymbolicLink(), `Skill symlinks are not portable: ${path}`);
    if (stat.isDirectory()) result.push(...await filesIn(directory, path));
    else { assert(stat.isFile(), `Unexpected skill asset: ${path}`); result.push(path.replaceAll('\\', '/')); }
  }
  return result;
}

export async function checkPreparedSkills(directory = defaultOutput) {
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.generatedBy, 'prepare-skills');
  const paths = new Set();
  for (const file of manifest.files) {
    assert(typeof file.path === 'string' && file.path && !file.path.includes('\\') && !file.path.startsWith('/')
      && file.path.split('/').every(part => part && part !== '.' && part !== '..'), 'Invalid skill asset path');
    assert(!paths.has(file.path), `Duplicate skill asset: ${file.path}`); paths.add(file.path);
    const data = await readFile(join(directory, file.path));
    assert.equal(data.length, file.bytes, `Skill asset size mismatch: ${file.path}`);
    assert.equal(hash(data), file.sha256, `Skill asset digest mismatch: ${file.path}`);
  }
  const actual = (await filesIn(directory)).filter(path => path !== 'manifest.json');
  assert.deepEqual(actual.sort(), [...paths].sort(), 'Refresh the prepared skills after adding/removing files');
  const registry = JSON.parse(await readFile(join(directory, 'registry.json'), 'utf8'));
  assert.equal(registry.schemaVersion, 1);
  const names = new Set();
  for (const skill of registry.skills) {
    assert(validName(skill.name) && !names.has(skill.name), 'Invalid or duplicate skill name'); names.add(skill.name);
    assert.equal(skill.entryUrl, `/skills/${skill.name}/SKILL.md`);
    assert.equal(skill.readmeUrl, `/skills/${skill.name}/README.md`);
    assert.equal(skill.downloadUrl, `/skills/${skill.name}.zip`);
    const entry = await readFile(join(directory, skill.name, 'SKILL.md'), 'utf8');
    const front = entry.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    assert(front && front[1].split('\n').some(line => line.trim() === `name: ${skill.name}`), 'Skill entry name must match the directory');
    for (const path of [`${skill.name}/SKILL.md`, `${skill.name}/README.md`, `${skill.name}/LICENSE`, `${skill.name}.zip`]) assert(paths.has(path), `Missing skill asset ${path}`);
  }
  assert(names.has('inkra') && names.has('inkra-docs') && names.has('inkra-design'), 'Expected the three independent Inkra skills');
  return { skills: names.size, files: paths.size, sourceTreeSha256: manifest.sourceTreeSha256 };
}

export async function prepareSkills(source, output = defaultOutput) {
  source = resolve(source); output = resolve(output);
  assert(source !== output && !output.startsWith(source + '/') && !source.startsWith(output + '/'), 'Use a separate output directory');
  const registry = JSON.parse(await readFile(join(source, 'registry.json'), 'utf8'));
  assert.equal(registry.schemaVersion, 1); assert(Array.isArray(registry.skills) && registry.skills.length);
  const names = new Set();
  for (const skill of registry.skills) {
    assert(validName(skill.name) && !names.has(skill.name), 'Invalid or duplicate skill name'); names.add(skill.name);
    assert(typeof skill.description === 'string' && skill.description.trim());
    for (const path of ['SKILL.md', 'README.md', 'LICENSE']) await readFile(join(source, skill.name, path));
    assert(!(await lstat(join(source, skill.name))).isSymbolicLink(), 'Skill root must not be a symlink');
    await filesIn(join(source, skill.name));
  }
  try { await lstat(output); await checkPreparedSkills(output); }
  catch (error) { if (error.code !== 'ENOENT') throw error; const present = await lstat(output).catch(() => null); assert(!present, 'Refusing to overwrite an unrecognized skills directory'); }
  await mkdir(dirname(output), { recursive: true });
  const stage = await mkdtemp(join(dirname(output), '.skills-stage-'));
  try {
    const publishedRegistry = { ...registry, skills: registry.skills.map(skill => ({ ...skill,
      entryUrl: `/skills/${skill.name}/SKILL.md`, readmeUrl: `/skills/${skill.name}/README.md`, downloadUrl: `/skills/${skill.name}.zip`,
    })) };
    await writeFile(join(stage, 'registry.json'), JSON.stringify(publishedRegistry, null, 2) + '\n');
    for (const skill of registry.skills) {
      await cp(join(source, skill.name), join(stage, skill.name), { recursive: true });
      execFileSync('python3', ['-c', `import pathlib,sys,zipfile
source=pathlib.Path(sys.argv[1]); target=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for path in sorted(source.rglob('*')):
  if path.is_file():
   item=zipfile.ZipInfo((pathlib.Path(source.name)/path.relative_to(source)).as_posix(),date_time=(1980,1,1,0,0,0))
   item.compress_type=zipfile.ZIP_DEFLATED; item.external_attr=0o100644<<16
   archive.writestr(item,path.read_bytes())
`, join(stage, skill.name), join(stage, `${skill.name}.zip`)]);
    }
    const files = [];
    for (const path of await filesIn(stage)) { const data = await readFile(join(stage, path)); files.push({ path, bytes: data.length, sha256: hash(data) }); }
    const sourceFiles = files.filter(file => !file.path.endsWith('.zip'));
    const manifest = { schemaVersion: 1, generatedBy: 'prepare-skills', sourceRepository: 'inkrajs/inkra',
      sourceRevision: null, sourceTreeSha256: hash(JSON.stringify(sourceFiles)), files };
    await writeFile(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const result = await checkPreparedSkills(stage);
    await rm(output, { recursive: true, force: true }); await rename(stage, output);
    return result;
  } finally { await rm(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const arg = process.argv[2];
  assert(arg, 'Usage: node scripts/prepare-skills.mjs <skills-source-directory> [output-directory] | --check');
  const result = arg === '--check' ? await checkPreparedSkills() : await prepareSkills(arg, process.argv[3]);
  console.log(`Prepared skills verified: ${result.skills} independent skills, ${result.files} files (${result.sourceTreeSha256}).`);
}
