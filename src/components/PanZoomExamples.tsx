import { useRef, useState } from 'react';
import inkraArtwork from '../assets/inkra.png';
import {
  Badge,
  Button,
  Card,
  PanZoom,
  PencilIcon,
  PencilLine,
  PencilSurface,
  PencilText,
  Switch,
  type PanZoomRef,
  type PanZoomTransform,
  type PanZoomWheelMode,
} from '@inkra/react';
import { __iconData as crosshairIcon } from 'lucide-react/dist/esm/icons/crosshair.mjs';
import { __iconData as fitIcon } from 'lucide-react/dist/esm/icons/focus.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as zoomInIcon } from 'lucide-react/dist/esm/icons/zoom-in.mjs';
import { __iconData as zoomOutIcon } from 'lucide-react/dist/esm/icons/zoom-out.mjs';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { iconPaths } from './DocsIcon';
import { PropertyTabs } from './PropertyTabs';
import './PanZoomExamples.css';

const crosshairPaths = iconPaths(crosshairIcon);
const fitPaths = iconPaths(fitIcon);
const resetPaths = iconPaths(resetIcon);
const zoomInPaths = iconPaths(zoomInIcon);
const zoomOutPaths = iconPaths(zoomOutIcon);

function PencilGuideGrid() {
  return <div aria-hidden="true" className="pan-zoom-examples__guides">
    {Array.from({ length: 8 }, (_, index) => <PencilLine
      className="pan-zoom-examples__guide pan-zoom-examples__guide--horizontal"
      key={`horizontal-${index}`}
      seed={`pan-zoom-horizontal-${index}`}
      style={{ insetBlockStart: `${(index + 1) * 11}%` }}
    />)}
    {Array.from({ length: 12 }, (_, index) => <PencilLine
      className="pan-zoom-examples__guide pan-zoom-examples__guide--vertical"
      key={`vertical-${index}`}
      orientation="vertical"
      seed={`pan-zoom-vertical-${index}`}
      style={{ insetInlineStart: `${(index + 1) * 7.5}%` }}
    />)}
  </div>;
}

function VisualBoard({ zh, onAction }: { zh: boolean; onAction: () => void }) {
  return <div className="pan-zoom-examples__board">
    <PencilSurface aria-hidden="true" className="pan-zoom-examples__board-paper" radius={8} seed="pan-zoom-board" variant="paper" />
    <PencilGuideGrid />
    <header className="pan-zoom-examples__board-heading">
      <PencilText as="h3">{zh ? '秋日工作台' : 'Autumn workbench'}</PencilText>
      <Badge variant="info">{zh ? '可平移画布' : 'Pannable canvas'}</Badge>
    </header>
    <div className="pan-zoom-examples__grid">
      {[
        [zh ? '收集' : 'Collect', zh ? '照片、便签与参考材料' : 'Photos, notes, and references'],
        [zh ? '整理' : 'Organize', zh ? '把相近的想法放在一起' : 'Group ideas that belong together'],
        [zh ? '分享' : 'Share', zh ? '留下清楚的下一步' : 'Leave one clear next step'],
      ].map(([title, description], index) => <Card.Root className="pan-zoom-examples__note" divided={false} key={title} variant={index === 1 ? 'quiet' : 'paper'}>
        <Card.Content className="pan-zoom-examples__note-content">
          <PencilText className="pan-zoom-examples__note-number">{`0${index + 1}`}</PencilText>
          <PencilText as="h4">{title}</PencilText>
          <PencilText>{description}</PencilText>
          {index === 1 && <Button variant="outline" onClick={onAction}>{zh ? '保留这个想法' : 'Keep this idea'}</Button>}
        </Card.Content>
      </Card.Root>)}
    </div>
  </div>;
}
export function PanZoomExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const ref = useRef<PanZoomRef>(null);
  const [wheel, setWheel] = useState<PanZoomWheelMode>('modifier');
  const [wheelSpeed, setWheelSpeed] = useState(1);
  const [pan, setPan] = useState(true);
  const [pinch, setPinch] = useState(true);
  const [limitToBounds, setLimitToBounds] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [minScale, setMinScale] = useState(0.2);
  const [maxScale, setMaxScale] = useState(4);
  const [scale, setScale] = useState(1);
  const [actionCount, setActionCount] = useState(0);

  const code = `const panZoom = useRef<PanZoomRef>(null);

<div className="viewer">
  <PanZoom
    ref={panZoom}
    aria-label="${text('灵感画布', 'Idea canvas')}"
    minScale={${minScale}}
    maxScale={${maxScale}}
    wheel="${wheel}"
    wheelStep={${wheelSpeed * 0.001}}
    pan={${pan}}
    pinch={${pinch}}
    limitToBounds={${limitToBounds}}
    centerZoomedOut={false}
    readOnly={${readOnly}}
    disabled={${disabled}}
    fitOnInit
    onTransformChange={transform => setScale(transform.scale)}
  >
    <img src={image} alt="${text('彩铅图案', 'Pencil artwork')}" width={800} height={800} draggable={false} />
  </PanZoom>
</div>`;

  const controlledRef = useRef<PanZoomRef>(null);
  const controlledAnchorRef = useRef<HTMLSpanElement>(null);
  const [controlled, setControlled] = useState<PanZoomTransform>({ x: 0, y: 0, scale: 1 });

  return <div className="component-examples pan-zoom-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <DocsSelect label={text('滚轮策略', 'Wheel policy')} value={wheel} onValueChange={value => setWheel(value as PanZoomWheelMode)} options={[
          ['modifier', text('Ctrl / Command + 滚轮', 'Ctrl / Command + wheel')],
          ['always', text('直接滚轮缩放', 'Always zoom')],
          ['disabled', text('关闭滚轮缩放', 'Disable wheel zoom')],
        ]} />
        <DocsSlider label={text('滚轮缩放速度', 'Wheel zoom speed')} min={0.25} max={3} step={0.25} value={wheelSpeed} onValueChange={setWheelSpeed} unit="x" />
        <Switch label={text('拖动平移', 'Drag to pan')} checked={pan} onCheckedChange={setPan} />
        <Switch label={text('双指缩放', 'Pinch zoom')} checked={pinch} onCheckedChange={setPinch} />
      </> },
      { label: '布局', content: <>
        <DocsSlider label={text('最小缩放', 'Minimum scale')} min={0.1} max={1} step={0.1} value={minScale} onValueChange={value => setMinScale(Math.min(value, maxScale))} />
        <DocsSlider label={text('最大缩放', 'Maximum scale')} min={1} max={8} step={0.5} value={maxScale} onValueChange={value => setMaxScale(Math.max(value, minScale))} />
        <Switch label={text('限制平移边界', 'Limit pan bounds')} checked={limitToBounds} onCheckedChange={setLimitToBounds} />
        <div className="pan-zoom-examples__control-row">
          <Button aria-label={text('缩小', 'Zoom out')} data-tooltip={text('缩小', 'Zoom out')} size="icon" variant="outline" onClick={() => void ref.current?.zoomOut()} disabled={disabled}><PencilIcon decorative paths={zoomOutPaths} seed="pan-zoom-control-zoom-out" size={22} sourceSize={24} /></Button>
          <Button aria-label={text('放大', 'Zoom in')} data-tooltip={text('放大', 'Zoom in')} size="icon" variant="outline" onClick={() => void ref.current?.zoomIn()} disabled={disabled}><PencilIcon decorative paths={zoomInPaths} seed="pan-zoom-control-zoom-in" size={22} sourceSize={24} /></Button>
          <Button aria-label={text('适配', 'Fit')} data-tooltip={text('适配', 'Fit')} size="icon" variant="ghost" onClick={() => void ref.current?.fit()} disabled={disabled}><PencilIcon decorative paths={fitPaths} seed="pan-zoom-control-fit" size={22} sourceSize={24} /></Button>
          <Button aria-label={text('复位', 'Reset')} data-tooltip={text('复位', 'Reset')} size="icon" variant="ghost" onClick={() => void ref.current?.reset()} disabled={disabled}><PencilIcon decorative paths={resetPaths} seed="pan-zoom-control-reset" size={22} sourceSize={24} /></Button>
        </div>
      </> },
      { label: '状态', content: <>
        <Switch label={text('只读手势', 'Read-only gestures')} checked={readOnly} onCheckedChange={setReadOnly} disabled={disabled} />
        <Switch label={text('禁用', 'Disabled')} checked={disabled} onCheckedChange={setDisabled} />
        <output className="pan-zoom-examples__output"><PencilText>{`${text('缩放', 'Scale')}: ${scale.toFixed(2)}x`}</PencilText></output>
      </> },
    ]} />}>
      <div className="pan-zoom-examples__frame">
        <PanZoom
          ref={ref}
          aria-label={text('灵感画布', 'Idea canvas')}
          minScale={minScale}
          maxScale={maxScale}
          wheel={wheel}
          wheelStep={wheelSpeed * 0.001}
          pan={pan}
          pinch={pinch}
          limitToBounds={limitToBounds}
          centerZoomedOut={false}
          readOnly={readOnly}
          disabled={disabled}
          fitOnInit
          instructions={text('按方向键平移，按加号或减号缩放，按 0 复位。Ctrl 或 Command 加滚轮可围绕指针缩放。', 'Use arrow keys to pan, plus or minus to zoom, and 0 to reset. Use Control or Command with the wheel to zoom around the pointer.')}
          onTransformChange={transform => setScale(transform.scale)}
        >
          <img src={inkraArtwork} alt={text('彩铅图案', 'Pencil artwork')} width={800} height={800} draggable={false} />
        </PanZoom>
      </div>
    </ComponentPlayground>

    <ComponentExample id="pan-zoom-interactive-content" title={text('包含交互内容的画布', 'Canvas with interactive content')} code={'<PanZoom fitOnInit><VisualBoard /></PanZoom>'}>
      <div className="pan-zoom-examples__frame">
        <PanZoom aria-label={text('秋日工作台', 'Autumn workbench')} fitOnInit>
          <VisualBoard zh={zh} onAction={() => setActionCount(count => count + 1)} />
        </PanZoom>
      </div>
      <output><PencilText>{`${text('内容按钮点击', 'Content button clicks')}: ${actionCount}`}</PencilText></output>
    </ComponentExample>

    <ComponentExample id="pan-zoom-controlled-transform-and-zoom-anchor" title={text('受控变换与缩放锚点', 'Controlled transform and zoom anchor')} code={`const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
const view = useRef<PanZoomRef>(null);
const marker = useRef<HTMLSpanElement>(null);
<PanZoom ref={view} value={transform} onTransformChange={setTransform} minScale={0.2} fitOnInit>
  <Workspace markerRef={marker} />
</PanZoom>

<Button onClick={() => {
  const anchor = marker.current?.getBoundingClientRect();
  if (anchor) void view.current?.zoomTo(2, {
    anchor: { x: anchor.left + anchor.width / 2, y: anchor.top + anchor.height / 2 },
  });
}}>${text('以标记为锚点放大', 'Zoom around marker')}</Button>`}>
      <div className="pan-zoom-examples__controlled">
        <div className="pan-zoom-examples__frame pan-zoom-examples__frame--compact">
          <PanZoom
            ref={controlledRef}
            aria-label={text('受控坐标画布', 'Controlled coordinate canvas')}
            value={controlled}
            onTransformChange={setControlled}
            minScale={0.2}
            maxScale={3}
            wheel="disabled"
            fitOnInit
          >
            <div className="pan-zoom-examples__coordinate-board">
              <PencilSurface aria-hidden="true" className="pan-zoom-examples__coordinate-paper" radius={8} seed="pan-zoom-coordinate-board" variant="paper" />
              <PencilGuideGrid />
              <PencilSurface as="span" className="pan-zoom-examples__anchor" data-pan-zoom-no-drag radius={8} ref={controlledAnchorRef} seed="pan-zoom-anchor" variant="outline">
                <PencilIcon decorative paths={crosshairPaths} seed="pan-zoom-anchor-icon" size={28} sourceSize={24} />
                <PencilText>{text('锚点', 'Anchor')}</PencilText>
              </PencilSurface>
              <PencilText>{text('外部状态决定最终变换；拖动、键盘与按钮使用同一接口。', 'External state owns the final transform; drag, keyboard, and buttons share one API.')}</PencilText>
            </div>
          </PanZoom>
        </div>
        <div className="pan-zoom-examples__controlled-actions">
          <Button variant="outline" onClick={() => {
            const anchor = controlledAnchorRef.current?.getBoundingClientRect();
            if (anchor) void controlledRef.current?.zoomTo(2, { anchor: { x: anchor.left + anchor.width / 2, y: anchor.top + anchor.height / 2 } });
          }}>{text('以标记为锚点放大', 'Zoom around marker')}</Button>
          <Button variant="ghost" onClick={() => setControlled({ x: 0, y: 0, scale: 1 })}>{text('外部复位', 'External reset')}</Button>
          <output><PencilText>{`x ${Math.round(controlled.x)} · y ${Math.round(controlled.y)} · ${controlled.scale.toFixed(2)}x`}</PencilText></output>
        </div>
      </div>
    </ComponentExample>
  </div>;
}
