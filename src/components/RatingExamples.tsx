import { useState } from 'react';
import { PencilIcon, Rating, Switch } from '@inkra/react';
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
  const code = `const [value, setValue] = useState(${value});

<Rating aria-label="${text.quality}" value={value} onValueChange={setValue}
  count={${count}} step={${step}} size="${size}" dir="${dir}"
  clearable={${JSON.stringify(clearable)}} readOnly={${readOnly}} disabled={${disabled}}
  getValueLabel={(value, count) => \`${'${value} / ${count}'}\`} />`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text.count} value={String(count)} onValueChange={(next) => {
          const nextCount = Number(next);
          setCount(nextCount);
          setValue(current => Math.min(current, nextCount));
        }} options={[["3", "3"], ["5", "5"], ["7", "7"]]} />
        <DocsSelect label={text.step} value={String(step)} onValueChange={(next) => {
          const nextStep = Number(next);
          setStep(nextStep);
          setValue(current => Math.round(current / nextStep) * nextStep);
        }} options={[["0.5", "0.5"], ["1", "1"]]} />
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as RatingSize)} options={controlSizes} />
        <DocsSelect label={text.direction} value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
      </> },
      { label: '交互', content: <>
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
          getValueLabel={(nextValue, maximum) => `${nextValue} / ${maximum}`}
        />
        <output className="rating-demo__value" aria-live="polite"><PencilText>{text.value}</PencilText>: {value} / {count}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text.uncontrolled} code={`<Rating aria-label="${text.difficulty}" defaultValue={2} count={4} />\n<Rating aria-label="${text.completion}" defaultValue={3.5} step={0.5} readOnly />`}>
      <div className="rating-example-list">
        <Rating aria-label={text.difficulty} defaultValue={2} count={4} />
        <Rating aria-label={text.completion} defaultValue={3.5} step={0.5} readOnly />
      </div>
    </ComponentExample>

    <ComponentExample title={text.custom} code={`<Rating aria-label="${text.priority}" defaultValue={2} count={4}
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
