import assert from 'node:assert/strict';
import test from 'node:test';
import { docsLanguages, docsMessages, lookupDocsMessage, resolveDocsLocale } from '../../src/docsLocales.ts';

test('site locale choices validate stored values and preserve native language names', () => {
  assert.deepEqual(docsLanguages.map(([locale]) => locale), ['zh-CN', 'en', 'ja', 'ko', 'fr']);
  for (const [locale] of docsLanguages) assert.equal(resolveDocsLocale(locale), locale);
  for (const invalid of [undefined, null, '', 'invalid', '__proto__', {}, 42]) assert.equal(resolveDocsLocale(invalid), 'zh-CN');
});

test('localized shell and provider documentation have complete nonempty four-language entries', () => {
  for (const [key, translations] of Object.entries(docsMessages)) {
    assert.equal(translations.length, 4, key);
    for (const [index, locale] of ['en', 'ja', 'ko', 'fr'].entries()) {
      assert(translations[index].trim().length, `${key}: ${locale}`);
      assert.equal(lookupDocsMessage(locale, key), translations[index]);
      const placeholders = text => [...text.matchAll(/\{(?:page|count)\}/g)].map(match => match[0]).sort();
      assert.deepEqual(placeholders(translations[index]), placeholders(key));
    }
  }
  assert.equal(lookupDocsMessage('fr', 'toString'), undefined);
  assert.equal(lookupDocsMessage('ja', 'Unknown key'), undefined);
});
