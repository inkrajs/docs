import { useState } from 'react';
import { ColorSwatch, Switch } from '@inkra/react';
import type { ColorSwatchProps } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';

export function ColorSwatchExamples() {
  const { t } = useLocale();
  const [selected, setSelected] = useState('#4b96aa');
  const [size, setSize] = useState<ColorSwatchProps['size']>('md');
  const [disabled, setDisabled] = useState(false);
  const colors = [
    { color: '#4b96aa', label: t('海蓝') }, { color: '#629568', label: t('松绿') },
    { color: '#994f3f', label: t('朱砂') }, { color: '#e6c17b99', label: t('琥珀 60%') },
    { color: 'var(--inkra-ink)', label: t('主要文字') },
  ];
  return <ComponentPlayground code={`<ColorSwatch color="#4b96aa" label="${t('海蓝')}"
  selected={color === '#4b96aa'} onClick={() => setColor('#4b96aa')}
  size="${size}" disabled={${disabled}} />`} controls={<PropertyTabs groups={[
    { label: '基础', content: <DocsSelect label="尺寸" value={size ?? 'md'} onValueChange={value => setSize(value as typeof size)} options={controlSizes} /> },
    { label: '状态', content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
  ]} />}>
    <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <div role="group" aria-label={t('颜色预设')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.map(option => <ColorSwatch key={option.color} {...option} selected={selected === option.color}
          onClick={() => setSelected(option.color)} size={size} disabled={disabled} />)}
      </div>
    </div>
  </ComponentPlayground>;
}
