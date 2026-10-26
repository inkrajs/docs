import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browserSuite } from './browser-checks.mjs';
import { checkBrowserReports } from './browser-report.mjs';

const directory = process.argv[2] || '.ci-results';
const count = Number(process.argv[3] || 4);
assert(Number.isSafeInteger(count) && count > 0, 'Pass a positive shard count');
const files = (await readdir(directory)).filter(file => /^browser-\d+-of-\d+\.json$/.test(file));
const reports = await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8'))));
const suite = browserSuite(process.env.BROWSER_INCLUDE_HOMEPAGE === 'true');
checkBrowserReports(reports, suite, count);
console.log(`All ${suite.length} browser checks passed exactly once across ${count} shards.`);
