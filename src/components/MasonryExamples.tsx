import { useMemo, useState } from 'react';
import {
  Button,
  Masonry,
  PencilLine,
  PencilSurface,
  PencilText,
  Switch,
} from '@inkra/react';
import type { MasonryStrategy } from '@inkra/react';
import { __iconData as imageIcon } from 'lucide-react/dist/esm/icons/image.mjs';
import { __iconData as minusIcon } from 'lucide-react/dist/esm/icons/minus.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as reverseIcon } from 'lucide-react/dist/esm/icons/arrow-up-down.mjs';

import previewDark from '../assets/preview-dark.png';
import previewLight from '../assets/preview-light.png';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { PropertyTabs } from './PropertyTabs';
import { masonryText } from './masonryCopy';
import './MasonryExamples.css';

interface DemoItem {
  id: string;
  titleKey: 'cardSketch' | 'cardPalette' | 'cardReview' | 'cardArchive' | 'cardAsync' | 'cardNotes' | 'cardAdded';
  bodyKey: 'cardSketchBody' | 'cardPaletteBody' | 'cardReviewBody' | 'cardArchiveBody' | 'cardAsyncBody' | 'cardNotesBody' | 'cardAddedBody';
  image?: 'light' | 'dark' | 'async';
  size: 'short' | 'medium' | 'tall';
}

const initialItems: readonly DemoItem[] = [
  { id: 'sketch', titleKey: 'cardSketch', bodyKey: 'cardSketchBody', size: 'medium' },
  { id: 'palette', titleKey: 'cardPalette', bodyKey: 'cardPaletteBody', image: 'light', size: 'tall' },
  { id: 'review', titleKey: 'cardReview', bodyKey: 'cardReviewBody', size: 'tall' },
  { id: 'archive', titleKey: 'cardArchive', bodyKey: 'cardArchiveBody', image: 'dark', size: 'medium' },
  { id: 'async', titleKey: 'cardAsync', bodyKey: 'cardAsyncBody', image: 'async', size: 'short' },
  { id: 'notes', titleKey: 'cardNotes', bodyKey: 'cardNotesBody', size: 'medium' },
];

function MasonryCard({ item, showAsyncImage }: { item: DemoItem; showAsyncImage: boolean }) {
  const { locale } = useLocale();
  const imageSource = item.image === 'light'
    ? previewLight
    : item.image === 'dark'
      ? previewDark
      : item.image === 'async' && showAsyncImage
        ? previewLight
        : undefined;
  const imageAlt = item.image === 'dark'
    ? masonryText(locale, 'imageAltDark')
    : item.image === 'async'
      ? masonryText(locale, 'imageAltAsync')
      : masonryText(locale, 'imageAltLight');

  return <PencilSurface
    as="article"
    className="masonry-examples__card"
    data-card-size={item.size}
    radius={8}
    seed={`masonry-card-${item.id}`}
    variant="paper"
  >
    {imageSource && <img src={imageSource} alt={imageAlt} loading={item.image === 'async' ? 'eager' : 'lazy'} />}
    <div className="masonry-examples__card-copy">
      <PencilText as="h3">{masonryText(locale, item.titleKey)}</PencilText>
      <PencilLine />
      <PencilText as="p">{masonryText(locale, item.bodyKey)}</PencilText>
    </div>
  </PencilSurface>;
}

export function MasonryExamples() {
  const { locale } = useLocale();
  const copy = (key: Parameters<typeof masonryText>[1]) => masonryText(locale, key);
  const [mode, setMode] = useState<'adaptive' | 'fixed'>('adaptive');
  const [columns, setColumns] = useState(3);
  const [minColumnWidth, setMinColumnWidth] = useState(210);
  const [columnGap, setColumnGap] = useState(16);
  const [rowGap, setRowGap] = useState(16);
  const [strategy, setStrategy] = useState<MasonryStrategy>('shortest');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [animated, setAnimated] = useState(true);
  const [items, setItems] = useState<readonly DemoItem[]>(initialItems);
  const [showAsyncImage, setShowAsyncImage] = useState(false);
  const nextAddedId = useMemo(() => 1 + items.filter(item => item.id.startsWith('added-')).length, [items]);

  const code = `<Masonry
  items={items}
  getItemKey={item => item.id}
  columns={${mode === 'adaptive' ? "'auto'" : columns}}
  minColumnWidth={${minColumnWidth}}
  columnGap={${columnGap}}
  rowGap={${rowGap}}
  strategy="${strategy}"
  dir="${direction}"
  renderItem={({ item }) => <ProjectCard item={item} />}
/>`;

  function addItem() {
    setItems(current => [...current, {
      id: `added-${nextAddedId}`,
      titleKey: 'cardAdded',
      bodyKey: 'cardAddedBody',
      size: nextAddedId % 2 === 0 ? 'tall' : 'short',
    }]);
  }

  function removeItem() {
    setItems(current => current.length > 1 ? current.slice(0, -1) : current);
  }

  return <div className="masonry-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: copy('layout'), content: <>
        <DocsSelect label={copy('columnMode')} value={mode} onValueChange={value => setMode(value as typeof mode)} options={[
          ['adaptive', copy('adaptive')], ['fixed', copy('fixed')],
        ]} />
        <DocsSlider label={copy('columns')} value={columns} min={1} max={6} step={1} onValueChange={setColumns} disabled={mode === 'adaptive'} />
        <DocsSlider label={copy('minColumnWidth')} value={minColumnWidth} min={140} max={360} step={10} unit="px" onValueChange={setMinColumnWidth} disabled={mode === 'fixed'} />
        <DocsSlider label={copy('columnGap')} value={columnGap} min={0} max={40} step={2} unit="px" onValueChange={setColumnGap} />
        <DocsSlider label={copy('rowGap')} value={rowGap} min={0} max={40} step={2} unit="px" onValueChange={setRowGap} />
      </> },
      { label: copy('behavior'), content: <>
        <DocsSelect label={copy('strategy')} value={strategy} onValueChange={value => setStrategy(value as MasonryStrategy)} options={[
          ['shortest', copy('shortest')], ['sequential', copy('sequential')],
        ]} />
        <DocsSelect label={copy('direction')} value={direction} onValueChange={value => setDirection(value as typeof direction)} options={[
          ['ltr', 'LTR'], ['rtl', 'RTL'],
        ]} />
        <Switch label={copy('animate')} checked={animated} onCheckedChange={setAnimated} />
      </> },
    ]} />}>
      <div className="masonry-examples__playground" data-testid="masonry-playground">
        <div className="masonry-examples__actions" role="group" aria-label={copy('behavior')}>
          <Button size="sm" variant="outline" startIcon={<DocsIcon data={plusIcon} size={18} />} onClick={addItem}>{copy('add')}</Button>
          <Button size="sm" variant="outline" startIcon={<DocsIcon data={minusIcon} size={18} />} onClick={removeItem}>{copy('remove')}</Button>
          <Button size="sm" variant="outline" startIcon={<DocsIcon data={reverseIcon} size={18} />} onClick={() => setItems(current => [...current].reverse())}>{copy('reverse')}</Button>
          <Button size="sm" variant="outline" startIcon={<DocsIcon data={imageIcon} size={18} />} onClick={() => setShowAsyncImage(value => !value)}>{copy(showAsyncImage ? 'hideImage' : 'loadImage')}</Button>
        </div>
        <Masonry
          aria-label={copy('boardLabel')}
          animated={animated}
          className="masonry-examples__grid"
          columnGap={columnGap}
          columns={mode === 'adaptive' ? 'auto' : columns}
          dir={direction}
          getItemKey={item => item.id}
          items={items}
          minColumnWidth={minColumnWidth}
          renderItem={({ item }) => <MasonryCard item={item} showAsyncImage={showAsyncImage} />}
          role="list"
          rowGap={rowGap}
          strategy={strategy}
        />
      </div>
    </ComponentPlayground>

    <ComponentExample id="masonry-sequential-rtl" title={copy('rtlLabel')} code={`<Masonry columns={3} strategy="sequential" dir="rtl" items={items} getItemKey={item => item.id} renderItem={renderItem} />`}>
      <Masonry
        aria-label={copy('rtlLabel')}
        className="masonry-examples__grid masonry-examples__grid--compact"
        columns={3}
        dir="rtl"
        getItemKey={item => item.id}
        items={initialItems.slice(0, 5)}
        renderItem={({ item }) => <MasonryCard item={item} showAsyncImage />}
        role="list"
        strategy="sequential"
      />
    </ComponentExample>
  </div>;
}
