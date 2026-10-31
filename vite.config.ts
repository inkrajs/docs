import { defineConfig } from 'vite';
import candidate from './library-candidate.json';

export default defineConfig({
  plugins: [{
    name: 'prism-explicit-core',
    // Prism's grammar files expect a free global. Bind core explicitly so
    // production chunk ordering cannot evaluate a grammar before core exists.
    transform(code, id) {
      if (!/[/\\]prismjs[/\\]components[/\\]prism-(?:jsx|typescript|tsx|bash|json|markdown)\.js(?:\?|$)/.test(id)) return;
      return { code: `import Prism from 'prismjs';\n${code}`, map: null };
    },
  }],
  // Validate the installed public package, not library sources.
  resolve: { dedupe: ['react', 'react-dom'] },
  // Invalidate prebundled dependencies when an unpublished same-version candidate changes.
  define: { __INKRA_DOCS_CANDIDATE__: JSON.stringify(candidate.sha256) },
});
