import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL(`../../src/components/${name}Examples.tsx`, import.meta.url), 'utf8');

test('media examples use real controls and localized state instead of inert actions', () => {
  const audio = read('AudioPlayer');
  for (const property of ['volume={volume}', 'muted={muted}', 'playbackRate={playbackRate}', 'onVolumeChange={setVolume}', 'onMutedChange={setMuted}', 'onPlaybackRateChange={setPlaybackRate}']) assert(audio.includes(property));
  assert.match(audio, /statuses\[state\.status\]/);
  assert.match(audio, /controls: text\(/);
  const carousel = read('Carousel');
  assert.match(carousel, /<Overlay\.Trigger asChild>/);
  assert.match(carousel, /<ButtonLink[^>]+href="\/favicon/);
});

test('image recovery example preserves the item id and changes its source', () => {
  const viewer = read('ImageViewer');
  assert.match(viewer, /id: 'missing-preview'/);
  assert.match(viewer, /src: failureRecovered \? previewLight/);
  assert.match(viewer, /<ImageViewer\.Content dir=\{direction\}/);
  assert.match(viewer, /\{items\.map\(item => <img/);
});

test('mixed resource example uses local playable video and localized controls', () => {
  const viewer = read('ImageViewer');
  assert.match(viewer, /<MediaViewer\.Root items=/);
  assert.match(viewer, /type: 'video'/);
  assert.match(viewer, /src: '\/media\/inkra-artwork\.webm'/);
  assert.match(viewer, /<MediaViewer\.Content videoLabels=/);
  for (const label of ['controls', 'play', 'pause', 'seek', 'mute', 'unmute', 'volume', 'rate', 'playbackError']) {
    assert(viewer.includes(`${label}: text(`), `${label} is localized`);
  }
  const bytes = readFileSync(new URL('../../public/media/inkra-artwork.webm', import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3', 'local demo is a WebM container');
});
