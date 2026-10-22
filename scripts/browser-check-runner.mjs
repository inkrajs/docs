import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runScript(script) {
  console.log(`RUN ${script}`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(`${script}.mjs`, import.meta.url))], { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed (${signal ?? code})`));
    });
  });
}

export async function runBrowserChecks(scripts, { workers = 1, run = runScript } = {}) {
  assert(Number.isInteger(workers) && workers >= 1 && workers <= 2, 'Browser workers must be 1 or 2');
  let next = 0;
  let failure;
  async function worker() {
    while (!failure && next < scripts.length) {
      const script = scripts[next++];
      try {
        await run(script);
      } catch (error) {
        failure ??= error;
      }
    }
  }
  // Let in-flight checks close their own browsers before reporting a failure.
  await Promise.all(Array.from({ length: workers }, worker));
  if (failure) throw failure;
}
