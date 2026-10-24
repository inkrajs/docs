import { useState } from 'react';
import { Button, RangeSlider, Switch } from '@inkra/react';
import type { RangeSliderValue, SliderSize, SliderVariant } from '@inkra/react';

import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './RangeSliderExamples.css';

export function RangeSliderExamples() {
  const { locale, t } = useLocale();
  const copy = locale === 'en' ? {
    allowCross: 'Allow crossing',
    appearance: 'Appearance',
    crossingLabels: ['Lower value', 'Higher value'] as [string, string],
    direction: 'Text direction',
    endpointRules: 'Endpoint rules',
    inset: 'Inset',
    labels: ['Minimum price', 'Maximum price'] as [string, string],
    minimumDistance: 'Minimum distance',
    rtlDisabled: 'RTL and disabled',
    size: 'Size',
    standard: 'Standard',
    step: 'Step',
    valueLabels: ['Minimum value', 'Maximum value'] as [string, string],
  } : {
    allowCross: '允许端点交叉',
    appearance: '外观',
    crossingLabels: ['较低值', '较高值'] as [string, string],
    direction: '阅读方向',
    endpointRules: '端点规则',
    inset: '内嵌滑块',
    labels: ['最低价格', '最高价格'] as [string, string],
    minimumDistance: '最小间距',
    rtlDisabled: 'RTL 与禁用',
    size: '尺寸',
    standard: '标准滑块',
    step: '步长',
    valueLabels: ['最低值', '最高值'] as [string, string],
  };
  const [value, setValue] = useState<RangeSliderValue>([20, 80]);
  const [step, setStep] = useState(5);
  const [minDistance, setMinDistance] = useState(10);
  const [allowCross, setAllowCross] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [size, setSize] = useState<SliderSize>('md');
  const [variant, setVariant] = useState<SliderVariant>('standard');
  const [formResult, setFormResult] = useState('');
  const labels = copy.labels;
  const code = `const [value, setValue] = useState<[number, number]>(${JSON.stringify(value)});

<RangeSlider
  value={value}
  onValueChange={setValue}
  min={0}
  max={100}
  step={${step}}
  minDistance={${minDistance}}
  allowCross={${allowCross}}
  thumbLabels={${JSON.stringify(labels)}}
  getValueLabel={value => '$' + value}
  variant="${variant}"
  size="${size}"
  dir="${dir}"
  disabled={${disabled}}
/>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={copy.appearance} value={variant} onValueChange={next => setVariant(next as SliderVariant)} options={[["standard", copy.standard], ["inset", copy.inset]]} />
        <DocsSelect label={copy.size} value={size} onValueChange={next => setSize(next as SliderSize)} options={controlSizes} />
        <DocsSelect label={copy.direction} value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label={copy.step} value={String(step)} onValueChange={next => { setStep(Number(next)); setValue([20, 80]); }} options={[["1", "1"], ["5", "5"], ["10", "10"]]} />
        <DocsSelect label={copy.minimumDistance} value={String(minDistance)} onValueChange={next => { setMinDistance(Number(next)); setValue([20, 80]); }} options={[["0", "0"], ["10", "10"], ["20", "20"]]} />
        <Switch label={copy.allowCross} checked={allowCross} onCheckedChange={next => { setAllowCross(next); setMinDistance(0); setValue([20, 80]); }} />
      </> },
      { label: '状态', content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="range-slider-demo">
        <RangeSlider value={value} onValueChange={setValue} min={0} max={100} step={step} minDistance={minDistance} allowCross={allowCross} thumbLabels={labels} getValueLabel={number => `$${number}`} variant={variant} size={size} dir={dir} disabled={disabled} />
      </div>
    </ComponentPlayground>

    <ComponentExample title={copy.endpointRules} code={`<RangeSlider defaultValue={[20, 80]} minDistance={20} />\n<RangeSlider defaultValue={[20, 80]} allowCross thumbLabels={${JSON.stringify(copy.crossingLabels)}} />`}>
      <div className="range-slider-examples__stack">
        <RangeSlider defaultValue={[20, 80]} minDistance={20} thumbLabels={copy.valueLabels} />
        <RangeSlider defaultValue={[20, 80]} allowCross thumbLabels={copy.crossingLabels} />
      </div>
    </ComponentExample>

    <ComponentExample title={t('表单与重置')} code={`const [result, setResult] = useState('');

<form onSubmit={event => {
  event.preventDefault();
  setResult(new FormData(event.currentTarget).getAll('price[]').join(' - '));
}} onReset={() => setResult('')}>
  <RangeSlider name="price" defaultValue={[20, 80]} step={5} minDistance={10}
    thumbLabels={${JSON.stringify(labels)}} getValueLabel={value => '$' + value} />
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{result}</output>
</form>`}>
      <form className="range-slider-examples__stack" data-testid="range-slider-form" onSubmit={event => {
        event.preventDefault();
        setFormResult(new FormData(event.currentTarget).getAll('price[]').join(' - '));
      }} onReset={() => setFormResult('')}>
        <RangeSlider name="price" defaultValue={[20, 80]} step={5} minDistance={10}
          thumbLabels={labels} getValueLabel={number => `$${number}`} />
        <div className="component-demo-row">
          <Button type="submit">{t('读取表单')}</Button>
          <Button type="reset" variant="secondary">{t('重置')}</Button>
        </div>
        <output className="component-demo-status" aria-live="polite"><PencilText>{formResult}</PencilText></output>
      </form>
    </ComponentExample>

    <ComponentExample title={copy.rtlDisabled} code={`<RangeSlider dir="rtl" defaultValue={[25, 75]} thumbLabels={${JSON.stringify(copy.valueLabels)}} />\n<RangeSlider defaultValue={[30, 70]} disabled thumbLabels={${JSON.stringify(copy.valueLabels)}} />`}>
      <div className="range-slider-examples__stack">
        <RangeSlider dir="rtl" defaultValue={[25, 75]} thumbLabels={copy.valueLabels} />
        <RangeSlider defaultValue={[30, 70]} disabled thumbLabels={copy.valueLabels} />
      </div>
    </ComponentExample>
  </>;
}
