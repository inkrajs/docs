import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/components/FoundationPages.tsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('FoundationPages.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const rows = new Map();
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'apiRows') {
    assert(ts.isObjectLiteralExpression(node.initializer));
    for (const entry of node.initializer.properties) {
      if (!ts.isPropertyAssignment(entry) || !ts.isArrayLiteralExpression(entry.initializer)) continue;
      const name = entry.name.text;
      rows.set(name, entry.initializer.elements.map(row => row.elements[0].text));
    }
  }
  ts.forEachChild(node, visit);
}
visit(file);

test('AudioPlayer documents actual media controls and controlled settings', () => {
  const audio = rows.get('audio-player');
  for (const prop of ['onStateChange', 'onTimeChange', 'audioProps', 'labels', 'renderControls', 'volume / defaultVolume']) assert(audio.includes(prop));
  for (const prop of ['playing / defaultPlaying', 'onPlayingChange', 'currentTime / defaultCurrentTime']) assert(!audio.includes(prop));
});

test('Carousel and ImageViewer document their actual selection identities', () => {
  assert(rows.get('carousel').includes('currentIndex / defaultIndex / onCurrentIndexChange'));
  assert(rows.get('image-viewer').includes('Root.activeId / defaultActiveId'));
  assert(rows.get('image-viewer').includes('Content.minScale / maxScale / wheel'));
  assert(!rows.get('carousel').includes('index / onIndexChange'));
  assert(!rows.get('image-viewer').includes('index / defaultIndex / onIndexChange'));
});

test('ChoiceGrid documents actual single and multiple contracts, not speculative APIs', () => {
  assert.deepEqual(rows.get('choice-grid'), [
    'type', 'value / defaultValue / onValueChange', 'values / defaultValues / onValuesChange',
    'name / form', 'label / description / error', 'columns / minItemWidth', 'disabled',
    'ChoiceGridOption.value / label / description', 'ChoiceGridOption.icon / image',
    'ChoiceGridOption.disabled / required / form', 'ChoiceGridOption.onChange',
    'ref / ChoiceGridOption.ref',
  ]);
});

test('Native selection APIs expose input events, external forms and usable refs', () => {
  for (const name of ['checkbox', 'switch']) {
    for (const prop of ['onChange', 'name / value / form', 'disabled / required', 'ref']) {
      assert(rows.get(name).includes(prop), `${name} documents ${prop}`);
    }
  }
  assert(rows.get('radio-group').includes('name / form'));
  assert(rows.get('radio-group').includes('ref / RadioGroupItem.ref'));
});

test('ColorPicker documents its hex contract, not unsupported format or readonly controls', () => {
  assert.deepEqual(rows.get('color-picker'), [
    'value / defaultValue', 'onValueChange', 'onInvalidInput', 'presets', 'showAlpha',
    'label / labels', 'name / form', 'disabled', 'seed',
  ]);
});

test('Transfer documents target keys and actual filtering and localization hooks', () => {
  assert.deepEqual(rows.get('transfer'), [
    'items', 'targetKeys / defaultTargetKeys', 'onTargetKeysChange', 'searchable',
    'filterItem', 'renderItem', 'formatCount', 'labels', 'disabled', 'dir', 'ref',
  ]);
});

test('RangeSlider documents numeric distance and crossing rather than hidden primitive props', () => {
  assert.deepEqual(rows.get('range-slider'), [
    'value / defaultValue', 'onValueChange / onValueCommit', 'min / max / step',
    'minDistance', 'allowCross', 'thumbLabels', 'getValueLabel',
    'orientation / dir / inverted', 'variant', 'size / disabled', 'name / form / ref',
  ]);
  assert(rows.get('slider').includes('preserveThumbOrder'));
  assert(rows.get('slider').includes('minStepsBetweenThumbs'));
});
