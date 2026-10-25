import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { docsMessages, lookupDocsMessage } from '../../src/docsLocales.ts';

const components = new URL('../../src/components/', import.meta.url);
const source = readFileSync(new URL('../../src/i18n.tsx', import.meta.url), 'utf8');
const parse = (name, text) => ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const walk = (node, callback) => { callback(node); ts.forEachChild(node, child => walk(child, callback)); };
const i18n = parse('i18n.tsx', source);
let dictionary;
let translator;
let optionDictionary;
let optionTranslator;
walk(i18n, node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(i18n) === 'english') dictionary = node.initializer;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'translateMessage') translator = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(i18n) === 'optionLabelMessages') optionDictionary = node.initializer;
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'translateOptionLabel') optionTranslator = node;
});
assert(dictionary && translator);
const dictionaryKeys = dictionary.properties.map(property => property.name.text);
const english = runInNewContext(`(${dictionary.getText(i18n)})`);
const executable = ts.transpileModule(translator.getText(i18n).replace(/^export /, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const translate = runInNewContext(`${executable}; translateMessage`, { english, lookupDocsMessage });
assert(optionDictionary && optionTranslator);
const optionMessages = runInNewContext(`(${optionDictionary.getText(i18n)})`);
const optionExecutable = ts.transpileModule(optionTranslator.getText(i18n).replace(/^export /, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const translateOption = runInNewContext(`${optionExecutable}; translateOptionLabel`, { optionLabelMessages: optionMessages, translateMessage: translate });
const exampleFiles = readdirSync(components, { recursive: true }).filter(name => name.endsWith('Examples.tsx'));

test('example messages have one explicit translation per key in both locales', () => {
  assert.equal(dictionaryKeys.length, new Set(dictionaryKeys).size, 'Duplicate message keys');
  for (const key of ['可选成员', '已选成员', '非受控初始选择', '运行记录', '等待移动', '移动面板', '按键排列', '需求草图', '随手笔记', '展开属性配置', '收起属性配置']) {
    assert.equal(translate('zh-CN', key), key);
    assert.equal(translate('en', key), english[key]);
    assert.notEqual(translate('en', key), key, `Missing translation: ${key}`);
  }
  assert.equal(translate('en', 'API / JSX'), 'API / JSX', 'Do not split real slashes at runtime');
  assert.equal(translate('en', 'toString'), 'toString', 'Inherited object properties are not messages');
  assert.equal(translate('en', '状态'), 'States', 'Property tabs retain the established English label');
});

test('all literal t() messages in component examples are registered', () => {
  const missing = [];
  for (const file of exampleFiles) {
    const ast = parse(file, readFileSync(new URL(file, components), 'utf8'));
    walk(ast, node => {
      if (!ts.isCallExpression(node) || node.expression.getText(ast) !== 't') return;
      const message = node.arguments[0];
      if (message && ts.isStringLiteral(message) && /\p{Script=Han}/u.test(message.text) && !Object.hasOwn(english, message.text) && !Object.hasOwn(docsMessages, message.text) && !ts.isStringLiteral(node.arguments[1] ?? node)) missing.push(`${file}: ${message.text}`);
    });
  }
  assert.deepEqual(missing, []);
});

test('component examples never concatenate Chinese and English translations', () => {
  const allowed = new Set([
    'Ctrl / Command + 滚轮',
    '鼠标右键，或聚焦后按 ContextMenu / Shift+F10。',
  ]);
  const mixed = [];
  for (const file of exampleFiles) {
    const ast = parse(file, readFileSync(new URL(file, components), 'utf8'));
    walk(ast, node => {
      if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node) && !ts.isJsxText(node)) return;
      const value = node.text.trim();
      if (allowed.has(value)) return;
      const parts = value.split(' / ');
      if (parts.length !== 2) return;
      const han = parts.map(part => /\p{Script=Han}/u.test(part));
      if (han[0] !== han[1] && parts.every(part => /[\p{L}]/u.test(part))) mixed.push(`${file}: ${value}`);
    });
  }
  assert.deepEqual(mixed, []);
});

test('property tab identities do not depend on translated labels', () => {
  const tabs = readFileSync(new URL('PropertyTabs.tsx', components), 'utf8');
  assert.match(tabs, /defaultValue="group-0"/);
  assert.equal((tabs.match(/value=\{`group-\$\{index\}`\}/g) ?? []).length, 2);
  assert.doesNotMatch(tabs, /(?:key|value)=\{group\.label\}/);
});

test('generic option labels localize without changing identifiers or proper names', () => {
  for (const [label, chinese] of Object.entries(optionMessages)) {
    assert.equal(translateOption('zh-CN', label), chinese);
    assert.equal(translateOption('en', label), label, 'Existing English label is preserved');
  }
  assert.equal(translateOption('zh-CN', 'Center'), '居中');
  assert.equal(translateOption('zh-CN', 'LTR'), '从左到右');
  for (const unchanged of ['English', 'macOS', 'Windows', 'H2', 'KiB', '1e+68', '1280 px', 'center-custom', 'Ada Lovelace']) {
    assert.equal(translateOption('zh-CN', unchanged), unchanged);
  }
  const select = readFileSync(new URL('DocsSelect.tsx', components), 'utf8');
  assert.match(select, /translateOptionLabel\(locale, text\)/);
  assert.match(select, /value=\{key\} textValue=\{optionLabel\}/);
  assert.match(select, /onValueChange=\{onValueChange\}/);
});

test('literal and enum-derived generic DocsSelect labels have explicit localization', () => {
  const preservedNames = new Set(['English', 'macOS', 'Windows']);
  const missing = [];
  for (const file of readdirSync(components, { recursive: true }).filter(name => name.endsWith('.tsx'))) {
    const ast = parse(file, readFileSync(new URL(file, components), 'utf8'));
    const check = label => {
      if (/^[A-Za-z][A-Za-z -]*$/.test(label) && !preservedNames.has(label) && !Object.hasOwn(optionMessages, label)) missing.push(`${file}: ${label}`);
    };
    walk(ast, node => {
      if ((!ts.isJsxSelfClosingElement(node) && !ts.isJsxOpeningElement(node)) || node.tagName.getText(ast) !== 'DocsSelect') return;
      const options = node.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.getText(ast) === 'options');
      if (!options?.initializer || !ts.isJsxExpression(options.initializer)) return;
      walk(options.initializer, expression => {
        if (ts.isArrayLiteralExpression(expression) && expression.elements.length === 2 && expression.elements.every(ts.isStringLiteral)) check(expression.elements[1].text);
        if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === 'map' && ts.isArrayLiteralExpression(expression.expression.expression)) {
          const values = expression.expression.expression.elements;
          if (values.every(ts.isStringLiteral)) values.forEach(value => check(value.text));
        }
      });
    });
  }
  assert.deepEqual(missing, []);
});
