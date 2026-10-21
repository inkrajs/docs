import { execFileSync } from 'node:child_process';

for (const script of [
  'verify-header-github',
  'verify-docs-shell',
  'verify-docs-actions',
  'verify-tabs-dividers',
  'verify-overlay-sections',
  'verify-sidebar-preference-sizing',
  'verify-select-trigger',
  'verify-input-property-tabs',
  'verify-input-number',
]) {
  execFileSync(process.execPath, ['scripts/' + script + '.mjs'], { stdio: 'inherit' });
}
