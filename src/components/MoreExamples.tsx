import { PropertyTabs } from './PropertyTabs';
import { useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Button,
  Input,
  Progress,
  Separator,
  Skeleton,
  Switch,
  Tooltip,
  type ProgressContentPosition,
  type ProgressRenderState,
} from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import './MoreExamples.css';
import { DocsIcon, iconPaths } from './DocsIcon';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as downloadIcon } from 'lucide-react/dist/esm/icons/download.mjs';

export type MoreExampleKind = 'tooltip' | 'accordion' | 'badge' | 'separator' | 'skeleton' | 'progress';

const sides = [['top', '上'], ['right', '右'], ['bottom', '下'], ['left', '左']] as const;
const badgeVariants = [
  ['neutral', '中性'],
  ['accent', '强调'],
  ['success', '成功'],
  ['warning', '提醒'],
  ['danger', '危险'],
  ['info', '信息'],
] as const;

function TooltipExamples() {
  const { t } = useLocale();
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('top');
  const [offset, setOffset] = useState(8);
  const [content, setContent] = useState('Tooltip');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const [delay, setDelay] = useState(700);
  const [collisions, setCollisions] = useState(true);
  const [hoverable, setHoverable] = useState(true);
  const [radius, setRadius] = useState(6);
  const code = `<Tooltip.Provider delayDuration={${delay}} disableHoverableContent={${!hoverable}}>\n  <Tooltip.Root>\n    <Tooltip.Trigger asChild>\n      <Button variant="outline">${t('内容')}</Button>\n    </Tooltip.Trigger>\n    <Tooltip.Portal>\n      <Tooltip.Content side="${side}" align="${align}" sideOffset={${offset}} avoidCollisions={${collisions}} surfaceRadius={${radius}}>\n        {${JSON.stringify(content)}}\n      </Tooltip.Content>\n    </Tooltip.Portal>\n  </Tooltip.Root>\n</Tooltip.Provider>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <label><PencilText>内容</PencilText><Input value={content} onChange={event => setContent(event.target.value)} /></label>
        <DocsSlider label="圆角" min={0} max={8} value={radius} onValueChange={setRadius} unit="px" />
      </> },
      { label: '布局', content: <>
        <DocsSelect label="方向" value={side} onValueChange={value => setSide(value as typeof side)} options={sides} />
        <DocsSelect label="对齐" value={align} onValueChange={value => setAlign(value as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
        <DocsSlider label="偏移" min={0} max={24} step={4} value={offset} onValueChange={setOffset} unit="px" />
        <Switch label={t('边缘避让')} checked={collisions} onCheckedChange={setCollisions} />
      </> },
      { label: '交互', content: <>
        <DocsSlider label="显示延迟" min={0} max={1500} step={100} value={delay} onValueChange={setDelay} unit="ms" />
        <Switch label={t('悬停内容保持打开')} checked={hoverable} onCheckedChange={setHoverable} />
      </> },
    ]} />}>
      <Tooltip.Provider delayDuration={delay} disableHoverableContent={!hoverable}><Tooltip.Root><Tooltip.Trigger asChild><Button variant="outline">{t('内容')}</Button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content side={side} align={align} sideOffset={offset} avoidCollisions={collisions} surfaceRadius={radius}>{content}</Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>
    </ComponentPlayground>
    <ComponentExample title="方向" code={`<Tooltip.Content side="right" sideOffset={12}>Tooltip</Tooltip.Content>`}>
      <div className="more-examples__row">{sides.map(([value]) => <Tooltip.Provider key={value}><Tooltip.Root><Tooltip.Trigger asChild><Button size="sm" variant="secondary">{value}</Button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content side={value} sideOffset={12}>{value}</Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>)}</div>
    </ComponentExample>
  </>;
}

const accordionItems = [
  ['one', '什么是 Inkra？', 'Inkra 是 React 彩铅组件库。'],
  ['two', '如何保持原生语义？', '交互由原生 DOM 与成熟原语负责。'],
  ['three', '彩铅层负责什么？', 'Canvas 只负责纸张、描边和文字颜料。'],
] as const;

function AccordionItems({ disabledItem = false, showDivider = true, showIcon = true }: { disabledItem?: boolean; showDivider?: boolean; showIcon?: boolean }) {
  const { t } = useLocale();
  return <>
    {accordionItems.map(([value, question, answer]) => <Accordion.Item key={value} value={value} disabled={disabledItem && value === 'two'} showDivider={showDivider}><Accordion.Header><Accordion.Trigger icon={showIcon ? undefined : null}>{t(question)}</Accordion.Trigger></Accordion.Header><Accordion.Content><PencilText>{answer}</PencilText></Accordion.Content></Accordion.Item>)}
  </>;
}

function AccordionExamples() {
  const { t } = useLocale();
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [collapsible, setCollapsible] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [disabledItem, setDisabledItem] = useState(false);
  const [showDivider, setShowDivider] = useState(true);
  const [showIcon, setShowIcon] = useState(true);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [singleValue, setSingleValue] = useState('one');
  const [multipleValue, setMultipleValue] = useState(['one']);
  const itemCode = accordionItems.map(([value, question, answer]) => `  <Accordion.Item value="${value}" showDivider={${showDivider}}${disabledItem && value === 'two' ? ' disabled' : ''}>\n    <Accordion.Header><Accordion.Trigger${showIcon ? '' : ' icon={null}'}>${t(question)}</Accordion.Trigger></Accordion.Header>\n    <Accordion.Content>${t(answer)}</Accordion.Content>\n  </Accordion.Item>`).join('\n');
  const rootProps = type === 'single'
    ? `type="single" value={${JSON.stringify(singleValue)}} onValueChange={setValue}${collapsible ? ' collapsible' : ''}`
    : `type="multiple" value={${JSON.stringify(multipleValue)}} onValueChange={setValue}`;
  const code = `<Accordion.Root ${rootProps} dir="${dir}" disabled={${disabled}}>\n${itemCode}\n</Accordion.Root>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="类型" value={type} onValueChange={value => setType(value as typeof type)} options={[['single', '单项展开'], ['multiple', '多项展开']]} />
        <DocsSelect label="阅读方向" value={dir} onValueChange={value => setDir(value as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
        <Switch label={t('显示分割线')} checked={showDivider} onCheckedChange={setShowDivider} />
        <Switch label={t('显示图标')} checked={showIcon} onCheckedChange={setShowIcon} />
      </> },
      { label: '交互', content: <>
        <Switch label={t('允许全部收起')} checked={collapsible} onCheckedChange={next => { setCollapsible(next); if (!next && !singleValue) setSingleValue('one'); }} disabled={type === 'multiple'} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('禁用第二项')} checked={disabledItem} onCheckedChange={setDisabledItem} />
      </> },
    ]} />}>
      {type === 'single'
        ? <Accordion.Root type="single" collapsible={collapsible} value={singleValue} onValueChange={setSingleValue} disabled={disabled} dir={dir}><AccordionItems disabledItem={disabledItem} showDivider={showDivider} showIcon={showIcon} /></Accordion.Root>
        : <Accordion.Root type="multiple" value={multipleValue} onValueChange={setMultipleValue} disabled={disabled} dir={dir}><AccordionItems disabledItem={disabledItem} showDivider={showDivider} showIcon={showIcon} /></Accordion.Root>}
    </ComponentPlayground>
    <ComponentExample title="多项展开" code={`<Accordion.Root type="multiple" defaultValue={['one', 'two']}>\n${itemCode}\n</Accordion.Root>`}>
      <Accordion.Root type="multiple" defaultValue={['one', 'two']}><AccordionItems disabledItem={disabledItem} showDivider={showDivider} showIcon={showIcon} /></Accordion.Root>
    </ComponentExample>
  </>;
}

function BadgeExamples() {
  const { t } = useLocale();
  const [variant, setVariant] = useState<(typeof badgeVariants)[number][0]>('neutral');
  const [content, setContent] = useState('Badge');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [icon, setIcon] = useState<'none' | 'start' | 'end'>('none');
  const code = `<Badge variant="${variant}" size="${size}"${icon === 'none' ? '' : ` ${icon}Icon={<CheckIcon />}`}>{${JSON.stringify(content)}}</Badge>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="状态" value={variant} onValueChange={value => setVariant(value as typeof variant)} options={badgeVariants} />
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
      </> },
      { label: '内容', content: <>
        <DocsSelect label="图标位置" value={icon} onValueChange={value => setIcon(value as typeof icon)} options={[["none", "无"], ["start", "Start"], ["end", "End"]]} />
        <label><PencilText>内容</PencilText><Input value={content} onChange={event => setContent(event.target.value)} /></label>
      </> },
    ]} />}>
      <Badge variant={variant} size={size} startIcon={icon === 'start' ? <DocsIcon data={checkIcon} size={16} /> : undefined} endIcon={icon === 'end' ? <DocsIcon data={checkIcon} size={16} /> : undefined}>{content}</Badge>
    </ComponentPlayground>
    <ComponentExample title="状态" code={badgeVariants.map(([value, label]) => `<Badge variant="${value}">${t(label)}</Badge>`).join('\n')}>
      <div className="more-examples__row">{badgeVariants.map(([value, label]) => <Badge key={value} variant={value}>{t(label)}</Badge>)}</div>
    </ComponentExample>
  </>;
}

function SeparatorExamples() {
  const { t } = useLocale();
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [decorative, setDecorative] = useState(true);
  const [weight, setWeight] = useState(0.9);
  const code = `<Separator orientation="${orientation}" decorative={${decorative}} weight={${weight}} />`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="方向" value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[['horizontal', '横向'], ['vertical', '纵向']]} />
        <DocsSlider label="笔触粗细" min={0.3} max={2} step={0.1} value={weight} onValueChange={setWeight} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('仅装饰')} checked={decorative} onCheckedChange={setDecorative} />
      </> },
    ]} />}>
      <div className={`more-examples__separator-demo more-examples__separator-demo--${orientation}`}><PencilText>01</PencilText><Separator orientation={orientation} decorative={decorative} weight={weight} /><PencilText>02</PencilText></div>
    </ComponentPlayground>
    <ComponentExample title="纵向" code={`<Separator orientation="vertical" />`}>
      <div className="more-examples__separator-pair"><PencilText>01</PencilText><Separator orientation="vertical" /><PencilText>02</PencilText></div>
    </ComponentExample>
  </>;
}

function SkeletonExamples() {
  const [width, setWidth] = useState(240);
  const [height, setHeight] = useState(24);
  const [radius, setRadius] = useState(6);
  const code = `<Skeleton radius={${radius}} style={{ width: ${width}, height: ${height} }} />`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSlider label="圆角" min={0} max={8} value={radius} onValueChange={setRadius} unit="px" />
      </> },
      { label: '布局', content: <>
        <DocsSlider label="宽度" min={80} max={360} step={20} value={width} onValueChange={setWidth} unit="px" />
        <DocsSlider label="高度" min={12} max={96} step={4} value={height} onValueChange={setHeight} unit="px" />
      </> },
    ]} />}>
      <Skeleton radius={radius} style={{ width, height }} />
    </ComponentPlayground>
    <ComponentExample title="内容" code={`<Skeleton style={{ width: 48, height: 48 }} />\n<Skeleton style={{ width: 220, height: 16 }} />`}>
      <div className="more-examples__skeleton-stack"><Skeleton style={{ width: 48, height: 48 }} /><div><Skeleton style={{ width: 220, height: 16 }} /><Skeleton style={{ width: 160, height: 12 }} /></div></div>
    </ComponentExample>
  </>;
}

function ProgressExamples() {
  const { t, locale } = useLocale();
  const zh = locale !== 'en';
  const [value, setValue] = useState(48);
  const [indeterminate, setIndeterminate] = useState(false);
  const [max, setMax] = useState(100);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [label, setLabel] = useState('Progress');
  const [shape, setShape] = useState<'linear' | 'circular'>('circular');
  const [position, setPosition] = useState<ProgressContentPosition>('center');
  const [diameter, setDiameter] = useState(128);
  const [customDiameter, setCustomDiameter] = useState(false);
  const [thickness, setThickness] = useState(6);
  const [contentMode, setContentMode] = useState('both');
  const [customText, setCustomText] = useState('Inkra');
  const progressValue = indeterminate ? null : value;
  const contentCode = contentMode === 'none' ? '' : contentMode === 'text' ? JSON.stringify(customText)
    : contentMode === 'icon' ? '<PencilIcon paths={downloadPaths} sourceSize={24} size={26} />'
    : `{({ percent }) => ${contentMode === 'both' ? '<span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><PencilIcon paths={downloadPaths} sourceSize={24} size={26} />' : ''}<PencilText>{percent === null ? '...' : Math.round(percent) + '%'}</PencilText>${contentMode === 'both' ? '</span>' : ''}}`;
  const code = `${contentMode === 'both' || contentMode === 'icon' ? `const downloadPaths = ${JSON.stringify(iconPaths(downloadIcon))};\n\n` : ''}<Progress ${label ? `label={${JSON.stringify(label)}}` : 'aria-label="Progress"'}\n  shape="${shape}" size="${size}" dir="${dir}"\n  value={${progressValue === null ? 'null' : progressValue}} max={${max}}\n  contentPosition="${position}"${shape === 'circular' ? `${customDiameter ? ` diameter={${diameter}}` : ''} thickness={${thickness}}` : ''}${contentMode === 'none' ? ' />' : `>\n  ${contentMode === 'text' ? `{${contentCode}}` : contentCode}\n</Progress>`}`;
  const renderContent = ({ percent }: ProgressRenderState) => {
    if (contentMode === 'none') return null;
    if (contentMode === 'text') return customText;
    return <span className="more-examples__progress-content">
      {(contentMode === 'both' || contentMode === 'icon') && <DocsIcon data={downloadIcon} size={26} />}
      {contentMode !== 'icon' && <PencilText>{percent === null ? '...' : `${Math.round(percent)}%`}</PencilText>}
    </span>;
  };

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '展示形式' : 'Shape'} value={shape} onValueChange={value => setShape(value as typeof shape)} options={[["linear", zh ? '条形' : 'Linear'], ["circular", zh ? '环状' : 'Circular']]} />
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
        <DocsSelect label="阅读方向" value={dir} onValueChange={value => setDir(value as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
        <label><PencilText>名称</PencilText><Input value={label} onChange={event => setLabel(event.target.value)} /></label>
      </> },
      { label: '内容', content: <>
        <DocsSlider label="最大值" min={10} max={200} step={10} value={max} onValueChange={next => { setMax(next); setValue(current => Math.min(current, next)); }} />
        <DocsSlider label="当前值" min={0} max={max} value={value} disabled={indeterminate} onValueChange={setValue} />
        <DocsSelect label={zh ? '自定义内容' : 'Custom content'} value={contentMode} onValueChange={setContentMode} options={[
          ['both', zh ? '图标与数值' : 'Icon and value'], ['percent', zh ? '百分比' : 'Percentage'], ['icon', zh ? '图标' : 'Icon'], ['text', zh ? '文字' : 'Text'], ['none', zh ? '不显示' : 'None'],
        ]} />
        {contentMode === 'text' && <label><PencilText>{zh ? '自定义文字' : 'Custom text'}</PencilText><Input value={customText} onChange={event => setCustomText(event.target.value)} /></label>}
      </> },
      { label: '布局', content: <>
        <DocsSelect label={zh ? '内容位置' : 'Content position'} value={position} onValueChange={value => setPosition(value as ProgressContentPosition)} options={[
          ['center', zh ? '环内（条形时在右侧）' : 'Center (end for linear)'], ['top', zh ? '上方' : 'Top'], ['bottom', zh ? '下方' : 'Bottom'], ['start', zh ? '左侧（RTL 为右）' : 'Start'], ['end', zh ? '右侧（RTL 为左）' : 'End'],
        ]} />
        {shape === 'circular' && <>
          <Switch label={zh ? '自定义直径' : 'Custom diameter'} checked={customDiameter} onCheckedChange={setCustomDiameter} />
          {customDiameter && <DocsSlider label={zh ? '圆环直径' : 'Ring diameter'} min={64} max={240} step={8} value={diameter} onValueChange={setDiameter} unit="px" />}
          <DocsSlider label={zh ? '环宽' : 'Ring width'} min={1} max={12} value={thickness} onValueChange={setThickness} unit="px" />
        </>}
      </> },
      { label: '状态', content: <>
        <Switch label={t('不确定进度')} checked={indeterminate} onCheckedChange={setIndeterminate} />
      </> },
    ]} />}>
      <div className="more-examples__progress-demo"><Progress label={label || undefined} aria-label={label ? undefined : 'Progress'} value={progressValue} max={max} size={size} dir={dir}
        shape={shape} diameter={customDiameter ? diameter : undefined} thickness={thickness} contentPosition={position}>{renderContent}</Progress></div>
    </ComponentPlayground>
    <ComponentExample title={zh ? '环内内容与外部说明' : 'Inside and outside the ring'} code={`<Progress shape="circular" value={72} aria-label="Download">\n  {({ percent }) => <PencilText>{Math.round(percent ?? 0)}%</PencilText>}\n</Progress>\n<Progress shape="circular" value={3} max={5} contentPosition="end" aria-label="Files">\n  <span>3 / 5 files</span>\n</Progress>`}>
      <div className="more-examples__ring-examples">
        <Progress shape="circular" value={72} aria-label={zh ? '下载进度' : 'Download progress'}>{({ percent }) => `${Math.round(percent ?? 0)}%`}</Progress>
        <Progress shape="circular" value={3} max={5} contentPosition="end" aria-label={zh ? '文件进度' : 'File progress'}><span className="more-examples__progress-content"><DocsIcon data={downloadIcon} size={28} /><PencilText>{zh ? '3 / 5 个文件' : '3 / 5 files'}</PencilText></span></Progress>
        <Progress shape="circular" value={100} contentPosition="bottom" aria-label={zh ? '同步完成' : 'Sync complete'}><span className="more-examples__progress-content"><DocsIcon data={checkIcon} size={28} /><PencilText>{zh ? '同步完成' : 'Sync complete'}</PencilText></span></Progress>
      </div>
    </ComponentExample>
    <ComponentExample title={zh ? '空环、闭合与未知进度' : 'Empty, complete and indeterminate'} code={`<Progress shape="circular" value={0} label="0%">0%</Progress>\n<Progress shape="circular" value={100} label="100%">100%</Progress>\n<Progress shape="circular" value={null} label="Loading">...</Progress>`}>
      <div className="more-examples__ring-examples"><Progress shape="circular" value={0} label="0%">0%</Progress><Progress shape="circular" value={100} label="100%">100%</Progress><Progress shape="circular" value={null} label={zh ? '加载中' : 'Loading'}>...</Progress></div>
    </ComponentExample>
    <ComponentExample title="状态" code={`<Progress aria-label="Progress" value={24} />\n<Progress aria-label="Progress" value={null} />`}>
      <div className="more-examples__progress-stack"><Progress aria-label="24" value={24} /><Progress aria-label="72" value={72} /><Progress aria-label="Indeterminate" value={null} /></div>
    </ComponentExample>
  </>;
}

export function MoreExamples({ kind }: { kind: MoreExampleKind }) {
  return useMemo(() => {
    if (kind === 'tooltip') return <TooltipExamples />;
    if (kind === 'accordion') return <AccordionExamples />;
    if (kind === 'badge') return <BadgeExamples />;
    if (kind === 'separator') return <SeparatorExamples />;
    if (kind === 'skeleton') return <SkeletonExamples />;
    return <ProgressExamples />;
  }, [kind]);
}
