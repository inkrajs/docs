import { useState } from 'react';
import { Badge, Slot, Switch } from '@inkra/react';
import { __iconData as hammerIcon } from 'lucide-react/dist/esm/icons/hammer.mjs';
import { __iconData as mapIcon } from 'lucide-react/dist/esm/icons/map.mjs';
import { __iconData as packageIcon } from 'lucide-react/dist/esm/icons/package.mjs';
import { __iconData as torchIcon } from 'lucide-react/dist/esm/icons/flashlight.mjs';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './SlotExamples.css';

export function SlotExamples() {
  const { t } = useLocale();
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [selected, setSelected] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [count, setCount] = useState(true);
  const code = `<Slot interactive aria-label="${t('使用锤子')}" size="${size}"
  selected={${selected}} disabled={${disabled}} empty={${empty}}${count ? '\n  count={4}' : ''}
  onClick={() => setSelected(value => !value)}>
  <HammerIcon />
</Slot>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={controlSizes} />
        <Switch label={t('显示数量')} checked={count} onCheckedChange={setCount} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('选中')} checked={selected} onCheckedChange={setSelected} />
        <Switch label={t('空状态')} checked={empty} onCheckedChange={setEmpty} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <Slot interactive aria-label={t('使用锤子')} size={size} selected={selected} disabled={disabled} empty={empty} count={count ? 4 : undefined} onClick={() => setSelected(value => !value)}>
        <DocsIcon data={hammerIcon} size={40} />
      </Slot>
    </ComponentPlayground>

    <ComponentExample id="slot-quick-tools" title={t('快捷工具')} code={`<div className="tool-slots">
  <Slot interactive aria-label="${t('使用手电筒')}" selected><TorchIcon /></Slot>
  <Slot interactive aria-label="${t('打开地图')}"><MapIcon /></Slot>
  <Slot interactive aria-label="${t('空快捷槽')}" empty />
</div>`}>
      <div className="slot-examples__row">
        <Slot interactive aria-label={t('使用手电筒')} selected><DocsIcon data={torchIcon} size={40} /></Slot>
        <Slot interactive aria-label={t('打开地图')}><DocsIcon data={mapIcon} size={40} /></Slot>
        <Slot interactive aria-label={t('空快捷槽')} empty />
      </div>
    </ComponentExample>

    <ComponentExample id="slot-resource-slots" title={t('资源槽位')} code={`<div className="resource-slots">
  <Slot aria-label="${t('木材')}" count={18}><WoodIcon /></Slot>
  <Slot aria-label="${t('补给箱')}" count={120}
    renderCount={count => <Badge variant="accent">{count}+</Badge>}>
    <PackageIcon />
  </Slot>
</div>`}>
      <div className="slot-examples__row">
        <Slot aria-label={t('木材')} count={18}><span className="slot-examples__resource">///</span></Slot>
        <Slot aria-label={t('补给箱')} count={120} renderCount={value => <Badge variant="accent">{value}+</Badge>}><DocsIcon data={packageIcon} size={40} /></Slot>
      </div>
    </ComponentExample>
  </>;
}
