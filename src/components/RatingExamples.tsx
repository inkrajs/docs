import { useState } from 'react';
import { Button, normalizeRatingValue, PencilIcon, Rating, Switch } from '@inkra/react';
import type { RatingClearStrategy, RatingSize } from '@inkra/react';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import { PencilText, useLocale } from '../i18n';
import './RatingExamples.css';

const bookmarkPaths = [
  { d: 'M6 3.5 H18 V21 L12 16.5 L6 21 Z' },
  { d: 'M9 8 H15', mode: 'scuff' as const },
];

export function RatingExamples() {
  const { locale, t } = useLocale();
  const text = locale === 'en' ? {
    count: 'Count', step: 'Step', direction: 'Reading direction', clear: 'Clear strategy',
    clearBoth: 'Reselect or keyboard', clearReselect: 'Reselect only', clearKeyboard: 'Keyboard only', clearNever: 'Not clearable',
    quality: 'Drawing quality', value: 'Current value', uncontrolled: 'Uncontrolled and read only',
    difficulty: 'Difficulty', completion: 'Completion', custom: 'Custom symbol', priority: 'Bookmark priority',
  } : {
    count: '总数', step: '步进', direction: '阅读方向', clear: '清除策略',
    clearBoth: '重复选择或键盘', clearReselect: '仅重复选择', clearKeyboard: '仅键盘', clearNever: '不可清除',
    quality: '绘图质量', value: '当前值', uncontrolled: '非受控与只读',
    difficulty: '难度', completion: '完成度', custom: '自定义符号', priority: '收藏优先级',
  };
  const [value, setValue] = useState(3.5);
  const [count, setCount] = useState(5);
  const [step, setStep] = useState(0.5);
  const [size, setSize] = useState<RatingSize>('md');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [clearable, setClearable] = useState<RatingClearStrategy>(true);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(true);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const zh = locale === 'zh-CN';
  const code = `const [value, setValue] = useState(${value});

<Rating aria-label="${text.quality}" value={value} onValueChange={setValue}
  count={${count}} step={${step}} size="${size}" dir="${dir}"
  clearable={${JSON.stringify(clearable)}} readOnly={${readOnly}} disabled={${disabled}}
  hoverPreview={${hoverPreview}}
  getValueLabel={(value, count) => \`${'${value} / ${count}'}\`} />`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text.count} value={String(count)} onValueChange={(next) => {
          const nextCount = Number(next);
          setCount(nextCount);
          setValue(current => normalizeRatingValue(current, nextCount, step));
        }} options={[["3", "3"], ["5", "5"], ["7", "7"]]} />
        <DocsSelect label={text.step} value={String(step)} onValueChange={(next) => {
          const nextStep = Number(next);
          setStep(nextStep);
          setValue(current => normalizeRatingValue(current, count, nextStep));
        }} options={[["0.5", "0.5"], ["1", "1"], ["1.5", "1.5"]]} />
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as RatingSize)} options={controlSizes} />
        <DocsSelect label={text.direction} value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
      </> },
      { label: '交互', content: <>
        <Switch label={zh ? '悬停预览' : 'Hover preview'} checked={hoverPreview} onCheckedChange={setHoverPreview} />
        <DocsSelect label={text.clear} value={String(clearable)} onValueChange={(next) => setClearable(next === 'true' ? true : next === 'false' ? false : next as RatingClearStrategy)} options={[["true", text.clearBoth], ["reselect", text.clearReselect], ["keyboard", text.clearKeyboard], ["false", text.clearNever]]} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <div className="rating-demo">
        <Rating
          aria-label={text.quality}
          value={value}
          onValueChange={setValue}
          count={count}
          step={step}
          size={size}
          dir={dir}
          clearable={clearable}
          readOnly={readOnly}
          disabled={disabled}
          hoverPreview={hoverPreview}
          getValueLabel={(nextValue, maximum) => `${nextValue} / ${maximum}`}
        />
      </div>
    </ComponentPlayground>
    <ComponentExample id="rating-form-submission-and-reset" title={zh ? '表单提交与重置' : 'Form submission and reset'} code={`<form onSubmit={event => {
  event.preventDefault();
  setSubmitted(String(new FormData(event.currentTarget).get('quality')));
}}>
  <Rating aria-label="${text.quality}" name="quality" defaultValue={2.5} step={0.5} />
  <Button type="submit">${zh ? '提交' : 'Submit'}</Button>
  <Button type="reset">${zh ? '重置' : 'Reset'}</Button>
</form>`}>
      <form className="rating-example-list" onSubmit={event => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('quality')));
      }} onReset={() => setSubmitted(null)}>
        <Rating aria-label={text.quality} name="quality" defaultValue={2.5} step={0.5} getValueLabel={(next, max) => `${next} / ${max}`} />
        <Button type="submit">{zh ? '提交' : 'Submit'}</Button>
        <Button type="reset" variant="outline">{zh ? '重置' : 'Reset'}</Button>
        <output aria-live="polite"><PencilText>{`${zh ? '已提交' : 'Submitted'}: ${submitted ?? '-'}`}</PencilText></output>
      </form>
    </ComponentExample>

    <ComponentExample id="rating-uncontrolled" title={text.uncontrolled} code={`<Rating aria-label="${text.difficulty}" defaultValue={2} count={4} />\n<Rating aria-label="${text.completion}" defaultValue={3.5} step={0.5} readOnly />`}>
      <div className="rating-example-list">
        <Rating aria-label={text.difficulty} defaultValue={2} count={4} />
        <Rating aria-label={text.completion} defaultValue={3.5} step={0.5} readOnly />
      </div>
    </ComponentExample>

    <ComponentExample id="rating-custom" title={text.custom} code={`<Rating aria-label="${text.priority}" defaultValue={2} count={4}
  renderSymbol={({ filled, index }) => (
    <PencilIcon paths={bookmarkPaths} sourceSize={24} size={32}
      active={filled} seed={\`bookmark-\${index}\`} />
  )} />`}>
      <Rating
        aria-label={text.priority}
        defaultValue={2}
        count={4}
        renderSymbol={({ filled, index }) => <PencilIcon paths={bookmarkPaths} sourceSize={24} size={32} active={filled} seed={`bookmark-${index}`} />}
      />
    </ComponentExample>
  </>;
}
