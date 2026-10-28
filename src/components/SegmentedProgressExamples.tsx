import { useState } from 'react';
import {
  Progress,
  Switch,
  type ProgressPartialSegment,
} from '@inkra/react';

import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { PropertyTabs } from './PropertyTabs';
import './SegmentedProgressExamples.css';

const thresholds = [
  { value: 0, color: 'var(--inkra-danger-pigment)' },
  { value: 40, color: 'var(--inkra-warning-pigment)' },
  { value: 75, color: 'var(--inkra-success-pigment)' },
] as const;

export function SegmentedProgressExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [value, setValue] = useState(62);
  const [max, setMax] = useState(100);
  const [segmentCount, setSegmentCount] = useState(10);
  const [segmentGap, setSegmentGap] = useState(3);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [partialSegment, setPartialSegment] = useState<ProgressPartialSegment>('fractional');
  const [colored, setColored] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const progressValue = indeterminate ? null : value;
  const code = `<Progress shape="segmented" aria-label="${zh ? '发布进度' : 'Release progress'}"
  value={${progressValue === null ? 'null' : progressValue}} max={${max}}
  segmentCount={${segmentCount}} segmentGap={${segmentGap}}
  partialSegment="${partialSegment}" size="${size}"${colored ? `
  thresholds={[
    { value: 0, color: 'var(--inkra-danger-pigment)' },
    { value: 40, color: 'var(--inkra-warning-pigment)' },
    { value: 75, color: 'var(--inkra-success-pigment)' },
  ]}` : ''}>
  {({ percent }) => percent === null ? '${zh ? '处理中' : 'Working'}' : Math.round(percent) + '%'}
</Progress>`;

  return <div className="segmented-progress-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={next => setSize(next as typeof size)} options={controlSizes} />
        <DocsSlider label={zh ? '最大值' : 'Maximum'} min={20} max={200} step={10} value={max} onValueChange={next => { setMax(next); setValue(current => Math.min(current, next)); }} />
        <DocsSlider label={zh ? '当前值' : 'Value'} min={0} max={max} value={value} disabled={indeterminate} onValueChange={setValue} />
      </> },
      { label: '布局', content: <>
        <DocsSlider label={zh ? '段数' : 'Segments'} min={2} max={24} value={segmentCount} onValueChange={setSegmentCount} />
        <DocsSlider label={zh ? '间距' : 'Gap'} min={0} max={12} value={segmentGap} onValueChange={setSegmentGap} unit="px" />
        <DocsSelect label={zh ? '部分格策略' : 'Partial cell'} value={partialSegment} onValueChange={next => setPartialSegment(next as ProgressPartialSegment)} options={[
          ['fractional', zh ? '按比例填充' : 'Fractional'],
          ['complete', zh ? '只显示完整格' : 'Complete cells'],
          ['next', zh ? '触及即填满' : 'Fill touched cell'],
        ]} />
      </> },
      { label: '状态', content: <>
        <Switch label={zh ? '阈值颜色' : 'Threshold colors'} checked={colored} onCheckedChange={setColored} />
        <Switch label={zh ? '未知进度' : 'Indeterminate'} checked={indeterminate} onCheckedChange={setIndeterminate} />
      </> },
    ]} />}>
      <div className="segmented-progress-examples__preview">
        <Progress
          aria-label={zh ? '发布进度' : 'Release progress'}
          max={max}
          partialSegment={partialSegment}
          segmentCount={segmentCount}
          segmentGap={segmentGap}
          shape="segmented"
          size={size}
          thresholds={colored ? thresholds : undefined}
          value={progressValue}
        >
          {({ percent }) => percent === null ? (zh ? '处理中' : 'Working') : `${Math.round(percent)}%`}
        </Progress>
      </div>
    </ComponentPlayground>

    <ComponentExample id="segmented-progress-partial-cell-policies" title={zh ? '部分格策略' : 'Partial-cell policies'} code={`<Progress shape="segmented" value={37} segmentCount={8} partialSegment="fractional" aria-label="Fractional" />
<Progress shape="segmented" value={37} segmentCount={8} partialSegment="complete" aria-label="Complete cells" />
<Progress shape="segmented" value={37} segmentCount={8} partialSegment="next" aria-label="Touched cell" />`}>
      <div className="segmented-progress-examples__stack">
        {(['fractional', 'complete', 'next'] as const).map(policy => <label key={policy}>
          <PencilText>{policy === 'fractional' ? (zh ? '按比例' : 'Fractional') : policy === 'complete' ? (zh ? '完整格' : 'Complete cells') : (zh ? '触及即填满' : 'Fill touched cell')}</PencilText>
          <Progress aria-label={policy} partialSegment={policy} segmentCount={8} shape="segmented" value={37} />
        </label>)}
      </div>
    </ComponentExample>

    <ComponentExample id="segmented-progress-threshold-and-per-cell-colors" title={zh ? '阈值与逐格颜色' : 'Threshold and per-cell colors'} code={`<Progress shape="segmented" value={82} segmentCount={10}
  thresholds={thresholds} aria-label="Health" />
<Progress shape="segmented" value={7} max={12} segmentCount={12}
  segmentColors={['#d59a8f', '#d59a8f', '#d7bd72', '#d7bd72', '#86ad91']}
  aria-label="Milestones" />`}>
      <div className="segmented-progress-examples__stack">
        <Progress aria-label={zh ? '健康度' : 'Health'} segmentCount={10} shape="segmented" thresholds={thresholds} value={82}>82%</Progress>
        <Progress aria-label={zh ? '里程碑' : 'Milestones'} max={12} segmentColors={['#d59a8f', '#d59a8f', '#d7bd72', '#d7bd72', '#86ad91', '#86ad91', '#7ba8b6']} segmentCount={12} shape="segmented" value={7}>7 / 12</Progress>
      </div>
    </ComponentExample>

    <ComponentExample id="segmented-progress-boundary-states" title={zh ? '边界状态' : 'Boundary states'} code={`<Progress shape="segmented" value={0} segmentCount={6} aria-label="Empty" />
<Progress shape="segmented" value={5} max={5} segmentCount={6} aria-label="Complete" />
<Progress shape="segmented" value={null} segmentCount={6} aria-label="Loading" />`}>
      <div className="segmented-progress-examples__boundaries">
        <Progress aria-label={zh ? '空进度' : 'Empty'} segmentCount={6} shape="segmented" value={0}>0%</Progress>
        <Progress aria-label={zh ? '已完成' : 'Complete'} max={5} segmentCount={6} shape="segmented" value={5}>100%</Progress>
        <Progress aria-label={zh ? '加载中' : 'Loading'} segmentCount={6} shape="segmented" value={null}>{zh ? '加载中' : 'Loading'}</Progress>
      </div>
    </ComponentExample>
  </div>;
}
