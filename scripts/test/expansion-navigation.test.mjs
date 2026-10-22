import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Navigation docs expose the shared contract and installed-package browser evidence script', () => {
  const docs = source('../../src/components/expansion/NavigationExamples.tsx');
  assert.match(docs, /export const navigationDocs: Record<string, ExpansionDoc>/);
  assert.match(docs, /locale === 'zh-CN'/);
  assert.match(docs, /from '@inkra\/react'/);
  assert.match(docs, /ComponentExample/);
  assert.match(docs, /ComponentPlayground/);
  assert.match(docs, /PropertyTabs/);
  assert.match(docs, /<Overlay\.Portal/);
  assert.match(docs, /not link navigation/);
  assert.match(docs, /Shortcut hints do not register global keys/);
  const browser = source('../verify-expansion-navigation.mjs');
  assert.match(browser, /process\.env\.BASE_URL/);
  assert.match(browser, /compositionstart/);
  assert.match(browser, /forcedColors/);
});
