import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const docs = readFileSync(new URL('../../src/components/expansion/DataExamples.tsx', import.meta.url), 'utf8');
const browser = readFileSync(new URL('../verify-expansion-data.mjs', import.meta.url), 'utf8');

test('Data documentation exports the route contract and honest interaction scope', () => {
  assert.match(docs, /export const dataDocs: Record<string, ExpansionDoc>/);
  assert.match(docs, /'data-table':/);
  assert.match(docs, /tree:/);
  assert.match(docs, /useLocale\(\)/);
  assert.match(docs, /locale === 'zh-CN'/);
  assert.match(docs, /ComponentExample/);
  assert.match(docs, /ComponentPlayground/);
  assert.match(docs, /PropertyTabs/);
  assert.match(docs, /onPaginationChange=\{updater =>/);
  assert.match(docs, /density="\$\{density\}"/);
  assert.match(docs, /getRowCanSelect=\{\(\) => \$\{!disableRows\}\}/);
  assert.match(docs, /onExpandedChange=\{setExpandedKeys\}/);
  assert.match(docs, /onSelectionChange=\{setSelectedKeys\}/);
  assert.doesNotMatch(docs, /<Tree\.Item[^>]*>\.\.\.<\/Tree\.Item>|<Tree\.Root[^>]*>\.\.\.<\/Tree\.Root>/);
  assert.match(docs, /表格一加筛选和排序，班味就上来了。/);
  assert.match(docs, /文件夹套文件夹，禁止套娃？这里不禁止。/);
  assert.match(docs, /Virtualization, inline editing and server transport are not included/);
  assert.match(docs, /Drag and drop is not included/);
  assert.match(browser, /process\.env\.BASE_URL/);
});
