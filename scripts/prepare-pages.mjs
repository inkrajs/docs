import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { foundationComponents } from '../src/componentRoutes.ts';
import { pageTitle } from '../src/pageTitle.ts';

const dist = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', dist), 'utf8');
const documentation = ['getting-started', 'internationalization', 'theming', 'design-standard', 'usage-guide',
  ...['button', ...foundationComponents].map(name => `components/${name}`)];
const routes = ['blog', 'blog/from-travel-journal-to-inkra', 'ecosystem', 'docs', ...documentation,
  ...documentation.map(path => `docs/${path}`)];
assert.equal(new Set(routes).size, routes.length);
// Pages serves real directories on direct navigation, including legacy URLs.
for (const route of routes) {
  assert(/^[a-z/-]+$/.test(route));
  const directory = new URL(`${route}/`, dist);
  await mkdir(directory, { recursive: true });
  const title = pageTitle('/' + route).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  await writeFile(new URL('index.html', directory), html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`));
}
await writeFile(new URL('.nojekyll', dist), '');
const notices = new URL('licenses/', dist);
await mkdir(notices, { recursive: true });
for (const [source, destination] of [
  ['LICENSE', 'docs-LICENSE.txt'],
  ['THIRD_PARTY_NOTICES.md', 'docs-THIRD_PARTY_NOTICES.md'],
  ['node_modules/@inkra/react/LICENSE', 'inkra-LICENSE.txt'],
  ['node_modules/@inkra/react/THIRD_PARTY_NOTICES.md', 'inkra-THIRD_PARTY_NOTICES.md'],
  ['node_modules/@inkra/react/Yozai-OFL.txt', 'Yozai-OFL.txt'],
  ['node_modules/@inkra/react/Xiaolai-OFL.txt', 'Xiaolai-OFL.txt'],
]) {
  await copyFile(new URL('../' + source, import.meta.url), new URL(destination, notices));
}
console.log(`Prepared ${routes.length} direct-entry routes for GitHub Pages.`);
