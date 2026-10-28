import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Button, ButtonGroup, Switch, type ButtonSize, type ButtonVariant } from '@inkra/react';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { useLocale } from '../i18n';

export function ButtonGroupPlayground() {
  const { t } = useLocale();
  const [size, setSize] = useState<ButtonSize>('md');
  const [variant, setVariant] = useState<ButtonVariant>('outline');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [disabled, setDisabled] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [equalWidth, setEqualWidth] = useState(false);
  const [alignment, setAlignment] = useState('start');
  const items = [['start', '左对齐'], ['center', '居中'], ['end', '右对齐']] as const;
  const code = `<ButtonGroup aria-label="${t('文本对齐')}" orientation="${orientation}" size="${size}" variant="${variant}" disabled={${disabled}} fullWidth={${fullWidth}} equalWidth={${equalWidth}}>\n${items.map(([value, label]) => `  <Button aria-pressed={align === '${value}'} onClick={() => setAlign('${value}')}>${t(label)}</Button>`).join('\n')}\n</ButtonGroup>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as ButtonSize)} options={['xs', 'sm', 'md', 'lg'].map(value => [value, value])} />
        <DocsSelect label="外观" value={variant} onValueChange={value => setVariant(value as ButtonVariant)} options={['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'].map(value => [value, value])} />
      </> },
      { label: '布局', content: <>
        <DocsSelect label="排列" value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["horizontal", "横向"], ["vertical", "纵向"]]} />
        <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} />
        <Switch label={t('等宽按钮')} checked={equalWidth} onCheckedChange={setEqualWidth} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}><ButtonGroup aria-label={t('文本对齐')} size={size} variant={variant} orientation={orientation} fullWidth={fullWidth} equalWidth={equalWidth} disabled={disabled}>
    {items.map(([value, label]) => <Button key={value} aria-pressed={alignment === value} onClick={() => setAlignment(value)}>{t(label)}</Button>)}
  </ButtonGroup></ComponentPlayground>;
}
