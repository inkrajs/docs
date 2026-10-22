import { execFileSync } from 'node:child_process';

for (const script of [
  'verify-text-first-paint',
  'verify-docs-spacing',
  'verify-theme-customizer',
  'verify-navigation-hierarchy',
  'verify-header-github',
  'verify-docs-shell',
  'verify-page-titles',
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
