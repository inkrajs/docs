import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

test('documentation imports never depend on files outside its checkout', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const sourceRoot = resolve(root, 'src');
  for (const file of await readdir(sourceRoot, { recursive: true })) {
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    const path = resolve(sourceRoot, file);
    const source = ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        ? node.moduleSpecifier
        : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0] : undefined;
      if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
        const target = resolve(dirname(path), specifier.text);
        assert(target.startsWith(root.endsWith(sep) ? root : root + sep), `${file}: external checkout import ${specifier.text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
