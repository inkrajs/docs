import assert from 'node:assert/strict';
import test from 'node:test';
import { setPlaygroundControls } from '../playground-test-helpers.mjs';

test('playground checks wait through deferred resize motion and stable final frames', async () => {
  let frame = 0;
  let reads = 0;
  let clicked = 0;
  const original = globalThis.requestAnimationFrame;
  const node = {
    dataset: { controlsPresent: 'false' },
    querySelector(selector) {
      if (selector === '[data-playground-moving]') return frame >= 1 && frame <= 4 ? {} : null;
      return { getBoundingClientRect() {
        reads++;
        return { width: frame <= 4 ? 600 + frame * 50 : 1000, height: 340 };
      } };
    },
  };
  globalThis.requestAnimationFrame = callback => setImmediate(() => { frame++; callback(); });
  try {
    await setPlaygroundControls({
      locator: () => ({ getAttribute: async () => 'false', click: async () => { clicked++; } }),
      evaluate: (callback, open) => callback(node, open),
    }, false);
    assert.equal(clicked, 0);
    assert(frame >= 8, 'deferred motion and three stable frames must complete');
    assert(reads > 3, 'a truthy Promise must not end polling on the first sample');
  } finally {
    if (original) globalThis.requestAnimationFrame = original;
    else delete globalThis.requestAnimationFrame;
  }
});
