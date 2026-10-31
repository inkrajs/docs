import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { componentNavigationGroups, foundationNames } from '../src/componentRoutes.ts';
import { componentIntroductions } from '../src/components/componentIntroductions.ts';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const asJson = async file => JSON.parse(await readFile(file, 'utf8'));

/** Resolve generated and copied paths within their declared root. */
export function inside(root, relative) {
  assert(typeof relative === 'string' && relative.length && !path.isAbsolute(relative), 'Expected a relative path');
  const resolved = path.resolve(root, relative);
  assert(resolved.startsWith(path.resolve(root) + path.sep), `Path escapes its root: ${relative}`);
  return resolved;
}

export function validateIdentity(candidate, installed, lock, docsPackage) {
  assert.equal(candidate.name, '@inkra/react');
  assert.equal(installed.name, candidate.name, 'Installed package name differs from the documented candidate');
  assert.equal(installed.version, candidate.version, 'Installed version differs from the documented candidate');
  assert([undefined, 'registry'].includes(candidate.source), 'Unknown package source');
  assert(/^[a-f0-9]{64}$/.test(candidate.sha256), 'Missing candidate digest');
  assert.equal(lock.packages['node_modules/@inkra/react'].integrity, candidate.integrity, 'Installed lock integrity differs');
  const dependency = candidate.source === 'registry' ? candidate.version : 'file:vendor/inkra.tgz';
  assert.equal(docsPackage.dependencies['@inkra/react'], dependency, 'Documentation dependency differs');
  assert.equal(lock.packages[''].dependencies['@inkra/react'], dependency, 'Locked dependency differs');
  return { name: candidate.name, version: candidate.version, source: candidate.source ?? 'candidate', revision: candidate.revision ?? null };
}

async function filesBelow(root, suffix) {
  const result = [];
  const visit = async relative => {
    for (const entry of await readdir(relative ? inside(root, relative) : root, { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      assert(!entry.isSymbolicLink(), `Symlink is not a portable documentation input: ${name}`);
      if (entry.isDirectory()) await visit(name);
      else if (entry.isFile() && name.endsWith(suffix)) result.push(name);
    }
  };
  await visit('');
  return result.sort();
}

function buildRevision(root) {
  // A local working tree is not a deployed revision; website version.json remains authoritative.
  if (process.env.GITHUB_ACTIONS !== 'true') return null;
  try {
    if (execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim()) return null;
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    return /^[a-f0-9]{40}$/.test(sha) ? sha : null;
  } catch { return null; }
}

function exportedDeclarations(entry) {
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext, skipLibCheck: true,
    noEmit: true, types: [],
  });
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(entry);
  assert(file, 'Installed package types entry could not be read');
  const symbol = checker.getSymbolAtLocation(file);
  assert(symbol, 'Installed package types entry must be a module');
  const symbols = new Map();
  for (const item of checker.getExportsOfModule(symbol)) {
    const resolved = item.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(item) : item;
    // Restrict component discovery to actual values, not similarly named public type aliases.
    if (!(resolved.flags & ts.SymbolFlags.Value)) continue;
    const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
    if (declaration) symbols.set(item.name, path.resolve(declaration.getSourceFile().fileName));
  }
  return symbols;
}

function declaredReferences(text, relative, typeFiles) {
  const result = new Set();
  const syntax = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (ts.isStringLiteral(node) && node.text.startsWith('.') &&
      (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent) || ts.isLiteralTypeNode(node.parent) && ts.isImportTypeNode(node.parent.parent))) {
      const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(relative), node.text.replace(/\.js$/, '.d.ts')));
      assert(!candidate.startsWith('../') && !path.posix.isAbsolute(candidate), `Declaration import escapes package: ${relative}`);
      const resolved = typeFiles.has(candidate) ? candidate : typeFiles.has(`${candidate}/index.d.ts`) ? `${candidate}/index.d.ts` : null;
      assert(resolved, `Unresolved local declaration reference in ${relative}: ${node.text}`);
      result.add(resolved);
    }
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  return [...result].sort();
}

/** Static examples are excerpts, never evaluated playground expressions or live form values. */
async function staticExamples(root) {
  const results = new Map();
  const introductions = new Map();
  for (const relative of await filesBelow(root, '.tsx')) {
    const source = await readFile(inside(root, relative), 'utf8');
    const syntax = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const add = node => {
      if (!(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) return;
      const code = node.text.trim();
      if (!code || code.length > 18000 || !/<[A-Z]/.test(code) || /\b(?:DocsIcon|DocsSelect|PropertyTabs|ComponentPlayground|ComponentExample)\b/.test(code)) return;
      // A static excerpt referencing a documentation-only relative import is not consumer code.
      if (/from\s*['"]\./.test(code)) return;
      const exampleSyntax = ts.createSourceFile('example.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      if (exampleSyntax.parseDiagnostics.length) return;
      const tags = new Set();
      const find = n => {
        if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
          const name = n.tagName.getText(exampleSyntax).split('.')[0];
          if (/^[A-Z]/.test(name)) tags.add(name);
        }
        ts.forEachChild(n, find);
      };
      find(exampleSyntax);
      if (!tags.size) return;
      const hash = createHash('sha256').update(code).digest('hex');
      if (!results.has(hash)) results.set(hash, { code, tags, source: `src/components/${relative}` });
    };
    const property = (object, name) => object.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(syntax).replaceAll(/['"]/g, '') === name)?.initializer;
    const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
    const visit = node => {
      if (relative.startsWith('expansion/') && ts.isObjectLiteralExpression(node)) {
        const name = literal(property(node, 'name'));
        const intro = property(node, 'intro');
        if (name && intro && ts.isObjectLiteralExpression(intro)) {
          const zh = literal(property(intro, 'zh')), en = literal(property(intro, 'en'));
          if (zh && en) introductions.set(name, { zh, en });
        }
      }
      const parent = node.parent;
      if (!parent) { ts.forEachChild(node, visit); return; }
      const namedCode = (ts.isPropertyAssignment(parent) || ts.isVariableDeclaration(parent)) && parent.name?.getText(syntax) === 'code' && parent.initializer === node;
      const jsxCode = ts.isJsxAttribute(parent) && parent.name.getText(syntax) === 'code' && parent.initializer === node;
      const expressionCode = ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent) && parent.parent.name.getText(syntax) === 'code';
      if (namedCode || jsxCode || expressionCode) add(node);
      ts.forEachChild(node, visit);
    };
    visit(syntax);
  }
  return { examples: [...results.values()], introductions };
}

const specialExports = { icon: ['PencilIcon'], button: ['Button', 'ButtonLink', 'ButtonGroup'] };
const markdownEscape = text => text.replaceAll('`', '\\`');

export async function generateAgentDocs({ root = defaultRoot, outputDir = path.join(root, 'dist') } = {}) {
  root = path.resolve(root); outputDir = path.resolve(outputDir);
  assert.notEqual(root, outputDir, 'Generated files need a separate output directory');
  const packageRoot = path.join(root, 'node_modules/@inkra/react');
  assert(!(await lstat(packageRoot)).isSymbolicLink(), 'Use the installed archive, not a source alias');
  const candidate = await asJson(path.join(root, 'library-candidate.json'));
  const installed = await asJson(path.join(packageRoot, 'package.json'));
  const snapshot = validateIdentity(candidate, installed, await asJson(path.join(root, 'package-lock.json')), await asJson(path.join(root, 'package.json')));
  const typesEntry = installed.exports?.['.']?.types;
  assert(typeof typesEntry === 'string', 'The package must expose a typed root entry');
  const entry = inside(packageRoot, typesEntry);
  const distRoot = path.join(packageRoot, 'dist');
  assert(entry.startsWith(distRoot + path.sep), 'Public declarations must be in package dist');
  const declarations = exportedDeclarations(entry);
  const typePaths = await filesBelow(distRoot, '.d.ts');
  const typeSet = new Set(typePaths);
  const typeContents = new Map(await Promise.all(typePaths.map(async file => [file, await readFile(inside(distRoot, file), 'utf8')])));
  const references = new Map(typePaths.map(file => [file, declaredReferences(typeContents.get(file), file, typeSet)]));
  const { examples, introductions } = await staticExamples(path.join(root, 'src/components'));
  const components = [];
  const documents = new Map();
  const slugs = new Set();
  for (const category of componentNavigationGroups) for (const slug of category.components) {
    assert(/^[a-z][a-z0-9-]*$/.test(slug) && !slugs.has(slug), `Invalid or duplicate component route: ${slug}`);
    slugs.add(slug);
    const name = slug === 'button' ? 'Button' : foundationNames[slug];
    assert(name, `Missing canonical component name: ${slug}`);
    const exports = specialExports[slug] ?? [name];
    const declarationFiles = [...new Set(exports.map(exported => {
      const declaration = declarations.get(exported);
      assert(declaration, `Documented component ${slug} has no public value export ${exported}`);
      assert(declaration.startsWith(distRoot + path.sep), `Public value resolves outside package declarations: ${exported}`);
      return path.relative(distRoot, declaration).split(path.sep).join('/');
    }))];
    const summary = introductions.get(name) ?? componentIntroductions[name];
    assert(summary?.zh && summary.en, `Missing component introduction: ${name}`);
    const matches = examples.filter(item => exports.some(exported => item.tags.has(exported))).slice(0, 3);
    const record = {
      name, slug, category: category.label, summary,
      importPath: '@inkra/react', exports,
      docsUrl: `/docs/components/${slug}`, apiUrl: `/docs/components/${slug}#api`,
      markdownUrl: `/ai/components/${slug}.md`, typesUrl: `/ai/types/${declarationFiles[0]}`,
      exampleCount: matches.length,
    };
    components.push(record);
    const sections = [`# ${name}`, summary.en, summary.zh,
      `Package snapshot: \`${snapshot.name}@${snapshot.version}\` (${snapshot.source}). This is the package used by this documentation build, not a claim about the registry latest version. Check the consuming project's installed version before applying this API.`,
      `[Live examples](${record.docsUrl}#preview) · [API view](${record.apiUrl}) · [Installed declarations](${record.typesUrl})`,
      '## Import', '```tsx\nimport \'@inkra/react/styles.css\';\nimport { ' + exports.join(', ') + ' } from \'@inkra/react\';\n```',
      '## Public API declarations',
      'The declarations below are copied verbatim from the installed package. Files can include related components and shared props. Copied declaration files are reference material; only package exports define supported consumer import paths. Relative declaration imports ending in `.js` resolve to the matching `.d.ts` file linked below; external dependencies such as React should be checked in the consuming project.',
    ];
    for (const file of declarationFiles) {
      sections.push(`### ${markdownEscape(file)}`, `[Declaration file](/ai/types/${file})`, '```ts\n' + typeContents.get(file).trimEnd() + '\n```');
      const linked = references.get(file);
      if (linked.length) sections.push('Local declaration dependencies:\n' + linked.map(ref => `- [${ref}](/ai/types/${ref})`).join('\n'));
    }
    sections.push('## Source examples');
    if (matches.length) {
      sections.push('These are statically extracted documentation excerpts, not evaluated playground state. Some excerpts need the surrounding application state or optional dependencies shown in the live examples.');
      for (const example of matches) sections.push(`Source: \`${example.source}\``, '```tsx\n' + example.code + '\n```');
    } else sections.push('No statically self-contained source excerpt was selected. Use the declarations above and the live examples; dynamic playground expressions are intentionally not guessed.');
    documents.set(`${slug}.md`, sections.join('\n\n') + '\n');
  }
  const catalog = {
    schemaVersion: 1,
    package: snapshot,
    docsRevision: buildRevision(root),
    versionUrl: '/version.json',
    scope: 'Components and declarations in this documentation build. The registry latest release and the consumer installed version may differ.',
    components,
  };
  const aiRoot = inside(outputDir, 'ai');
  await rm(aiRoot, { recursive: true, force: true });
  await mkdir(inside(aiRoot, 'components'), { recursive: true });
  await mkdir(inside(aiRoot, 'types'), { recursive: true });
  for (const [file, content] of typeContents) {
    const target = inside(aiRoot, `types/${file}`);
    await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content);
  }
  for (const [file, content] of documents) await writeFile(inside(aiRoot, `components/${file}`), content);
  await writeFile(inside(aiRoot, 'components.json'), JSON.stringify(catalog, null, 2) + '\n');
  const llms = [
    '# Inkra',
    '> A React component library with pencil lettering, paper texture and native interaction semantics.',
    `This documentation build uses ${snapshot.name}@${snapshot.version}. Read the consumer installed version first; documentation, registry latest and installed package are separate facts.`,
    '## Entry points',
    '- [AI setup guide](/start.md): Adapt adoption to the current runtime and repository; reuse existing setup and load only what the task needs.',
    '- [Getting started](/docs/getting-started): Human-facing quick start.',
    '- [Develop with AI](/docs/ai-guide): Natural-language workflow, independent skills and installation options.',
    '- [Manual setup](/docs/installation): Package installation, stylesheet and first component.',
    '- [Component catalog](/ai/components.json): Names, categories, descriptions, exports, package snapshot and component-specific readable documents.',
    '- [Deployed identity](/version.json): Website, documentation and consumed library revisions. A local docs-only preview may not provide this website-generated file.',
    '- [Skill directory](/skills/registry.json): Independent Inkra, documentation and design skills.',
    '- [Design standard](/docs/design-standard): Material and interaction language.',
    '- [Theming](/docs/theming): Existing application theme and token scopes.',
    '- [Package registry](https://www.npmjs.com/package/@inkra/react): Released npm package.',
    '- [Source repository](https://github.com/inkrajs/inkra): Source and release history.',
    '## Setup for this snapshot',
    snapshot.source === 'registry'
      ? 'For a new project choosing this exact documented release:\n\n```sh\nnpm install ' + snapshot.name + '@' + snapshot.version + '\n```'
      : 'This build uses a prepared candidate archive. Use the project-approved archive; the same numeric npm version may not contain its API.',
    'Import `@inkra/react/styles.css` once at the application entry; it includes default fonts and tokens. Preserve an existing project version and styling setup unless changing them is part of the requested work.',
    '- [All root exports](/ai/types/index.d.ts): The actual installed package export surface.\n- [ThemeProvider declarations](/ai/types/theme/index.d.ts): Local theme scope, token overrides and supported modes.',
    '## Components',
    ...components.map(component => `- [${component.name}](${component.markdownUrl}): ${component.summary.en}`),
    '## Reading guidance',
    'Resolve relative URLs against the origin where this index was fetched, including local preview origins. Fetch only the selected component documents and follow declaration links as needed. The component documents contain actual package declarations; they do not require browser JavaScript. Copied internal declaration files only resolve type dependencies and do not create new supported package import paths. Cache this catalog with its package version and deployed identity, and refresh when the identity changes. Do not automatically upgrade a project solely to match this site.',
  ].join('\n\n') + '\n';
  await writeFile(inside(outputDir, 'llms.txt'), llms);
  return { catalog, declarationCount: typePaths.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { catalog, declarationCount } = await generateAgentDocs();
  console.log(`Prepared ${catalog.components.length} component documents and ${declarationCount} declaration files for agents.`);
}
