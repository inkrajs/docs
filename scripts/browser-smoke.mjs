import { browserSuite } from './browser-checks.mjs';
import { runBrowserChecks } from './browser-check-runner.mjs';
import { browserPlan, writeBrowserReport } from './browser-report.mjs';

const plan = browserPlan(browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true'), process.env.BROWSER_SHARD);
if (process.argv.includes('--list')) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  const results = [];
  const startedAt = new Date().toISOString();
  try {
    await runBrowserChecks(plan.scripts, {
      workers: process.env.CI === 'true' ? 2 : 1,
      failFast: false,
      logDirectory: '.ci-results/logs',
      onResult: result => results.push(result),
    });
  } finally {
    await writeBrowserReport({ ...plan, startedAt, completedAt: new Date().toISOString(), results });
  }
}
