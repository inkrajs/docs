import { useState } from 'react';
import { ColorSwatch, Switch } from '@inkra/react';
import type { ColorSwatchProps } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';

export function ColorSwatchExamples() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(false);
  const [paletteColor, setPaletteColor] = useState('#4b96aa');
  const [size, setSize] = useState<ColorSwatchProps['size']>('md');
  const [disabled, setDisabled] = useState(false);
  const colors = [
    { color: '#4b96aa', label: t('海蓝') }, { color: '#629568', label: t('松绿') },
    { color: '#994f3f', label: t('朱砂') }, { color: '#e6c17b99', label: t('琥珀 60%') },
    { color: 'var(--inkra-ink)', label: t('主要文字') },
  ];
  return <><ComponentPlayground code={`const [selected, setSelected] = useState(false);

<ColorSwatch color="#4b96aa" label="${t('海蓝')}"
  selected={selected} onClick={() => setSelected(current => !current)}
  size="${size}" disabled={${disabled}} />`} controls={<PropertyTabs groups={[
    { label: '基础', content: <DocsSelect label="尺寸" value={size ?? 'md'} onValueChange={value => setSize(value as typeof size)} options={controlSizes} /> },
    { label: '状态', content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
  ]} />}>
    <ColorSwatch color="#4b96aa" label={t('海蓝')} selected={selected}
      onClick={() => setSelected(current => !current)} size={size} disabled={disabled} />
  </ComponentPlayground>
  <ComponentExample id="color-swatch-palette" title={t('颜色预设')} code={`const [color, setColor] = useState('#4b96aa');

<div role="group" aria-label="${t('颜色预设')}">
  {colors.map(option => <ColorSwatch key={option.color} {...option}
    selected={color === option.color} onClick={() => setColor(option.color)} />)}
</div>`}>
      <div role="group" aria-label={t('颜色预设')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.map(option => <ColorSwatch key={option.color} {...option} selected={paletteColor === option.color}
          onClick={() => setPaletteColor(option.color)} />)}
      </div>
  </ComponentExample></>;
}
