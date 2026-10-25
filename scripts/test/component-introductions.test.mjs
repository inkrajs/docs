import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { componentIntroductions } from '../../src/components/componentIntroductions.ts';
import { componentIntroductionMessages } from '../../src/componentIntroductionLocales.ts';
import { lookupDocsMessage } from '../../src/docsLocales.ts';

const root = new URL('../../src/', import.meta.url);
const parse = file => ts.createSourceFile(file, readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const walk = (node, visit) => { visit(node); ts.forEachChild(node, child => walk(child, visit)); };
const introductions = Object.entries(componentIntroductions).map(([name, intro]) => ({ name, ...intro }));
const expansion = new URL('components/expansion/', root);
for (const file of readdirSync(expansion).filter(file => file.endsWith('.tsx'))) {
  walk(parse(`components/expansion/${file}`), node => {
    if (!ts.isPropertyAssignment(node) || node.name.getText() !== 'intro' || !ts.isObjectLiteralExpression(node.initializer)) return;
    const copy = Object.fromEntries(node.initializer.properties.filter(ts.isPropertyAssignment).map(property => {
      assert(ts.isStringLiteral(property.initializer), `${file}: introduction must keep its literal source key`);
      return [property.name.getText(), property.initializer.text];
    }));
    introductions.push({ name: file, ...copy });
  });
}

test('all component page introductions have complete five-language coverage', () => {
  assert(introductions.length > Object.keys(componentIntroductions).length, 'Expansion pages must be checked too');
  assert.equal(new Set(introductions.map(intro => intro.zh)).size, introductions.length, 'Source introductions should not collide');
  assert.deepEqual(Object.keys(componentIntroductionMessages).sort(), introductions.map(intro => intro.zh).sort(), 'Every source needs translations; remove stale keys too');
  for (const { name, zh, en } of introductions) {
    const messages = componentIntroductionMessages[zh];
    assert.equal(messages.length, 4, name);
    assert.equal(messages[0], en, `${name}: preserve the established English introduction`);
    for (const [index, locale] of ['en', 'ja', 'ko', 'fr'].entries()) {
      assert(messages[index].trim(), `${name}: empty ${locale}`);
      assert.notEqual(messages[index], zh, `${name}: ${locale} must not fall back to Chinese`);
      if (index > 0) assert.notEqual(messages[index], en, `${name}: ${locale} must not fall back to English`);
      assert.equal(lookupDocsMessage(locale, zh), messages[index], `${name}: ${locale} must be reachable through the site dictionary`);
    }
  }
});

test('component introductions preserve source keys through translation and page headings', () => {
  const i18n = parse('i18n.tsx');
  let translator;
  let english;
  walk(i18n, node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'translateMessage') translator = node;
    if (ts.isVariableDeclaration(node) && node.name.getText() === 'english') english = runInNewContext(`(${node.initializer.getText(i18n)})`);
  });
  assert(translator && english);
  const executable = ts.transpileModule(translator.getText(i18n).replace(/^export /, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const translate = runInNewContext(`${executable}; translateMessage`, { english, lookupDocsMessage });
  for (const { zh, en } of introductions) {
    assert.equal(translate('zh-CN', zh, en), zh);
    for (const [index, locale] of ['en', 'ja', 'ko', 'fr'].entries()) {
      assert.equal(translate(locale, zh, en), componentIntroductionMessages[zh][index]);
    }
  }
  const heading = readFileSync(new URL('components/PageHeading.tsx', root), 'utf8');
  assert.match(heading, /description \?\? componentIntroductions\[title\]/);
  assert.match(heading, /t\(sourceIntro\.zh, sourceIntro\.en\)/);
  const page = readFileSync(new URL('components/expansion/ExpansionPage.tsx', root), 'utf8');
  assert.match(page, /description=\{doc\.intro\}/);
  assert.doesNotMatch(page, /description=\{doc\.intro\[/);
});

test('untranslated expansion reference prose falls back to English outside Chinese', () => {
  const page = parse('components/expansion/ExpansionPage.tsx');
  let language;
  walk(page, node => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === 'language') language = node.initializer.getText(page);
  });
  assert(language);
  for (const locale of ['zh-CN', 'en', 'ja', 'ko', 'fr']) {
    assert.equal(runInNewContext(language, { locale }), locale === 'zh-CN' ? 'zh' : 'en');
  }
  assert.match(page.text, /doc\.a11y\[language\]/);
  assert.match(page.text, /localizeApiRows\(doc\.api \?\? \[\], locale, component\)/);
});
