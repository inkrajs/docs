import { useMemo, useState } from 'react';
import { Button, PencilText, Switch } from '@inkra/react';

import { ImageViewer, MediaViewer, type ImageViewerItem } from '@inkra/react';
import inkraArtwork from '../assets/inkra.png';
import previewDark from '../assets/preview-dark.png';
import previewLight from '../assets/preview-light.png';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
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

const viewerControlCopy = {
  'zh-CN': { counter: '显示图片计数', position: '工具栏位置', top: '图片上沿', bottom: '图片下沿' },
  en: { counter: 'Show image count', position: 'Toolbar position', top: 'Image top', bottom: 'Image bottom' },
  ja: { counter: '画像数を表示', position: 'ツールバーの位置', top: '画像の上部', bottom: '画像の下部' },
  ko: { counter: '이미지 수 표시', position: '도구 모음 위치', top: '이미지 위쪽', bottom: '이미지 아래쪽' },
  fr: { counter: "Afficher le nombre d'images", position: 'Position des outils', top: "En haut de l'image", bottom: "En bas de l'image" },
};

export function ImageViewerExamples() {
  const { locale, t } = useLocale();
  const english = locale === 'en';
  const text = (zh: string, en: string) => english ? en : zh;
  const [items, setItems] = useState<readonly ImageViewerItem[]>(gallery);
  const [activeId, setActiveId] = useState<string | null>(gallery[0].id);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showCounter, setShowCounter] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'top' | 'bottom'>('top');
  const controlsCopy = viewerControlCopy[locale];
  const [loop, setLoop] = useState(true);
  const [zoomable, setZoomable] = useState(true);
  const [rotatable, setRotatable] = useState(true);
  const [lastChange, setLastChange] = useState('');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [failureRecovered, setFailureRecovered] = useState(false);

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
    dir="${direction}"
    showThumbnails={${showThumbnails}}
    showCounter={${showCounter}}
    toolbarPosition="${toolbarPosition}"
    zoomable={${zoomable}}
    rotatable={${rotatable}}
    labels={localizedLabels}
  />
</ImageViewer.Root>`, [direction, english, loop, rotatable, showThumbnails, showCounter, toolbarPosition, zoomable]);

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
        <DocsSelect label={text('阅读方向', 'Reading direction')} value={direction} onValueChange={value => setDirection(value as 'ltr' | 'rtl')} options={[
          ['ltr', 'LTR'], ['rtl', 'RTL'],
        ]} />
        <Switch label={text('循环浏览', 'Loop navigation')} checked={loop} onCheckedChange={setLoop} />
        <Switch label={text('显示缩略图', 'Show thumbnails')} checked={showThumbnails} onCheckedChange={setShowThumbnails} />
        <Switch label={controlsCopy.counter} checked={showCounter} onCheckedChange={setShowCounter} />
        <DocsSelect label={controlsCopy.position} value={toolbarPosition} onValueChange={value => setToolbarPosition(value as 'top' | 'bottom')}
          options={[[ 'top', controlsCopy.top ], [ 'bottom', controlsCopy.bottom ]]} />
        <Switch label={text('启用缩放', 'Enable zoom')} checked={zoomable} onCheckedChange={setZoomable} />
        <Switch label={text('显示旋转', 'Show rotation')} checked={rotatable} onCheckedChange={setRotatable} />
      </> },
      { label: '状态', content: <>
        <Button variant="outline" onClick={removeActive} disabled={!activeId}>{text('删除当前图片', 'Remove current image')}</Button>
        <Button variant="ghost" onClick={() => setItems([])}>{text('清空列表', 'Clear list')}</Button>
        <Button variant="secondary" onClick={restore}>{text('恢复图片', 'Restore images')}</Button>
      </> },
    ]} />}>
      <div className="image-viewer-examples__gallery" data-testid="image-viewer-playground">
        <div className="image-viewer-examples__preview-list">
          {items.map(item => <img key={item.id} src={item.src} alt="" />)}
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
          <ImageViewer.Content dir={direction} labels={labels} rotatable={rotatable} showThumbnails={showThumbnails}
            showCounter={showCounter} toolbarPosition={toolbarPosition} zoomable={zoomable} />
        </ImageViewer.Root>
        <PencilText as="span" aria-live="polite" className="image-viewer-examples__status">{lastChange ? `${text('当前', 'Current')}: ${t(gallery.find(item => item.id === lastChange)?.alt ?? '无')}` : ''}</PencilText>
      </div>
    </ComponentPlayground>

    <ComponentExample id="image-viewer-images-and-video" title={text('图片与视频', 'Images and video')} code={`<MediaViewer.Root items={[
  { id: 'artwork', src: artwork, alt: '${text('彩铅图案', 'Pencil artwork')}' },
  { id: 'motion', type: 'video', src: '/media/inkra-artwork.webm', poster: artwork, alt: '${text('彩铅图案短片', 'Pencil artwork clip')}' },
]}>
  <MediaViewer.Trigger asChild><Button>${text('浏览图片与视频', 'Browse images and video')}</Button></MediaViewer.Trigger>
  <MediaViewer.Content labels={localizedLabels} videoLabels={localizedVideoLabels} />
</MediaViewer.Root>`}>
      <div className="image-viewer-examples__gallery" data-testid="media-viewer-mixed">
        <MediaViewer.Root items={[
          { ...gallery[2], alt: text('彩铅图案', 'Pencil artwork') },
          { id: 'artwork-motion', type: 'video', src: '/media/inkra-artwork.webm', poster: inkraArtwork, alt: text('彩铅图案短片', 'Pencil artwork clip') },
          { ...gallery[0], alt: text('Inkra 文档浅色主题', 'Inkra documentation in light mode') },
        ]}>
          <MediaViewer.Trigger asChild><Button variant="outline">{text('浏览图片与视频', 'Browse images and video')}</Button></MediaViewer.Trigger>
          <MediaViewer.Content videoLabels={{
            controls: text('视频控制', 'Video controls'),
            play: text('播放视频', 'Play video'),
            pause: text('暂停视频', 'Pause video'),
            seek: text('视频进度', 'Seek video'),
            mute: text('静音', 'Mute video'),
            unmute: text('取消静音', 'Unmute video'),
            volume: text('视频音量', 'Video volume'),
            rate: text('播放速度', 'Playback speed'),
            playbackError: text('暂时无法开始播放，请重试。', 'Video playback could not start. Please try again.'),
          }} labels={{
            ...labels,
            title: text('资源查看器', 'Media viewer'),
            description: text('浏览图片和视频。', 'Browse images and videos.'),
            close: text('关闭资源查看器', 'Close media viewer'),
            previous: text('上一个资源', 'Previous resource'),
            next: text('下一个资源', 'Next resource'),
            thumbnails: text('资源缩略图', 'Resource thumbnails'),
            imagePosition: (current, total) => text(`第 ${current} 项，共 ${total} 项`, `${current} of ${total}`),
            thumbnail: (item, current, total) => text(`查看${item.alt}，第 ${current} 项，共 ${total} 项`, `Show ${item.alt}, ${current} of ${total}`),
            failedTitle: text('资源暂时无法显示', 'Resource unavailable'),
          }} />
        </MediaViewer.Root>
      </div>
    </ComponentExample>

    <ComponentExample id="image-viewer-load-failure-and-recovery" title={text('加载失败与恢复', 'Load failure and recovery')} code={`<Button onClick={() => setRecovered(value => !value)}>${text('切换图片源', 'Switch image source')}</Button>
<ImageViewer.Root items={[{ id: 'preview', src: recovered ? previewLight : '/missing-image.png', alt: '${text('预览图片', 'Preview image')}' }]}>
  <ImageViewer.Trigger asChild><Button>${text('查看恢复状态', 'View recovery state')}</Button></ImageViewer.Trigger>
  <ImageViewer.Content labels={localizedLabels} />
</ImageViewer.Root>`}>
      <div className="image-viewer-examples__recovery" data-testid="image-viewer-recovery">
        <Button variant="ghost" onClick={() => setFailureRecovered(value => !value)}>{failureRecovered ? text('重置失败图片源', 'Reset failing source') : text('恢复图片源', 'Restore image source')}</Button>
        <ImageViewer.Root items={[{
          id: 'missing-preview',
          src: failureRecovered ? previewLight : '/image-viewer-intentionally-missing.png',
          alt: text('预览图片', 'Preview image'),
        }]}>
          <ImageViewer.Trigger asChild><Button variant="outline">{text('查看恢复状态', 'View recovery state')}</Button></ImageViewer.Trigger>
          <ImageViewer.Content labels={labels} />
        </ImageViewer.Root>
      </div>
    </ComponentExample>
  </div>;
}
