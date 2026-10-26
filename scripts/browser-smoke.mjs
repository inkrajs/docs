import { browserSuite } from './browser-checks.mjs';
import { readBrowserSelectionPlan } from './browser-plan.mjs';
import { runBrowserChecks } from './browser-check-runner.mjs';
import { browserPlan, writeBrowserReport } from './browser-report.mjs';

const suite = browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true');
const selection = process.env.BROWSER_SELECTION_PLAN
  ? await readBrowserSelectionPlan(process.env.BROWSER_SELECTION_PLAN, suite, {
      expectedTestedRevision: process.env.EXPECTED_TESTED_REVISION,
      expectedPlanDigest: process.env.EXPECTED_BROWSER_PLAN_DIGEST,
    })
  : undefined;
if (selection?.selectedCount === 0) throw new Error('Empty browser selections must skip the browser job');
const plan = browserPlan(selection?.selectedScripts ?? suite, process.env.BROWSER_SHARD, selection);
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
