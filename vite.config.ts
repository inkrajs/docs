import { defineConfig } from 'vite';
import candidate from './library-candidate.json';

export default defineConfig({
  // Validate the installed public package, not library sources.
  resolve: { dedupe: ['react', 'react-dom'] },
  // Invalidate prebundled dependencies when an unpublished same-version candidate changes.
  define: { __INKRA_DOCS_CANDIDATE__: JSON.stringify(candidate.sha256) },
});
