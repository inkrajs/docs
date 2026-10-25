import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL(`../../src/${name}`, import.meta.url), 'utf8');

test('global focus fallback does not override component-owned pencil focus', () => {
  const css = read('styles.css');
  assert.match(css, /:where\(:focus-visible\)\s*\{[^}]*outline:\s*var\(--inkra-focus-width\) solid/);
  assert.doesNotMatch(css, /(?:^|\n):focus-visible\s*\{/);
});

test('navigation labels reuse pencil ellipsis instead of wrapping', () => {
  const source = read('App.tsx');
  const css = read('styles.css');
  assert.match(source, /<PencilText ellipsis className="side-navigation__label" seed=\{`nav-group-\$\{group.label\}`\}/);
  assert.match(source, /<PencilText ellipsis className="side-navigation__label" seed=\{`nav-\$\{item.path\}`\}/);
  assert.match(css, /\.nav-group-label \.inkra-accordion__trigger-label,\s*\.nav-link \.selection-control-content\s*\{[^}]*grid-template-columns:\s*26px minmax\(0, 1fr\)/);
  assert.match(css, /\.nav-group-label \.inkra-accordion__trigger-icon\s*\{[^}]*flex:\s*0 0 16px/);
  assert.match(css, /\.side-navigation__label\s*\{[^}]*white-space:\s*nowrap/);
  assert.doesNotMatch(css, /\.side-navigation__label\s*\{[^}]*overflow-wrap:\s*anywhere/);
});

test('preview content determines height and stays inert behind code', () => {
  const css = read('styles.css');
  assert.match(css, /\.preview-display\s*\{[^}]*min-height:\s*340px/);
  assert.doesNotMatch(css, /\.preview-display\s*\{[^}]*[; ]height:\s*340px/);
  assert.match(read('components/ComponentPlayground.tsx'), /inert=\{view !== 'preview'\}/);
  assert.match(css, /\.preview-stage\[aria-hidden="true"\]\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.preview-controls-divider\s*\{[^}]*contain:\s*size/);
  const playgroundCss = read('components/ComponentExample.css');
  assert.match(playgroundCss, /\.component-playground\[data-controls-layout\] \.preview-controls-divider\s*\{[^}]*height:\s*0;[^}]*min-height:\s*100%/);
});

test('playground properties are container-aware, persistent and keyboard dismissible', () => {
  const source = read('components/ComponentPlayground.tsx');
  const css = read('components/ComponentExample.css');
  assert.match(source, /new ResizeObserver/);
  assert.doesNotMatch(source, /matchMedia/);
  assert.match(source, /aria-expanded=\{controlsOpen\}/);
  assert.match(source, /aria-controls=\{`\$\{id\}-properties`\}/);
  assert.match(source, /if \(controlsPresent\) setControlsMounted\(true\)/);
  assert.match(source, /controlsMounted \? controls : null/);
  assert.match(source, /hidden=\{!controlsPresent\} inert=\{!controlsOpen\} aria-hidden=\{!controlsOpen \|\| undefined\}/);
  assert.match(source, /inert=\{overlayOpen\}/);
  assert.match(source, /event\.key !== 'Escape'/);
  assert.match(source, /toggleRef\.current\?\.focus\(\)/);
  assert.match(source, /variant="full" aria-hidden="true"/);
  assert.match(css, /data-controls-layout="wide".*grid-template-columns: minmax\(0, 2fr\) 8px minmax\(0, 1fr\)/);
  assert.match(css, /data-controls-layout="full"\] \.preview-controls-divider \{ display: none/);
  assert.match(css, /\.component-playground:is\(\[data-controls-layout="overlay"\], \[data-controls-layout="full"\]\) \.preview-controls/);
  assert.match(css, /data-controls-layout="full"\] \.preview-controls \{ width: 100%/);
  assert.doesNotMatch(css, /\[data-controls-layout\]:not\(\[data-controls-layout="wide"\]\)/);
  assert.match(css, /background: var\(--inkra-paper\)/);
});

test('playground motion preserves final layout and honors reduced motion', () => {
  const source = read('components/usePlaygroundMotion.ts');
  const css = read('components/ComponentExample.css');
  assert.match(source, /const duration = 180/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /preference\.addEventListener\('change', update\)/);
  assert.match(source, /preference\.removeEventListener\('change', update\)/);
  assert.match(source, /motion\.complete\(\)/);
  assert.match(source, /animation\.cancel\(\)/);
  assert.match(source, /setControlsPresent\(false\)/);
  assert.match(source, /old\.rootWidth !== next\.rootWidth/);
  assert.match(source, /width: display\.offsetWidth, height: display\.offsetHeight/);
  assert.match(source, /count < 8/);
  assert.match(css, /data-controls-present="true"/);
  assert.match(css, /data-controls-present="false"/);
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|getBoundingClientRect|\.style\.(?:height|width)/);
  assert.doesNotMatch(css, /transition:\s*all/);
});

test('reduced motion removes color transitions before pencil canvases capture appearance', () => {
  const css = read('styles.css');
  const reduced = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(reduced, /animation-duration:\s*0\.01ms !important/);
  assert.match(reduced, /transition-duration:\s*0ms !important/);
  assert.doesNotMatch(reduced, /transition-duration:\s*0\.01ms/);
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
  assert.match(examples, /const \[limitToBounds, setLimitToBounds\] = useState\(false\)/);
  assert.match(examples, /label=\{text\('限制平移边界', 'Limit pan bounds'\)\}/);
  assert.match(examples, /limitToBounds=\{limitToBounds\}/);
  assert.match(examples, /centerZoomedOut=\{false\}/);
  assert.match(examples, /wheel="disabled"\s+fitOnInit/);
  assert.doesNotMatch(examples, /controlledRef\.current\?\.fit\(\{ duration: 0 \}\)/);
  assert.doesNotMatch(examples, /controlledDidFitRef/);
  assert.match(examples, /minScale=\{0\.2\}/);
  assert.match(examples, /controlledAnchorRef\.current\?\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/i);
  assert.doesNotMatch(styles, /border-radius:\s*50%/);
  assert.doesNotMatch(styles, /border:\s*var\(--inkra-stroke-width\)\s+solid/);
});
