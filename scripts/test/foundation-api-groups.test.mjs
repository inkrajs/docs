import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import * as Inkra from '@inkra/react';

const root = new URL('../../', import.meta.url);
function moduleUrl(path, imports = {}) {
  let code = ts.transpileModule(readFileSync(new URL(path, root), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(imports)) code = code.replaceAll(specifier, replacement);
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { getFoundationApiGroups, foundationApiDefinitions } = await import(moduleUrl('src/components/foundationApiGroups.ts', {
  './apiDescriptions.ts': moduleUrl('src/components/apiDescriptions.ts'),
}));
const { buttonApiGroups } = await import(moduleUrl('src/components/buttonApiGroups.ts'));
const source = readFileSync(new URL('src/components/FoundationPages.tsx', root), 'utf8');
const file = ts.createSourceFile('FoundationPages.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let initializer;
function findRows(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'apiRows') initializer = node.initializer;
  else ts.forEachChild(node, findRows);
}
findRows(file);
assert(initializer && ts.isObjectLiteralExpression(initializer));
const sourceRows = Object.fromEntries(initializer.properties.map(property => [
  property.name.text, property.initializer.elements.map(row => row.elements.map(cell => cell.text)),
]));
const groupsFor = name => getFoundationApiGroups(name, sourceRows[name] ?? []);
const groupFor = (name, title) => groupsFor(name).find(group => group.title === title);
const property = (name, title, prop) => groupFor(name, title).rows.find(row => row[0] === prop);

test('compound API sections match every installed public child component', () => {
  for (const [component, definition] of Object.entries(foundationApiDefinitions)) {
    if (definition.standalone) {
      for (const part of definition.parts) assert(Inkra[part.name], `${part.name} is publicly exported`);
      continue;
    }
    const extras = component === 'image-viewer' ? ['ImageViewerItem', 'MediaViewer'] : component === 'resizable' ? ['Hooks'] : [];
    const documented = definition.parts.map(part => part.name).filter(name => !extras.includes(name)).sort();
    assert.deepEqual(documented, Object.keys(Inkra[definition.name]).sort(), component);
  }
});

test('groups have stable IDs, nonempty rows and bilingual descriptions', () => {
  for (const component of Object.keys(foundationApiDefinitions)) {
    const groups = groupsFor(component);
    assert.equal(new Set(groups.map(group => group.id)).size, groups.length, component);
    for (const group of groups) {
      assert.match(group.id, /^[a-z][a-z0-9-]+$/);
      assert(group.rows.length > 0, `${component}.${group.title} is empty`);
      assert.equal(new Set(group.rows.map(row => row[0])).size, group.rows.length, `${component}.${group.title} repeats rows`);
      for (const row of group.rows) {
        assert(row[0] && row[1], `${component}.${group.title} lacks property/type`);
        assert(row[2]?.length > 4 && row[3]?.length > 4, `${component}.${group.title}.${row[0]} lacks descriptions`);
        assert.doesNotMatch(row[0], /^(Root|Trigger|Content|Header|Footer|Panel|Handle)\./, `${component}.${group.title} retains an owner prefix`);
      }
    }
  }
});

test('every retained source row has an explicit child owner or replacement', () => {
  for (const [component, definition] of Object.entries(foundationApiDefinitions)) {
    if (definition.replace) continue;
    for (const [key] of sourceRows[component]) {
      assert(Object.hasOwn(definition.assignments ?? {}, key) || definition.unprefixed || definition.parts.some(part => key.startsWith(`${part.name}.`)), `${component}.${key} was silently lost`);
    }
  }
});

test('shared rows are split across their actual owners without leaking other child APIs', () => {
  for (const part of ['Header', 'Content', 'Footer']) {
    assert(property('card', `Card.${part}`, 'padding'));
    assert(property('card', `Card.${part}`, 'children'));
  }
  for (const part of ['Header', 'Footer']) {
    assert(property('card', `Card.${part}`, 'divided'));
    assert(property('overlay', `Overlay.${part}`, 'divided'));
  }
  for (const part of ['Head', 'Cell']) for (const prop of ['align', 'verticalAlign', 'wrap', 'colSpan / rowSpan']) {
    assert(property('table', `Table.${part}`, prop));
  }
  assert(!property('table', 'Table.Cell', 'scope'));
  assert(property('table', 'Table.Head', 'scope'));
  assert(property('accordion', 'Accordion.Root', 'disabled'));
  assert(property('accordion', 'Accordion.Item', 'disabled'));
  assert.equal(property('select', 'Select.Viewport', 'nonce')[1], 'string; single mode only');
  assert.equal(property('radio-group', 'RadioGroupItem', 'ref')[1], 'HTMLInputElement');
  assert.equal(property('choice-grid', 'ChoiceGrid', 'ref')[1], 'HTMLFieldSetElement');
});

test('HoverCard, ImageViewer, Flip and Resizable document real rather than inferred APIs', () => {
  assert(!property('hover-card', 'HoverCard.Root', 'interactive'));
  assert(!property('hover-card', 'HoverCard.Root', 'modal'));
  assert(!groupFor('hover-card', 'HoverCard.Portal'));
  assert(property('hover-card', 'HoverCard.Content', 'focusOnOpen'));
  assert(!property('image-viewer', 'ImageViewer.Trigger', 'itemId'));
  assert(property('image-viewer', 'ImageViewer.Trigger', 'asChild / children'));
  assert(!property('flip', 'Flip', 'axis'));
  assert(!property('flip', 'Flip', 'disabled'));
  assert(property('flip', 'Flip', 'flipEnabled'));
  assert.equal(property('resizable', 'Resizable.Root', 'layout / defaultLayout')[1], 'ResizableLayout');
  assert.match(property('resizable', 'Resizable.Panel', 'defaultSize / minSize / maxSize')[3], /Numbers are pixels/);
  assert(property('resizable', 'Resizable.Panel', 'panelRef / elementRef'));
  assert(property('resizable', 'Resizable.Handle', 'lineSeed'));
  assert.equal(Inkra.MediaViewer, Inkra.ImageViewer);
});

test('standalone pages remain flat and Button, ButtonLink and ButtonGroup have distinct tables', () => {
  for (const component of ['input', 'textarea', 'checkbox', 'slider', 'scroll-area', 'pan-zoom', 'markdown', 'sortable']) {
    assert.equal(groupsFor(component), undefined, component);
  }
  assert.deepEqual(buttonApiGroups.map(group => group.title), ['Button', 'ButtonLink', 'ButtonGroup']);
  assert(buttonApiGroups[0].rows.some(row => row[0] === 'type / name / value / form'));
  assert(buttonApiGroups[1].rows.some(row => row[0] === 'href / target / rel / download'));
  assert(!buttonApiGroups[1].rows.some(row => row[0] === 'type / name / value / form'));
  assert.match(source, /groups \? <ApiGroups/);
  const app = readFileSync(new URL('src/App.tsx', root), 'utf8');
  assert.match(app, /<ApiGroups component="button" groups=\{buttonApiGroups\}/);
});
