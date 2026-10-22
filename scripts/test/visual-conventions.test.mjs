import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL(`../../src/${name}`, import.meta.url), 'utf8');

test('navigation labels reuse pencil ellipsis instead of wrapping', () => {
  assert.match(read('App.tsx'), /<PencilText ellipsis seed=\{`nav-/);
  assert.doesNotMatch(read('styles.css'), /\.nav-link \.inkra-pencil-text\s*\{[^}]*overflow-wrap:\s*anywhere/);
});

test('preview content determines height and stays inert behind code', () => {
  const css = read('styles.css');
  assert.match(css, /\.preview-display\s*\{[^}]*min-height:\s*340px/);
  assert.doesNotMatch(css, /\.preview-display\s*\{[^}]*[; ]height:\s*340px/);
  assert.match(read('components/ComponentPlayground.tsx'), /inert=\{view !== 'preview'\}/);
  assert.match(css, /\.preview-stage\[aria-hidden="true"\]\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.preview-controls-divider\s*\{[^}]*contain:\s*size/);
});

test('toolbar and shortcut separators use shared pencil components', () => {
  for (const component of ['OverflowList', 'Hotkey']) {
    assert.match(read(`components/${component}Examples.tsx`), /<PencilLine/);
    assert.doesNotMatch(read(`components/${component}Examples.css`), /border(?:-block-end)?:\s*1px solid/);
  }
  assert.match(read('components/OverflowListExamples.tsx'), /renderItem=\{item => <Badge>/);
});

test('new examples use scoped paper themes and regular handwritten text', () => {
  assert.match(read('components/CarouselExamples.tsx'), /<PencilSurface as="figure" variant="paper" data-inkra-theme="dark"/);
  assert.doesNotMatch(read('components/CarouselExamples.css'), /#[\da-f]{6}/i);
  assert.doesNotMatch(read('components/HeatmapExamples.css'), /font-weight:\s*(?:[5-9]00|bold)/);
});

test('PanZoom examples use pencil primitives and declarative controlled fitting', () => {
  const examples = read('components/PanZoomExamples.tsx');
  const styles = read('components/PanZoomExamples.css');
  assert.match(examples, /<PencilGuideGrid/);
  assert.match(examples, /<PencilLine/);
  assert.match(examples, /<PencilSurface/);
  assert.match(examples, /<PencilIcon/);
  assert.match(examples, /crosshairIcon/);
  assert.match(examples, /zoomInIcon/);
  assert.match(examples, /zoomOutIcon/);
  assert.match(examples, /fitIcon/);
  assert.match(examples, /resetIcon/);
  assert.match(examples, /size="icon"/);
  assert.match(examples, /aria-label=\{text\('缩小', 'Zoom out'\)\}/);
  assert.match(examples, /data-tooltip=\{text\('复位', 'Reset'\)\}/);
  assert.match(examples, /<PencilText className="pan-zoom-examples__note-number">/);
  assert.match(examples, /<output className="pan-zoom-examples__output"><PencilText>/);
  assert.match(examples, /<output><PencilText>/);
  assert.match(examples, /const \[minScale, setMinScale\] = useState\(0\.2\)/);
  assert.match(examples, /wheel="disabled"\s+fitOnInit/);
  assert.doesNotMatch(examples, /controlledRef\.current\?\.fit\(\{ duration: 0 \}\)/);
  assert.doesNotMatch(examples, /controlledDidFitRef/);
  assert.match(examples, /minScale=\{0\.2\}/);
  assert.match(examples, /controlledAnchorRef\.current\?\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/i);
  assert.doesNotMatch(styles, /border-radius:\s*50%/);
  assert.doesNotMatch(styles, /border:\s*var\(--inkra-stroke-width\)\s+solid/);
});
