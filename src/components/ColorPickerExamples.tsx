import { useState } from 'react';
import { Button, ColorPicker, PencilText, Switch } from '@inkra/react';
import type { ColorPaint, ColorPickerPresentation, ColorValue } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import { DocsSelect } from './DocsSelect';
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
  const [presentation, setPresentation] = useState<ColorPickerPresentation>('inline');
  const [showAlpha, setShowAlpha] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [controlled, setControlled] = useState(true);
  const [formValue, setFormValue] = useState('');
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
  presentation="${presentation}"
  label="${t('品牌色')}"
  value={color}
  onValueChange={setColor}
  showAlpha={${showAlpha}}
  presets={${showPresets ? 'presets' : '[]'}}
  disabled={${disabled}}
  labels={localizedLabels}
/>`
    : `<ColorPicker
  presentation="${presentation}"
  label="${t('品牌色')}"
  defaultValue="#4b96aacc"
  showAlpha={${showAlpha}}
  presets={${showPresets ? 'presets' : '[]'}}
  disabled={${disabled}}
  labels={localizedLabels}
/>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <DocsSelect label={text('展示形式', 'Presentation')} value={presentation}
        onValueChange={next => setPresentation(next as ColorPickerPresentation)} options={[
          ['inline', text('完整面板', 'Full panel')], ['compact', text('紧凑布局', 'Compact layout')],
          ['popover', text('弹出面板', 'Popover')], ['swatches', text('仅色样', 'Swatches only')],
        ]} /> },
      { label: '交互', content: <>
        <Switch label={t('受控')} checked={controlled} onCheckedChange={setControlled} />
        <Switch label={t('显示透明度')} checked={showAlpha} onCheckedChange={setShowAlpha} />
        <Switch label={t('显示预设')} checked={showPresets} onCheckedChange={setShowPresets} />
      </> },
      { label: '状态', content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="color-picker-demo">
        {controlled ? <ColorPicker
          presentation={presentation}
          key="controlled"
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
          value={value}
          onValueChange={setValue}
        /> : <ColorPicker
          presentation={presentation}
          key="uncontrolled"
          defaultValue="#4b96aacc"
          disabled={disabled}
          label={t('品牌色')}
          labels={labels}
          presets={showPresets ? presets : []}
          showAlpha={showAlpha}
        />}
      </div>
    </ComponentPlayground>
    <ComponentExample id="color-picker-presentations" title={text('不同展示形式', 'Presentations')} code={`<ColorPicker presentation="compact" labels={localizedLabels} presets={presets} />
<ColorPicker presentation="popover" labels={localizedLabels} presets={presets} />
<ColorPicker presentation="swatches" labels={localizedLabels} presets={presets} />`}>
      <div className="color-picker-demo__presentations">
        <ColorPicker presentation="compact" label={text('紧凑布局', 'Compact layout')} labels={labels} presets={presets} defaultValue="#629568ff" />
        <ColorPicker presentation="popover" label={text('弹出面板', 'Popover')} labels={labels} presets={presets} defaultValue="#994f3fff" />
        <ColorPicker presentation="swatches" label={text('仅色样', 'Swatches only')} labels={labels} presets={presets} defaultValue="#4b96aaff" />
      </div>
    </ComponentExample>
    <GradientColorExample />
    <ComponentExample id="color-picker-form-and-custom-presets" title="表单与自定义预设" code={`<form onSubmit={readForm}>
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

function GradientColorExample() {
  const { t, locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'zh-CN' ? zh : en;
  const [value, setValue] = useState<ColorPaint>({ type: 'linear', angle: 90, stops: [
    { id: 'ocean', color: '#4b96aaff', position: 0 },
    { id: 'amber', color: '#e6c17b99', position: 100 },
  ] });
  const gradientLabels = {
    type: text('颜色类型', 'Color type'), solid: text('纯色', 'Solid'), linear: text('线性', 'Linear'),
    radial: text('径向', 'Radial'), conic: text('锥形', 'Conic'), preview: text('渐变预览', 'Gradient preview'),
    stops: text('色标', 'Color stops'), stop: text('色标', 'Stop'), stopColor: text('色标颜色', 'Stop color'),
    addStop: text('添加色标', 'Add stop'), removeStop: text('删除色标', 'Remove stop'),
    reverse: text('反转渐变', 'Reverse gradient'), position: text('色标位置', 'Stop position'),
    angle: text('角度', 'Angle'), centerX: text('水平中心', 'Center X'), centerY: text('垂直中心', 'Center Y'),
    shape: text('形状', 'Shape'), circle: text('圆形', 'Circle'), ellipse: text('椭圆', 'Ellipse'),
    extent: text('范围', 'Extent'), closestSide: text('最近边', 'Closest side'), closestCorner: text('最近角', 'Closest corner'),
    farthestSide: text('最远边', 'Farthest side'), farthestCorner: text('最远角', 'Farthest corner'), repeating: text('重复渐变', 'Repeat gradient'),
  };
  return <ComponentExample id="color-picker-solid-and-gradients" title={text('纯色与渐变', 'Solid and gradients')} code={`const [paint, setPaint] = useState(${JSON.stringify(value, null, 2)});

<ColorPicker allowGradient value={paint} onValueChange={setPaint}
  maxStops={8} labels={localizedLabels} gradientLabels={localizedGradientLabels} />
// formatColorPaint(paint) returns a CSS color or gradient.`}>
    <ColorPicker allowGradient value={value} onValueChange={setValue} maxStops={8}
      label={text('纯色与渐变', 'Solid and gradients')} gradientLabels={gradientLabels}
      labels={{ palette: t('打开颜色面板'), value: t('颜色值'), alpha: t('透明度'), presets: t('颜色预设'), invalid: t('请输入 #RGB、#RGBA、#RRGGBB 或 #RRGGBBAA') }} />
  </ComponentExample>;
}
