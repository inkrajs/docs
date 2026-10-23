import { Tabs } from '@inkra/react';
import type { ReactNode } from 'react';
import { useLocale } from '../i18n';
import { __iconData as settingsIcon } from 'lucide-react/dist/esm/icons/settings.mjs';
import { __iconData as layoutIcon } from 'lucide-react/dist/esm/icons/panels-top-left.mjs';
import { __iconData as textIcon } from 'lucide-react/dist/esm/icons/text-align-start.mjs';
import { __iconData as stateIcon } from 'lucide-react/dist/esm/icons/toggle-left.mjs';
import { __iconData as pointerIcon } from 'lucide-react/dist/esm/icons/mouse-pointer-2.mjs';
import { __iconData as layersIcon } from 'lucide-react/dist/esm/icons/layers.mjs';
import { DocsIcon } from './DocsIcon';

const categoryIcons = { '基础': settingsIcon, '布局': layoutIcon, '内容': textIcon, '状态': stateIcon, '交互': pointerIcon, '组合': layersIcon };

export function PropertyTabs({ groups }: { groups: { label: string; content: ReactNode }[] }) {
  const { t } = useLocale();
  return <Tabs.Root className="property-tabs" defaultValue="group-0" size="sm">
    <Tabs.List aria-label={t('属性分类')} fullWidth>
      {groups.map((group, index) => {
        const category = (Object.keys(categoryIcons) as (keyof typeof categoryIcons)[]).find(key => key === group.label || t(key) === group.label);
        return <Tabs.Trigger key={index} value={`group-${index}`} startIcon={<DocsIcon data={category ? categoryIcons[category] : settingsIcon} size={24} />}>{t(group.label)}</Tabs.Trigger>;
      })}
    </Tabs.List>
    {groups.map((group, index) => <Tabs.Content key={index} value={`group-${index}`} forceMount>
      <div className="property-tabs__fields">{group.content}</div>
    </Tabs.Content>)}
  </Tabs.Root>;
}
