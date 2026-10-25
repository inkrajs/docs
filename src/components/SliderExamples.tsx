import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Button, Slider, Switch } from '@inkra/react';
import type { SliderSize, SliderVariant } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import './SliderExamples.css';

export function SliderExamples() {
  const { t } = useLocale();
  const [values, setValues] = useState([40]);
  const [range, setRange] = useState(false);
  const [size, setSize] = useState<SliderSize>('md');
  const [variant, setVariant] = useState<SliderVariant>('standard');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [step, setStep] = useState(1);
  const [minSteps, setMinSteps] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [formResult, setFormResult] = useState('');
  const thumbLabels = range ? [t('下限'), t('上限')] : [t('数值')];
  const code = `const [values, setValues] = useState(${JSON.stringify(values)});

<Slider value={values} onValueChange={setValues}
  min={0} max={100} step={${step}} minStepsBetweenThumbs={${minSteps}} preserveThumbOrder
  size="${size}" variant="${variant}" orientation="${orientation}" dir="${dir}" inverted={${inverted}} disabled={${disabled}}
  thumbLabels={${JSON.stringify(thumbLabels)}} getValueLabel={value => value + '%'} />`;
  const formCode = `const [result, setResult] = useState('');

<form onSubmit={event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  setResult(JSON.stringify({ level: data.get('level'), range: data.getAll('range[]') }));
}} onReset={() => setResult('')}>
  <Slider aria-label="${t('音量')}" name="level" defaultValue={[25]} getValueLabel={value => value + '%'} />
  <Slider name="range" defaultValue={[20, 80]} thumbLabels={['${t('下限')}', '${t('上限')}']}
    step={5} minStepsBetweenThumbs={2} preserveThumbOrder />
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{result}</output>
</form>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="外观" value={variant} onValueChange={next => setVariant(next as SliderVariant)} options={[["standard", "标准滑块"], ["inset", "内嵌滑块"]]} />
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as SliderSize)} options={controlSizes} />
        <DocsSelect label="排列" value={orientation} onValueChange={next => setOrientation(next as typeof orientation)} options={[["horizontal", "横向"], ["vertical", "纵向"]]} />
        <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label="步长" value={String(step)} onValueChange={next => { setStep(Number(next)); setValues(range ? [20, 80] : [40]); }} options={[["1", "1"], ["5", "5"], ["10", "10"]]} />
        <DocsSelect label="最小间隔步数" value={String(minSteps)} onValueChange={next => setMinSteps(Number(next))} options={[["0", "0"], ["1", "1"], ["2", "2"]]} />
        <Switch label={t('范围选择')} checked={range} onCheckedChange={next => { setRange(next); setValues(next ? [20, 80] : [40]); }} />
        <Switch label={t('反向')} checked={inverted} onCheckedChange={setInverted} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <div className="slider-demo" data-orientation={orientation}>
        <Slider value={values} onValueChange={setValues} min={0} max={100} step={step} minStepsBetweenThumbs={minSteps} preserveThumbOrder size={size} variant={variant} orientation={orientation} dir={dir} inverted={inverted} disabled={disabled} thumbLabels={thumbLabels} getValueLabel={number => `${number}%`} />
      </div>
    </ComponentPlayground>
    <ComponentExample id="slider-inset-thumb" title="内嵌滑块" code={`<Slider variant="inset" size="sm" aria-label="${t('音量')}" defaultValue={[40]} />\n<Slider variant="inset" thumbLabels={['${t('下限')}', '${t('上限')}']} defaultValue={[20, 80]} preserveThumbOrder />\n<Slider variant="inset" size="lg" aria-label="${t('音量')}" defaultValue={[60]} />`}>
      <div className="component-demo-form"><Slider variant="inset" size="sm" aria-label={t('音量')} defaultValue={[40]} /><Slider variant="inset" thumbLabels={[t('下限'), t('上限')]} defaultValue={[20, 80]} preserveThumbOrder /><Slider variant="inset" size="lg" aria-label={t('音量')} defaultValue={[60]} /></div>
    </ComponentExample>
    <ComponentExample id="slider-form-and-reset" title="表单与重置" code={formCode}>
      <form className="component-demo-form" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setFormResult(JSON.stringify({ level: data.get('level'), range: data.getAll('range[]') }));
      }} onReset={() => setFormResult('')}>
        <div><PencilText>音量</PencilText><Slider aria-label={t('音量')} name="level" defaultValue={[25]} getValueLabel={value => `${value}%`} /></div>
        <div><PencilText>范围选择</PencilText><Slider name="range" defaultValue={[20, 80]} thumbLabels={[t('下限'), t('上限')]} step={5} minStepsBetweenThumbs={2} preserveThumbOrder /></div>
        <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{formResult}</output>
      </form>
    </ComponentExample>
    <ComponentExample id="slider-disabled" title="禁用" code={`<Slider aria-label="${t('音量')}" defaultValue={[60]} disabled />\n<Slider thumbLabels={['${t('下限')}', '${t('上限')}']} defaultValue={[20, 80]} disabled />`}>
      <div className="component-demo-form"><Slider aria-label={t('音量')} defaultValue={[60]} disabled /><Slider thumbLabels={[t('下限'), t('上限')]} defaultValue={[20, 80]} disabled /></div>
    </ComponentExample>
  </>;
}
