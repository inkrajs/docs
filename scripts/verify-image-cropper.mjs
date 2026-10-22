import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const root = new URL('../../../', import.meta.url);
const source = readFileSync(new URL('packages/inkra/src/image-cropper/index.tsx', root), 'utf8');
const model = readFileSync(new URL('packages/inkra/src/image-cropper/model.ts', root), 'utf8');
const styles = readFileSync(new URL('packages/inkra/src/image-cropper/styles.css', root), 'utf8');
const example = readFileSync(new URL('apps/docs/src/components/ImageCropperExamples.tsx', root), 'utf8');
const exampleStyles = readFileSync(new URL('apps/docs/src/components/ImageCropperExamples.css', root), 'utf8');

assert.match(source, /<Cropper/);
assert.match(source, /aspect=\{engineAspect\}/);
assert.match(source, /onCropComplete=/);
assert.match(source, /onMediaLoaded=/);
assert.match(source, /URL\.revokeObjectURL/);
assert.match(source, /event\.altKey/);
assert.match(source, /disableAutomaticStylesInjection/);
assert.match(source, /M21 12a9 9 0 1 1-6\.219-8\.56/);
assert.match(source, /paths=\{loadingPaths\}/);
assert.match(model, /naturalWidth/);
assert.match(model, /server did not permit canvas export/);
assert.match(model, /IMAGE_CROPPER_MAX_OUTPUT_PIXELS/);
assert.match(styles, /@media \(forced-colors: active\)/);
assert.match(styles, /@media \(max-width: 36rem\)/);
assert.doesNotMatch(styles, /\.inkra-image-cropper__spinner \{[^}]*border:/);
assert.match(source, /<PencilSurface as="span" aria-hidden="true" className="inkra-image-cropper__stage-surface"/);
assert.match(source, /<PencilText>/);
assert.match(styles, /\.inkra-image-cropper__area \{[^}]*border: 2px solid currentColor/);
assert.match(example, /ComponentPlayground/);
assert.match(example, /PropertyTabs/);
assert.match(example, /自由比例|Free/);
assert.match(example, /onExport/);
assert.match(example, /missing-image\.png/);
assert.match(exampleStyles, /grid-template-columns/);
assert.doesNotMatch(source, /ImageViewer/);

console.log('ImageCropper source/docs contract checks passed');
