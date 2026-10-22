import { useMemo, useRef, useState } from 'react';
import { Button, ImageCropper, Switch } from '@inkra/react';
import type { ImageCropperHandle, ImageCropperSelection } from '@inkra/react';
import previewLight from '../../../../assets/preview-light.png';
import previewDark from '../../../../assets/preview-dark.png';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './ImageCropperExamples.css';

export function ImageCropperExamples() {
  const { locale, t } = useLocale();
  const english = locale === 'en';
  const text = (zh: string, en: string) => english ? en : zh;
  const [aspect, setAspect] = useState<'square' | 'portrait' | 'free'>('square');
  const [source, setSource] = useState(previewLight);
  const [controlled, setControlled] = useState(true);
  const [showExport, setShowExport] = useState(true);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.05);
  const [selection, setSelection] = useState<ImageCropperSelection | null>(null);
  const [exported, setExported] = useState('');
  const cropperRef = useRef<ImageCropperHandle>(null);
  const resolvedAspect = aspect === 'square' ? 1 : aspect === 'portrait' ? 3 / 4 : 'free';
  const code = useMemo(() => `<ImageCropper
  source={image}
  alt="${text('Inkra 文档预览', 'Inkra documentation preview')}"
  aspect="${aspect === 'free' ? 'free' : resolvedAspect}"
  ${controlled ? 'crop={crop}\n  zoom={zoom}\n  onCropChange={setCrop}\n  onZoomChange={setZoom}' : 'defaultZoom={1.1}'}
  showExport={${showExport}}
  onSelectionCommit={selection => setSelection(selection)}
/>`, [aspect, controlled, english, resolvedAspect, showExport]);

  const labels = {
    cropper: text('图片裁剪区域', 'Image crop area'),
    instructions: text('拖动图片移动，使用方向键移动，滑块缩放。自由比例可用 Alt 加方向键调整裁剪框。', 'Drag to move, use arrow keys to move, and use the slider to zoom. In free mode, Alt plus arrow keys resize the crop area.'),
    loading: text('正在加载图片', 'Loading image'),
    failedTitle: text('图片不可用', 'Image unavailable'),
    failedDescription: text('图片加载失败，请检查来源后重试。', 'The image could not be loaded. Check the source and try again.'),
    retry: text('重试图片', 'Retry image'),
    zoom: text('缩放', 'Zoom'),
    cropWidth: text('裁剪宽度', 'Crop width'),
    cropHeight: text('裁剪高度', 'Crop height'),
    reset: text('重置裁剪', 'Reset crop'),
    export: text('导出裁剪结果', 'Export crop'),
    exporting: text('正在导出', 'Exporting crop'),
  };

  return <div className="image-cropper-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text('比例', 'Aspect')} value={aspect} onValueChange={next => setAspect(next as typeof aspect)} options={[
          ['square', text('正方形 1:1', 'Square 1:1')],
          ['portrait', text('竖向 3:4', 'Portrait 3:4')],
          ['free', text('自由比例', 'Free')],
        ]} />
        <DocsSelect label={text('示例图片', 'Source image')} value={source} onValueChange={setSource} options={[
          [previewLight, text('浅色预览', 'Light preview')],
          [previewDark, text('深色预览', 'Dark preview')],
          ['/assets/missing-image.png', text('失败来源', 'Failing source')],
        ]} />
      </> },
      { label: '交互', content: <>
        <Switch label={text('受控状态', 'Controlled state')} checked={controlled} onCheckedChange={setControlled} />
        <Switch label={text('显示导出按钮', 'Show export')} checked={showExport} onCheckedChange={setShowExport} />
      </> },
      { label: '状态', content: <Button variant="outline" onClick={() => cropperRef.current?.reset()}>{text('恢复默认裁剪', 'Reset crop')}</Button> },
    ]} />}>
      <ImageCropper
        ref={cropperRef}
        alt={text('Inkra 文档预览', 'Inkra documentation preview')}
        aspect={resolvedAspect}
        {...(controlled ? { crop, onCropChange: next => setCrop(next), zoom, onZoomChange: next => setZoom(next) } : {})}
        defaultZoom={1.05}
        labels={labels}
        onExport={result => setExported(`${result.width} x ${result.height} ${result.type}`)}
        onSelectionCommit={setSelection}
        showExport={showExport}
        source={source}
      />
      <div className="image-cropper-examples__status" aria-live="polite">
        {selection ? `${text('原图裁剪像素', 'Natural pixels')}: ${selection.pixels.width} x ${selection.pixels.height}` : ''}
        {exported ? ` · ${text('已导出', 'Exported')}: ${exported}` : ''}
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('切换来源与错误状态', 'Source switching and failure')} code={`<ImageCropper source={image} alt="${text('合法本地图片', 'Legitimate local asset')}" onLoadError={handleLoadError} />`}>
      <div className="image-cropper-examples__stack">
        <ImageCropper source={previewLight} alt={text('浅色本地预览', 'Light local preview')} aspect={4 / 3} showControls={false} />
        <ImageCropper source="/assets/missing-image.png" alt={text('失败示例', 'Failure example')} aspect={4 / 3} showControls={false} />
      </div>
    </ComponentExample>

    <p className="image-cropper-examples__note">{t('导出使用原图自然像素坐标；跨域图片需要服务器允许 CORS，Blob 来源会由组件管理对象 URL 生命周期。')}</p>
  </div>;
}
