import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Button, Field, InputNumber, Switch } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import './InputExamples.css';

const quote = (value: string) => JSON.stringify(value);

function ResetExample() {
  const { t } = useLocale();
  const [value, setValue] = useState<number | null>(2);
  const [status, setStatus] = useState('');
  const code = `const [value, setValue] = useState<number | null>(2);
const [status, setStatus] = useState('');

<form onReset={() => { setValue(2); setStatus(''); }} onSubmit={event => {
  event.preventDefault();
  setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
}}>
  <Field label=${quote(t('受控输入'))}>
    <InputNumber name="controlled" value={value} onValueChange={setValue}
      min={0} max={10}
      incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} />
  </Field>
  <Field label=${quote(t('非受控输入'))}>
    <InputNumber name="uncontrolled" defaultValue={3} min={0} max={10}
      incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} />
  </Field>
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{status}</output>
</form>`;
  return <ComponentExample title="表单重置" code={code}>
    <form className="component-demo-form" onReset={() => { setValue(2); setStatus(''); }} onSubmit={event => { event.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))); }}>
      <Field label={t('受控输入')}><InputNumber name="controlled" value={value} onValueChange={setValue} min={0} max={10} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
      <Field label={t('非受控输入')}><InputNumber name="uncontrolled" defaultValue={3} min={0} max={10} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
      <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
      <output className="component-demo-status input-examples__status" aria-live="polite">{status}</output>
    </form>
  </ComponentExample>;
}

export function InputNumberExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState<number | null>(2);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [variant, setVariant] = useState<'underline' | 'outline' | 'soft' | 'ghost'>('underline');
  const [step, setStep] = useState('1');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('100');
  const [controls, setControls] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [required, setRequired] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const [suffix, setSuffix] = useState(false);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [textAlign, setTextAlign] = useState<'start' | 'center' | 'end'>('center');
  const [shiftStep, setShiftStep] = useState('10');
  const [altStep, setAltStep] = useState('0.1');
  const [chordStep, setChordStep] = useState('100');
  const [pressAndHold, setPressAndHold] = useState(true);
  const [repeatDelay, setRepeatDelay] = useState('400');
  const [repeatInterval, setRepeatInterval] = useState('80');
  const stepModifiers = [
    ...(shiftStep !== 'none' ? [{ shiftKey: true, step: Number(shiftStep) }] : []),
    ...(altStep !== 'none' ? [{ altKey: true, step: Number(altStep) }] : []),
    ...(chordStep !== 'none' ? [{ ctrlKey: true, shiftKey: true, step: Number(chordStep) }] : []),
  ];
  const code = `const [value, setValue] = useState<number | null>(${JSON.stringify(value)});

<Field label=${quote(t('数量'))}${required ? ' required' : ''}${invalid ? ` error=${quote(t('请输入范围内的数值'))}` : ''}>
  <InputNumber name="quantity" value={value} onValueChange={setValue}
    size="${size}" variant="${variant}" textAlign="${textAlign}" dir="${dir}"
    min={${min}} max={${max}} step={${step === 'any' ? '"any"' : step}}
    stepModifiers={${JSON.stringify(stepModifiers)}}
    pressAndHold={${pressAndHold}} repeatDelay={${repeatDelay}} repeatInterval={${repeatInterval}}
    controls={${controls}} fullWidth={${fullWidth}}${disabled ? '\n    disabled' : ''}${readOnly ? '\n    readOnly' : ''}${suffix ? '\n    suffix="kg"' : ''}
    incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))}
  />
</Field>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as typeof size)} options={controlSizes} />
        <DocsSelect label="外观" value={variant} onValueChange={next => setVariant(next as typeof variant)} options={[["underline", "下划线"], ["outline", "描边"], ["soft", "柔和铺色"], ["ghost", "无边框"]]} />
        <DocsSelect label="内容对齐" value={textAlign} onValueChange={next => setTextAlign(next as typeof textAlign)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
        <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
        <Switch label={t('单位后缀')} checked={suffix} onCheckedChange={setSuffix} />
        <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label="最小值" value={min} onValueChange={setMin} options={[["-10", "-10"], ["0", "0"], ["1", "1"]]} />
        <DocsSelect label="最大值" value={max} onValueChange={setMax} options={[["5", "5"], ["10", "10"], ["100", "100"]]} />
        <DocsSelect label="步长" value={step} onValueChange={setStep} options={[["1", "1"], ["0.1", "0.1"], ["0.25", "0.25"], ["5", "5"], ["any", "不限"]]} />
        <Switch label={t('步进按钮')} checked={controls} onCheckedChange={setControls} />
        <DocsSelect label="Shift 步长" value={shiftStep} onValueChange={setShiftStep} options={[["none", "不启用"], ["1", "1"], ["10", "10"], ["100", "100"]]} />
        <DocsSelect label="Alt 步长" value={altStep} onValueChange={setAltStep} options={[["none", "不启用"], ["0.1", "0.1"], ["0.5", "0.5"], ["5", "5"]]} />
        <DocsSelect label="Ctrl + Shift 步长" value={chordStep} onValueChange={setChordStep} options={[["none", "不启用"], ["10", "10"], ["100", "100"], ["1000", "1000"]]} />
        <Switch label={t('长按连续调整')} checked={pressAndHold} onCheckedChange={setPressAndHold} />
        <DocsSelect label="长按等待" value={repeatDelay} onValueChange={setRepeatDelay} options={['250', '400', '700'].map(ms => [ms, `${ms} ${t('毫秒')}`])} />
        <DocsSelect label="重复间隔" value={repeatInterval} onValueChange={setRepeatInterval} options={['40', '80', '150'].map(ms => [ms, `${ms} ${t('毫秒')}`])} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
        <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
      </> },
    ]} />}>
      <div className="component-demo-form">
        <Field label={t('数量')} required={required} error={invalid ? t('请输入范围内的数值') : undefined}>
          <InputNumber name="quantity" value={value} onValueChange={setValue} size={size} variant={variant} min={Number(min)} max={Number(max)} step={step === 'any' ? 'any' : Number(step)} stepModifiers={stepModifiers} pressAndHold={pressAndHold} repeatDelay={Number(repeatDelay)} repeatInterval={Number(repeatInterval)} controls={controls} disabled={disabled} readOnly={readOnly} fullWidth={fullWidth} dir={dir} textAlign={textAlign} suffix={suffix ? 'kg' : undefined} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} />
        </Field>
      </div>
    </ComponentPlayground>
    <ComponentExample title="组合键与长按" code={`<Field label=${quote(t('快捷调整'))}>\n  <InputNumber defaultValue={2} min={-1000} max={1000}\n    stepModifiers={[{ shiftKey: true, step: 10 }, { altKey: true, step: 0.1 }, { ctrlKey: true, shiftKey: true, step: 100 }]}\n    pressAndHold repeatDelay={400} repeatInterval={80}\n    incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} />\n</Field>`}>
      <div className="component-demo-form"><Field label={t('快捷调整')}><InputNumber defaultValue={2} min={-1000} max={1000} stepModifiers={[{ shiftKey: true, step: 10 }, { altKey: true, step: 0.1 }, { ctrlKey: true, shiftKey: true, step: 100 }]} pressAndHold repeatDelay={400} repeatInterval={80} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field></div>
    </ComponentExample>
    <ComponentExample title="范围与步长" code={`<Field label=${quote(t('数量'))}><InputNumber defaultValue={0} min={0} max={5} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>\n<Field label=${quote(t('小数步长'))}><InputNumber defaultValue={1.25} min={0} max={3} step={0.25} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('数量')}><InputNumber defaultValue={0} min={0} max={5} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
        <Field label={t('小数步长')}><InputNumber defaultValue={1.25} min={0} max={3} step={0.25} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
      </div>
    </ComponentExample>
    <ComponentExample title="前缀与后缀" code={`<Field label=${quote(t('预算'))} description="NZD"><InputNumber prefix="NZ$" defaultValue={120} min={0} step={5} variant="outline" incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>\n<Field label=${quote(t('行李重量'))} description=${quote(t('单位：千克'))}><InputNumber suffix="kg" defaultValue={12.5} min={0} step={0.5} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('预算')} description="NZD"><InputNumber prefix="NZ$" defaultValue={120} min={0} step={5} variant="outline" incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
        <Field label={t('行李重量')} description={t('单位：千克')}><InputNumber suffix="kg" defaultValue={12.5} min={0} step={0.5} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
      </div>
    </ComponentExample>
    <ComponentExample title="任意小数" code={`<Field label=${quote(t('测量值'))}><InputNumber defaultValue={1.2345} step="any" controls={false} /></Field>`}>
      <div className="component-demo-form"><Field label={t('测量值')}><InputNumber defaultValue={1.2345} step="any" controls={false} /></Field></div>
    </ComponentExample>
    <ResetExample />
    <ComponentExample title="状态" code={`<Field label=${quote(t('只读'))} readOnly><InputNumber defaultValue={2} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>\n<Field label=${quote(t('禁用'))} disabled><InputNumber defaultValue={2} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>\n<Field label=${quote(t('数量'))} error=${quote(t('请输入范围内的数值'))}><InputNumber defaultValue={12} min={0} max={10} incrementButtonLabel=${quote(t('增加数量'))} decrementButtonLabel=${quote(t('减少数量'))} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('只读')} readOnly><InputNumber defaultValue={2} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
        <Field label={t('禁用')} disabled><InputNumber defaultValue={2} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
        <Field label={t('数量')} error={t('请输入范围内的数值')}><InputNumber defaultValue={12} min={0} max={10} incrementButtonLabel={t('增加数量')} decrementButtonLabel={t('减少数量')} /></Field>
      </div>
    </ComponentExample>
  </>;
}
