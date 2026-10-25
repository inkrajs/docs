import { useState } from 'react';
import { Button, ChoiceGrid, ChoiceGridOption, Switch } from '@inkra/react';
import { __iconData as alignJustifyIcon } from 'lucide-react/dist/esm/icons/text-align-justify.mjs';
import { __iconData as grid2x2Icon } from 'lucide-react/dist/esm/icons/grid-2x2.mjs';
import { __iconData as rows3Icon } from 'lucide-react/dist/esm/icons/rows-3.mjs';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './ChoiceGridExamples.css';

const quote = (value: string) => JSON.stringify(value);

export function ChoiceGridExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(3);
  const [singleValue, setSingleValue] = useState('balanced');
  const [multipleValues, setMultipleValues] = useState<string[]>(['balanced']);
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);
  const [formResult, setFormResult] = useState('');
  const optionCopy = [
    ['compact', text('紧凑', 'Compact'), text('在有限空间内显示更多选项。', 'Fit more choices into limited space.')],
    ['balanced', text('平衡', 'Balanced'), text('兼顾信息密度与浏览节奏。', 'Balance information density and scanning.')],
    ['spacious', text('宽松', 'Spacious'), text('为图像与说明保留更多空间。', 'Leave more room for imagery and descriptions.')],
  ] as const;
  const optionsCode = `  <ChoiceGridOption value="compact" label=${quote(optionCopy[0][1])} icon={<RowsIcon />} description=${quote(optionCopy[0][2])} />
  <ChoiceGridOption value="balanced" label=${quote(optionCopy[1][1])} icon={<GridIcon />} description=${quote(optionCopy[1][2])} />
  <ChoiceGridOption value="spacious" label=${quote(optionCopy[2][1])} image={{ src: '/favicon.png' }} description=${quote(optionCopy[2][2])} />`;
  const code = mode === 'single'
    ? `<ChoiceGrid
  name="choice-grid-density"
  label=${quote(text('布局密度', 'Layout density'))}
  value=${quote(singleValue)}
  onValueChange={setValue}
  columns={${columns}}
  disabled={${disabled}}${showError ? `
  error=${quote(text('请确认当前选择。', 'Review the current choice.'))}` : ''}
>
${optionsCode}
</ChoiceGrid>`
    : `<ChoiceGrid
  type="multiple"
  name="choice-grid-layouts"
  label=${quote(text('可用布局', 'Available layouts'))}
  values={${JSON.stringify(multipleValues)}}
  onValuesChange={setValues}
  columns={${columns}}
  disabled={${disabled}}${showError && multipleValues.length === 0 ? `
  error=${quote(text('至少保留一个选项。', 'Keep at least one choice.'))}` : ''}
>
${optionsCode}
</ChoiceGrid>`;
  const options = optionCopy.map(([value, label, description], index) => (
    <ChoiceGridOption
      description={description}
      icon={index === 0
        ? <DocsIcon data={rows3Icon} size={40} />
        : index === 1 ? <DocsIcon data={grid2x2Icon} size={40} /> : undefined}
      image={index === 2 ? { src: '/favicon.png', width: 96, height: 96 } : undefined}
      key={value}
      label={label}
      value={value}
    />
  ));

  return <div className="choice-grid-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('基础', 'Basics'), content: <>
        <DocsSelect label={text('选择模式', 'Selection mode')} value={mode} onValueChange={value => setMode(value as typeof mode)} options={[
          ['single', text('单选', 'Single')],
          ['multiple', text('多选', 'Multiple')],
        ]} />
        <DocsSelect label={text('桌面列数', 'Desktop columns')} value={String(columns)} onValueChange={value => setColumns(Number(value) as typeof columns)} options={[
          ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
        ]} />
      </> },
      { label: text('状态', 'State'), content: <>
        <Switch label={text('禁用整组', 'Disable group')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={text('显示错误', 'Show error')} checked={showError} onCheckedChange={setShowError} />
      </> },
    ]} />}>
      {mode === 'single' ? (
        <ChoiceGrid
          columns={columns}
          disabled={disabled}
          error={showError ? text('请确认当前选择。', 'Review the current choice.') : undefined}
          label={text('布局密度', 'Layout density')}
          name="choice-grid-density"
          onValueChange={setSingleValue}
          value={singleValue}
        >
          {options}
        </ChoiceGrid>
      ) : (
        <ChoiceGrid
          columns={columns}
          disabled={disabled}
          error={showError && multipleValues.length === 0 ? text('至少保留一个选项。', 'Keep at least one choice.') : undefined}
          label={text('可用布局', 'Available layouts')}
          name="choice-grid-layouts"
          onValuesChange={setMultipleValues}
          type="multiple"
          values={multipleValues}
        >
          {options}
        </ChoiceGrid>
      )}
    </ComponentPlayground>

    <ComponentExample id="choice-grid-native-defaults" title={text('原生默认值', 'Native defaults')} code={`<form onSubmit={event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  setResult({ format: data.get('choice-grid-format'), sections: data.getAll('choice-grid-sections') });
}}>
<ChoiceGrid name="choice-grid-format" label=${quote(text('输出形式', 'Output format'))} defaultValue="summary" minItemWidth="9rem">
  <ChoiceGridOption value="summary" label=${quote(text('摘要', 'Summary'))} icon={<TextIcon />} />
  <ChoiceGridOption value="visual" label=${quote(text('图文', 'Visual'))} image={{ src: '/favicon-dark.png', width: 96, height: 96 }} />
</ChoiceGrid>

<ChoiceGrid type="multiple" name="choice-grid-sections" label=${quote(text('包含内容', 'Included sections'))} defaultValues={['notes', 'history']} minItemWidth="9rem">
  <ChoiceGridOption value="notes" label=${quote(text('备注', 'Notes'))} />
  <ChoiceGridOption value="metadata" label=${quote(text('元数据', 'Metadata'))} />
  <ChoiceGridOption value="history" label=${quote(text('历史（禁用）', 'History (disabled)'))} disabled />
</ChoiceGrid>
<Button type="submit">${text('读取表单', 'Read form')}</Button>
<Button type="reset">${text('重置', 'Reset')}</Button>
</form>`}>
      <form className="choice-grid-examples__pair choice-grid-native-form" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setFormResult(JSON.stringify({ format: data.get('choice-grid-format'), sections: data.getAll('choice-grid-sections') }));
      }} onReset={() => setFormResult('')}>
        <ChoiceGrid defaultValue="summary" label={text('输出形式', 'Output format')} minItemWidth="9rem" name="choice-grid-format">
          <ChoiceGridOption icon={<DocsIcon data={alignJustifyIcon} size={40} />} label={text('摘要', 'Summary')} value="summary" />
          <ChoiceGridOption image={{ src: '/favicon-dark.png', width: 96, height: 96 }} label={text('图文', 'Visual')} value="visual" />
        </ChoiceGrid>
        <ChoiceGrid defaultValues={['notes', 'history']} label={text('包含内容', 'Included sections')} minItemWidth="9rem" name="choice-grid-sections" type="multiple">
          <ChoiceGridOption label={text('备注', 'Notes')} value="notes" />
          <ChoiceGridOption label={text('元数据', 'Metadata')} value="metadata" />
          <ChoiceGridOption disabled label={text('历史（禁用）', 'History (disabled)')} value="history" />
        </ChoiceGrid>
        <div className="component-demo-row"><Button type="submit">{text('读取表单', 'Read form')}</Button><Button type="reset" variant="secondary">{text('重置', 'Reset')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{formResult}</output>
      </form>
    </ComponentExample>
  </div>;
}
