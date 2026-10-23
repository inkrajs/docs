import { useMemo, useState } from 'react';
import { Button, Switch } from '@inkra/react';

import { ImageViewer, type ImageViewerItem } from '@inkra/react';
import inkraArtwork from '../assets/inkra.png';
import previewDark from '../assets/preview-dark.png';
import previewLight from '../assets/preview-light.png';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './ImageViewerExamples.css';

const gallery: readonly ImageViewerItem[] = [
  {
    id: 'light-docs',
    src: previewLight,
    alt: 'Inkra 文档浅色主题',
    width: 1305,
    height: 1050,
  },
  {
    id: 'dark-docs',
    src: previewDark,
    alt: 'Inkra 文档深色主题',
    width: 1305,
    height: 1050,
  },
  {
    id: 'inkra-artwork',
    src: inkraArtwork,
    alt: 'Inkra 彩铅图案',
    width: 512,
    height: 512,
  },
];

export function ImageViewerExamples() {
  const { locale, t } = useLocale();
  const english = locale === 'en';
  const text = (zh: string, en: string) => english ? en : zh;
  const [items, setItems] = useState<readonly ImageViewerItem[]>(gallery);
  const [activeId, setActiveId] = useState<string | null>(gallery[0].id);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [loop, setLoop] = useState(true);
  const [zoomable, setZoomable] = useState(true);
  const [rotatable, setRotatable] = useState(true);
  const [lastChange, setLastChange] = useState('');

  const code = useMemo(() => `<ImageViewer.Root
  items={images}
  activeId={activeId}
  onActiveIdChange={(id, details) => setActiveId(id)}
  loop={${loop}}
>
  <ImageViewer.Trigger asChild>
    <Button>${text('打开图片查看器', 'Open image viewer')}</Button>
  </ImageViewer.Trigger>
  <ImageViewer.Content
    showThumbnails={${showThumbnails}}
    zoomable={${zoomable}}
    rotatable={${rotatable}}
    labels={localizedLabels}
  />
</ImageViewer.Root>`, [english, loop, rotatable, showThumbnails, zoomable]);

  const labels = {
    title: text('图片查看器', 'Image viewer'),
    description: text('使用前后按钮、缩略图或方向键浏览图片。', 'Browse with the previous and next buttons, thumbnails, or arrow keys.'),
    close: text('关闭图片查看器', 'Close image viewer'),
    previous: text('上一张图片', 'Previous image'),
    next: text('下一张图片', 'Next image'),
    thumbnails: text('图片缩略图', 'Image thumbnails'),
    imagePosition: (current: number, total: number) => text(`第 ${current} 张，共 ${total} 张`, `${current} of ${total}`),
    thumbnail: (item: ImageViewerItem, current: number, total: number) => text(`查看${item.alt}，第 ${current} 张，共 ${total} 张`, `Show ${item.alt}, ${current} of ${total}`),
    failedTitle: text('图片暂时无法显示', 'Image unavailable'),
    failedDescription: (item: ImageViewerItem) => text(`${item.alt} 加载失败。`, `${item.alt} could not be loaded.`),
    retry: text('重试', 'Retry'),
    zoomIn: text('放大图片', 'Zoom in'),
    zoomOut: text('缩小图片', 'Zoom out'),
    resetZoom: text('重置缩放', 'Reset zoom'),
    rotate: text('顺时针旋转', 'Rotate clockwise'),
    panZoom: (item: ImageViewerItem) => text(`平移缩放${item.alt}`, `Pan and zoom ${item.alt}`),
    emptyTitle: text('暂无图片', 'No images'),
    emptyDescription: text('列表中没有可查看的图片。', 'There are no images to show.'),
  };

  function removeActive() {
    if (!activeId) return;
    setItems(current => current.filter(item => item.id !== activeId));
  }

  function restore() {
    setItems(gallery);
    setActiveId(gallery[0].id);
    setLastChange('');
  }

  return <div className="image-viewer-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={text('循环浏览', 'Loop navigation')} checked={loop} onCheckedChange={setLoop} />
        <Switch label={text('显示缩略图', 'Show thumbnails')} checked={showThumbnails} onCheckedChange={setShowThumbnails} />
        <Switch label={text('启用缩放', 'Enable zoom')} checked={zoomable} onCheckedChange={setZoomable} />
        <Switch label={text('显示旋转', 'Show rotation')} checked={rotatable} onCheckedChange={setRotatable} />
      </> },
      { label: '状态', content: <>
        <Button variant="outline" onClick={removeActive} disabled={!activeId}>{text('删除当前图片', 'Remove current image')}</Button>
        <Button variant="ghost" onClick={() => setItems([])}>{text('清空列表', 'Clear list')}</Button>
        <Button variant="secondary" onClick={restore}>{text('恢复图片', 'Restore images')}</Button>
      </> },
    ]} />}>
      <div className="image-viewer-examples__gallery">
        <div className="image-viewer-examples__preview-list">
          {gallery.map(item => <img key={item.id} src={item.src} alt="" />)}
        </div>
        <ImageViewer.Root
          items={items.map(item => ({ ...item, alt: t(item.alt) }))}
          activeId={activeId}
          onActiveIdChange={(nextId, details) => {
            setActiveId(nextId);
            setLastChange(details.item?.id ?? 'none');
          }}
          loop={loop}
        >
          <ImageViewer.Trigger asChild>
            <Button>{text('打开图片查看器', 'Open image viewer')}</Button>
          </ImageViewer.Trigger>
          <ImageViewer.Content labels={labels} rotatable={rotatable} showThumbnails={showThumbnails} zoomable={zoomable} />
        </ImageViewer.Root>
        <span aria-live="polite" className="image-viewer-examples__status">{lastChange ? `${text('当前', 'Current')}: ${t(gallery.find(item => item.id === lastChange)?.alt ?? '无')}` : ''}</span>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('加载失败与恢复', 'Load failure and recovery')} code={`<ImageViewer.Root items={[{ id: 'missing', src: '/missing-image.png', alt: 'Missing preview' }]}>
  <ImageViewer.Trigger asChild><Button>Open failed image</Button></ImageViewer.Trigger>
  <ImageViewer.Content labels={localizedLabels} />
</ImageViewer.Root>`}>
      <ImageViewer.Root items={[{
        id: 'missing-preview',
        src: '/image-viewer-intentionally-missing.png',
        alt: text('故意缺失的预览图片', 'Intentionally missing preview image'),
      }]}>
        <ImageViewer.Trigger asChild><Button variant="outline">{text('查看失败状态', 'View failure state')}</Button></ImageViewer.Trigger>
        <ImageViewer.Content labels={labels} />
      </ImageViewer.Root>
    </ComponentExample>
  </div>;
}
