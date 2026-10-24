import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

test('Markdown is registered with an explicit navigation icon and data-display route', () => {
  const routes = read('componentRoutes.ts');
  const icons = read('components/iconCatalog.ts');
  assert.match(routes, /'slot', 'markdown', 'popover'/);
  assert.match(routes, /markdown: 'Markdown'/);
  assert.match(routes, /'数据展示', components: \['markdown', 'card'/);
  assert.match(icons, /name: 'markdown'/);
  assert.match(icons, /key: 'markdown', label: 'Markdown'/);
  assert.match(icons, /label: 'Markdown'.*data: markdownIcon/);
  assert.match(icons, /Markdown: 'Markdown'/);
});

test('Markdown documentation separates concise and advanced examples in both locales', () => {
  const source = read('components/MarkdownExamples.tsx');
  assert.match(source, /basic: `## 无障碍说明/);
  assert.match(source, /basic: `## Accessibility guidance/);
  assert.match(source, /typography: `### 行内排版/);
  assert.match(source, /typography: `### Inline typography/);
  assert.match(source, /\*\*粗体\*\*、\*斜体\*、\*\*\*粗斜体\*\*\*/);
  assert.match(source, /\*\*Bold\*\*, \*italic\*, \*\*\*bold italic\*\*\*/);
  assert.match(source, /~~删除线~~/);
  assert.match(source, /~~deleted text~~/);
  assert.match(source, /advanced: `## 发布检查/);
  assert.match(source, /advanced: `## Release checks/);
  assert.match(source, /media: `### 代码与图片/);
  assert.match(source, /media: `### Code and image/);
  assert.match(source, /const count: number = 2/);
  assert.match(source, /function CreateButton\(\)/);
  assert.match(source, /<ComponentExample title=\{t\('基础排版'\)\}/);
  assert.match(source, /<ComponentExample title=\{t\('行内排版'\)\}/);
  assert.match(source, /<ComponentExample title=\{t\('任务与表格'\)\}/);
  assert.match(source, /<ComponentExample title=\{t\('代码与媒体'\)\}/);
  assert.match(source, /code: 'Code example'/);
  assert.match(source, /code: '代码示例'/);
  assert.match(source, /taskChecked: 'Completed release check'/);
  assert.match(source, /taskUnchecked: '未完成发布检查'/);
  assert.equal(source.match(/labels=\{markdownLabels\}/g)?.length, 4);
  assert.match(source, /!\[Inkra 彩铅图标\]\(\/favicon\.png\)/);
});

test('Markdown API and accessibility copy are bilingual and security-specific', () => {
  const foundation = read('components/FoundationPages.tsx');
  const descriptions = read('components/apiDescriptions.ts');
  const examples = read('components/MarkdownExamples.tsx');
  for (const property of ['children', 'headingLevelOffset', 'labels', 'transformUrl', 'components', 'className / style / ref']) {
    assert.match(foundation, new RegExp(`\\['${property.replaceAll('/', '\\/')}'`));
    assert.ok(descriptions.includes(`'markdown:${property}'`), `${property} has a bilingual API description`);
  }
  assert.match(examples, /原始 HTML 默认忽略/);
  assert.match(examples, /Raw HTML is ignored by default/);
  assert.match(examples, /危险链接和图片协议会被拒绝/);
  assert.match(examples, /Dangerous link and image protocols are rejected/);
  assert.match(examples, /任务清单复用 Inkra \\`Checkbox\\`/);
  assert.match(examples, /Task lists reuse the disabled Inkra \\`Checkbox\\`/);
  assert.match(descriptions, /可聚焦的代码块、表格滚动区域及任务清单/);
  assert.match(descriptions, /focusable code blocks and table regions/);
  for (const label of ['plainText', 'copy', 'copied', 'copyFailed']) {
    assert(foundation.includes(label));
    assert.equal(examples.match(new RegExp(`${label}:`, 'g'))?.length, 2, `${label} is localized in both examples`);
  }
});

test('all component accessibility panels use the shared Markdown guidance renderer', () => {
  const app = read('App.tsx');
  const foundation = read('components/FoundationPages.tsx');
  const expansion = read('components/expansion/ExpansionPage.tsx');
  const guidance = read('components/GuidanceMarkdown.tsx');
  assert.match(app, /<GuidanceMarkdown source=\{buttonAccessibilityGuidance/);
  assert.match(foundation, /<GuidanceMarkdown source=\{component === 'markdown'/);
  assert.match(expansion, /<GuidanceMarkdown source=\{doc\.a11y\[language\]\}/);
  assert.match(guidance, /<Markdown/);
  assert.match(guidance, /code: 'Guidance code block'/);
  assert.match(guidance, /table: '说明表格'/);
  assert.match(guidance, /taskChecked: 'Completed guidance item'/);
  assert.match(guidance, /taskUnchecked: '未完成说明项'/);
  assert.match(guidance, /labels=\{markdownLabels\}/);
  assert.match(guidance, /aria-label/);
  assert.match(guidance, /\[Tooltip accessibility\]\(\/docs\/components\/tooltip#accessibility\)/);
});

test('new documentation TypeScript files are syntactically valid', () => {
  for (const file of [
    'App.tsx',
    'componentRoutes.ts',
    'components/FoundationPages.tsx',
    'components/GuidanceMarkdown.tsx',
    'components/MarkdownExamples.tsx',
    'components/apiDescriptions.ts',
    'components/expansion/ExpansionPage.tsx',
  ]) {
    const result = ts.transpileModule(read(file), {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    });
    assert.deepEqual(result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error), []);
  }
});
