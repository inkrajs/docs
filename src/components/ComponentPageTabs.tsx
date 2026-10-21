import { Tabs } from '@inkra/react';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as accessibilityIcon } from 'lucide-react/dist/esm/icons/accessibility.mjs';
import { DocsIcon } from './DocsIcon';
import { useLocale } from '../i18n';

export type ComponentPageTab = 'preview' | 'api' | 'accessibility';
const tabIcons = { preview: monitorIcon, api: codeIcon, accessibility: accessibilityIcon };

export function ComponentPageTabs({ name, id, value, onChange }: {
  name: string; id: string; value: ComponentPageTab; onChange: (tab: ComponentPageTab) => void;
}) {
  const { t } = useLocale();
  return <Tabs.Root value={value} onValueChange={next => onChange(next as ComponentPageTab)}>
    <Tabs.List className="page-tabs" aria-label={`${name} ${t('文档视图')}`}>
      {(['preview', 'api', 'accessibility'] as const).map(tab => <Tabs.Trigger key={tab} value={tab} id={`${id}-tab-${tab}`} aria-controls={`${id}-panel-${tab}`} startIcon={<DocsIcon data={tabIcons[tab]} size={26} />}>
        {t(tab === 'preview' ? '示例' : tab === 'api' ? 'API' : '无障碍')}
      </Tabs.Trigger>)}
    </Tabs.List>
  </Tabs.Root>;
}
