import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(`src/components/${name}`, root), 'utf8');

test('utility component documentation starts with playgrounds and stays general purpose', () => {
  const slot = read('SlotExamples.tsx');
  const log = read('LogExamples.tsx');
  const hotkey = read('HotkeyExamples.tsx');
  const ticker = read('NumberTickerExamples.tsx');

  for (const source of [slot, log, hotkey, ticker]) {
    assert(source.indexOf('<ComponentPlayground') >= 0);
    assert(source.indexOf('<ComponentPlayground') < source.indexOf('<ComponentExample'));
    assert.match(source, /<PropertyTabs/);
  }
  assert.match(slot, /快捷工具/);
  assert.match(slot, /资源槽位/);
  assert.match(log, /Run log/);
  assert.match(hotkey, /Editor shortcuts/);
  assert.match(ticker, /Points and resources/);
  assert.match(ticker, /Statistics and edge values/);
  assert.match(ticker, /Custom display/);
  assert.doesNotMatch(slot + ticker, /battle|combat|rarity|equipment/i);
  assert.doesNotMatch(slot, /sortable|drag(?:gable)?|drop/i);
});
