import { execFileSync } from 'node:child_process';

for (const script of [
  'verify-expansion',
  'verify-expansion-feedback',
  'verify-expansion-overlays',
  'verify-expansion-dates',
  'verify-expansion-navigation',
  'verify-expansion-data',
  'verify-expansion-flows',
]) {
  execFileSync(process.execPath, [`scripts/${script}.mjs`], { stdio: 'inherit' });
}
