import { useState } from 'react';
import { Button, ColorPicker, Switch } from '@inkra/react';
import type { ColorValue } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './ColorPickerExamples.css';

const presets = [
  { value: '#4b96aaff', label: 'Ocean' },
  { value: '#629568ff', label: 'Pine' },
  { value: '#994f3fff', label: 'Cinnabar' },
  { value: '#e6c17b99', label: 'Amber 60%' },
];

export function ColorPickerExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState<ColorValue>('#4b96aacc');
  const [showAlpha, setShowAlpha] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [controlled, setControlled] = useState(true);
  const [source, setSource] = useState('');
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
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
          value={value}
          onValueChange={(next, details) => { setValue(next); setSource(details.source); }}
        /> : <ColorPicker
          defaultValue="#4b96aacc"
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
        />}
        <output className="color-picker-demo__status" aria-live="polite">
          {controlled ? `${value}${source ? ` · ${source}` : ''}` : t('组件内部管理颜色值')}
        </output>
      </div>
    </ComponentPlayground>
    <ComponentExample title="表单与自定义预设" code={`<form onSubmit={readForm}>
  <ColorPicker name="accent" label="${t('强调色')}" defaultValue="#629568bf"
    presets={[{ value: '#629568', label: 'Pine' }, { value: '#994f3f80', label: 'Cinnabar 50%' }]} />
  <Button type="submit">${t('读取表单')}</Button>
</form>`}>
      <form className="color-picker-demo__form" onSubmit={event => {
        event.preventDefault();
        const formValue = new FormData(event.currentTarget).get('accent');
        setSource(`${t('表单值')}: ${String(formValue)}`);
      }}>
        <ColorPicker name="accent" label={t('强调色')} labels={labels} defaultValue="#629568bf" presets={presets.slice(1, 3)} />
        <Button type="submit">{t('读取表单')}</Button>
      </form>
    </ComponentExample>
  </>;
}
