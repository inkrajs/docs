import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../../src/components/', import.meta.url);
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('Examples.tsx') ? [path] : [];
  });
}

test('primary previews omit demo-only outputs without hiding intrinsic component feedback', () => {
  const violations = [];
  let playgrounds = 0;
  for (const path of files(root.pathname)) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function inspect(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'ComponentPlayground') {
        playgrounds++;
        function preview(child) {
          if (ts.isJsxElement(child) && child.openingElement.tagName.getText(source) === 'output') {
            violations.push(`${path}:${source.getLineAndCharacterOfPosition(child.getStart()).line + 1}`);
          }
          ts.forEachChild(child, preview);
        }
        // Controls and code snippets intentionally may show diagnostic state.
        node.children.forEach(preview);
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  assert(playgrounds > 50, 'audit the catalog, not only one component');
  assert.deepEqual(violations, [], 'move diagnostic output to controls or dedicated examples');
});
