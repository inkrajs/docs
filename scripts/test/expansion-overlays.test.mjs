import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const docs = readFileSync(new URL('../../src/components/expansion/OverlaysExamples.tsx', import.meta.url), 'utf8');
const browser = readFileSync(new URL('../verify-expansion-overlays.mjs', import.meta.url), 'utf8');

test('Overlay expansion documentation is bilingual, interactive and public-package only', () => {
  assert.match(docs, /export const overlaysDocs: Record<string, ExpansionDoc>/);
  assert.match(docs, /'alert-dialog': \{/);
  assert.match(docs, /drawer: \{/);
  assert.match(docs, /locale === 'zh-CN'/);
  assert.match(docs, /<ComponentExample/);
  assert.match(docs, /<ComponentPlayground/);
  assert.match(docs, /<PropertyTabs/);
  assert.match(docs, /pending=\{pending\}/);
  assert.match(docs, /closeOnAction=\{false\}/);
  assert.match(docs, /direction=\{direction\}/);
  assert.match(docs, /iconPaths\(alertIcon\)/);
  assert.match(docs, /<DocsSelect label=\{zh \? '异步时长' : 'Async duration'\}/);
  assert.match(docs, /<DocsSelect label=\{zh \? '方向' : 'Direction'\}/);
  assert.match(docs, /<DocsSelect label=\{zh \? '尺寸' : 'Size'\}/);
  assert.doesNotMatch(docs, /<select\b/);
  assert.doesNotMatch(docs, /<AlertDialog\.Portal>\.\.\.<\/AlertDialog\.Portal>/);
  assert.doesNotMatch(docs, /<Drawer\.Portal>\.\.\.<\/Drawer\.Portal>/);
  assert.doesNotMatch(docs, /<Drawer\.(?:Body|Footer)[^>]*>\.\.\./);
  assert.doesNotMatch(docs, /\.node\.map\(/);
  assert.match(docs, /from '@inkra\/react'/);
  assert.doesNotMatch(docs, /from ['"]\.\.\/\.\.\/\.\.\/packages|from ['"]@\//);
});

test('Browser verification accepts BASE_URL and covers focus, pending and responsive drawer directions', () => {
  assert.match(browser, /process\.env\.BASE_URL/);
  assert.match(browser, /getByRole\('alertdialog'/);
  assert.match(browser, /import \{ chooseDocsOption \} from '.\/playground-test-helpers.mjs'/);
  assert.match(browser, /await chooseDocsOption\(scope, label, option/);
  assert.match(browser, /getByRole\('tab'/);
  assert.doesNotMatch(browser, /selectOption\(/);
  assert.match(browser, /document\.activeElement/);
  assert.match(browser, /pointer/);
  assert.match(browser, /Escape/);
  assert.match(browser, /\['top', 'right', 'bottom', 'left'\]/);
  assert.match(browser, /scrollHeight > node\.clientHeight/);
});
