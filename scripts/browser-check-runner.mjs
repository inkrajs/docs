import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { finished } from 'node:stream/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runBrowserScript(script, {
  logDirectory,
  timeoutMs = 600000,
  killGraceMs = 2000,
  scriptDirectory = fileURLToPath(new URL('./', import.meta.url)),
} = {}) {
  assert(/^[a-z0-9-]+$/.test(script), 'Invalid browser script name');
  assert(Number.isFinite(timeoutMs) && timeoutMs > 0, 'Browser timeout must be positive');
  if (logDirectory) await mkdir(logDirectory, { recursive: true });
  const log = logDirectory ? createWriteStream(join(logDirectory, `${script}.log`)) : undefined;
  const logFinished = log ? finished(log).then(() => null, error => error) : Promise.resolve(null);
  try {
    await new Promise((resolve, reject) => {
      // A process group lets a timed-out check clean up its Chromium children too.
      const grouped = process.platform !== 'win32';
      const child = spawn(process.execPath, [join(scriptDirectory, `${script}.mjs`)], {
        stdio: ['ignore', 'pipe', 'pipe'], detached: grouped,
      });
      for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
        stream.on('data', chunk => { output.write(chunk); log?.write(chunk); });
      }
      let timedOut = false;
      let spawnError;
      let forceKill;
      const kill = signal => {
        try {
          if (grouped && child.pid) process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch (error) {
          if (error.code !== 'ESRCH') spawnError = error;
        }
      };
      const timer = setTimeout(() => {
        timedOut = true;
        kill('SIGTERM');
        forceKill = setTimeout(() => kill('SIGKILL'), killGraceMs);
      }, timeoutMs);
      child.once('error', error => { spawnError = error; });
      child.once('close', (code, signal) => {
        clearTimeout(timer);
        clearTimeout(forceKill);
        if (timedOut) {
          kill('SIGKILL');
          reject(new Error(`${script} timed out after ${timeoutMs}ms`));
        } else if (spawnError) reject(spawnError);
        else if (code === 0) resolve();
        else reject(new Error(`${script} failed (${signal ?? code})`));
      });
    });
  } finally {
    log?.end();
    const error = await logFinished;
    if (error) throw error;
  }
}

export async function runBrowserChecks(scripts, {
  workers = 1, run = runBrowserScript, failFast = true,
  logDirectory, timeoutMs, onResult = () => {},
} = {}) {
  assert(Number.isInteger(workers) && workers >= 1 && workers <= 2, 'Browser workers must be 1 or 2');
  let next = 0;
  const failures = [];
  async function worker() {
    while ((!failFast || failures.length === 0) && next < scripts.length) {
      const script = scripts[next++];
      const started = performance.now();
      const result = { script, status: 'passed', durationMs: 0 };
      console.log(`RUN ${script}`);
      try {
        await run(script, { logDirectory, timeoutMs });
      } catch (error) {
        failures.push(error);
        result.status = 'failed';
        result.error = String(error?.message ?? error);
      }
      result.durationMs = Math.round(performance.now() - started);
      console.log(`${result.status.toUpperCase()} ${script} (${(result.durationMs / 1000).toFixed(1)}s)`);
      try { await onResult(result); } catch (error) { failures.push(error); }
    }
  }
  // Let in-flight checks close their own browsers before reporting a failure.
  await Promise.all(Array.from({ length: workers }, worker));
  if (failures.length === 1) throw failures[0];
  if (failures.length) throw new AggregateError(failures, `${failures.length} browser checks failed`);
}
