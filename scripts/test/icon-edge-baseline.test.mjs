import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';

test('icon edge regression ships its original pixel baseline in a clean checkout', () => {
  const fixture = new URL('../fixtures/icon-fill-edge-baseline.json.gz', import.meta.url);
  const baseline = JSON.parse(gunzipSync(readFileSync(fixture)).toString());
  assert.equal(baseline.candidate.sha256, 'c5abd221db17f94a898e7db6833e223c47ba98656b0591460697eae0af90ea33');
  for (const dpr of ['1', '2']) {
    assert.equal(Object.keys(baseline[dpr]).length, 24);
    for (const sample of Object.values(baseline[dpr])) {
      assert.equal(sample.rgba.length, sample.width * sample.height * 4);
      assert(sample.rgba.some((value, index) => index % 4 === 3 && value > 0));
    }
  }
  const script = readFileSync(new URL('../verify-icon-fill-edges.mjs', import.meta.url), 'utf8');
  assert(script.includes("new URL('./fixtures/icon-fill-edge-baseline.json.gz', import.meta.url)"));
});
