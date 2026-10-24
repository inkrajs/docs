import { useState } from 'react';
import { Button, ColorPicker, PencilText, Switch } from '@inkra/react';
import type { ColorPickerChangeDetails, ColorValue } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './ColorPickerExamples.css';

const presetMessages = [
  { value: '#4b96aaff', label: '海蓝' },
  { value: '#629568ff', label: '松绿' },
  { value: '#994f3fff', label: '朱砂' },
  { value: '#e6c17b99', label: '琥珀 60%' },
];

export function ColorPickerExamples() {
  const { t, locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'zh-CN' ? zh : en;
  const presets = presetMessages.map(preset => ({ ...preset, label: t(preset.label) }));
  const [value, setValue] = useState<ColorValue>('#4b96aacc');
  const [showAlpha, setShowAlpha] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [controlled, setControlled] = useState(true);
  const [source, setSource] = useState<ColorPickerChangeDetails['source'] | ''>('');
  const [formValue, setFormValue] = useState('');
  const sourceLabels = {
    palette: text('调色板', 'Palette'), alpha: t('透明度'),
    input: text('输入', 'Input'), preset: text('预设', 'Preset'),
  };
  const labels = {
    palette: t('打开颜色面板'),
    value: t('颜色值'),
    alpha: t('透明度'),
    presets: t('颜色预设'),
    invalid: t('请输入 #RGB、#RGBA、#RRGGBB 或 #RRGGBBAA'),
  };
  const code = controlled
    ? `const [color, setColor] = useState('${value}');

<ColorPicker
  label="${t('品牌色')}"
  value={color}
  onValueChange={(next, details) => setColor(next)}
  showAlpha={${showAlpha}}
  presets={${showPresets ? 'presets' : '[]'}}
  disabled={${disabled}}
  labels={localizedLabels}
/>
<output>{color}</output>`
    : `<ColorPicker
  label="${t('品牌色')}"
  defaultValue="#4b96aacc"
  showAlpha={${showAlpha}}
  presets={${showPresets ? 'presets' : '[]'}}
  disabled={${disabled}}
  labels={localizedLabels}
/>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={t('受控')} checked={controlled} onCheckedChange={setControlled} />
        <Switch label={t('显示透明度')} checked={showAlpha} onCheckedChange={setShowAlpha} />
        <Switch label={t('显示预设')} checked={showPresets} onCheckedChange={setShowPresets} />
      </> },
      { label: '状态', content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="color-picker-demo">
        {controlled ? <ColorPicker
          key="controlled"
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
          value={value}
          onValueChange={(next, details) => { setValue(next); setSource(details.source); }}
        /> : <ColorPicker
          key="uncontrolled"
          defaultValue="#4b96aacc"
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
        />}
        <output className="color-picker-demo__status" aria-live="polite">
          <PencilText>{controlled ? `${value}${source ? ` · ${sourceLabels[source]}` : ''}` : t('组件内部管理颜色值')}</PencilText>
        </output>
      </div>
    </ComponentPlayground>
    <ComponentExample title="表单与自定义预设" code={`<form onSubmit={readForm}>
  <ColorPicker name="accent" label="${t('强调色')}" defaultValue="#629568bf"
    presets={${JSON.stringify(presets.slice(1, 3))}} labels={localizedLabels} />
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
</form>`}>
      <form className="color-picker-demo__form" onReset={() => setFormValue('')} onSubmit={event => {
        event.preventDefault();
        const formValue = new FormData(event.currentTarget).get('accent');
        setFormValue(String(formValue));
      }}>
        <ColorPicker name="accent" label={t('强调色')} labels={labels} defaultValue="#629568bf" presets={presets.slice(1, 3)} />
        <div className="component-demo-row">
          <Button type="submit">{t('读取表单')}</Button>
          <Button type="reset" variant="secondary">{t('重置')}</Button>
        </div>
        <output aria-live="polite" className="color-picker-demo__status">
          <PencilText>{formValue ? `${t('表单值')}: ${formValue}` : text('尚未读取表单', 'Form not read yet')}</PencilText>
        </output>
      </form>
    </ComponentExample>
  </>;
}
