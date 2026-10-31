import { useState } from 'react';
import { PencilLine, PencilSurface, Tabs } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import type { Theme } from '../routes';
import { PageHeading } from './PageHeading';
import { ColorSystem } from './ColorSystem';
import { GeometrySystem } from './GeometrySystem';
import { IconSystem, TypographySystem } from './TypographySystem';

export function DesignStandardPage({ theme }: { theme: Theme }) {
  const { t } = useLocale();
  const [section, setSection] = useState('colors');
  const sections = [{ id: 'colors', label: '色彩' }, { id: 'geometry', label: '尺寸与间距' }, { id: 'typography', label: '字体' }, { id: 'icons', label: '图标' }, { id: 'materials', label: '材质' }];
  return (
    <article className="documentation documentation--standard">
      <PageHeading title="设计规范" />
      <Tabs.Root value={section} onValueChange={setSection}>
      <Tabs.List className="standard-tabs" aria-label={t('设计规范分类')}>
        {sections.map(item => <Tabs.Trigger key={item.id} value={item.id}>{t(item.label)}</Tabs.Trigger>)}
      </Tabs.List>
      <PencilLine className="section-divider standard-tabs-divider" seed="standard-tabs-divider" />
      <Tabs.Content value="colors" className="content-section design-standard"><ColorSystem theme={theme} /></Tabs.Content>
      <Tabs.Content value="geometry" className="content-section design-standard"><GeometrySystem /></Tabs.Content>
      <Tabs.Content value="typography" className="content-section design-standard">
        <TypographySystem />
        <PencilText as="p" className="standard-note" seed="standard-note">默认使用小赖字体，常用字与扩展字按需加载；未覆盖字形由后备字体显示。</PencilText>
      </Tabs.Content>
      <Tabs.Content value="icons" className="content-section design-standard"><IconSystem /></Tabs.Content>
      <Tabs.Content value="materials" className="content-section design-standard">
        <PencilText as="h2" seed="material-title">铅笔材质</PencilText>
        <div className="material-specimens"><PencilSurface className="material-sample" seed="paper-material" variant="paper"><PencilText seed="paper-label">纸面与压力描边</PencilText></PencilSurface><PencilSurface className="material-sample" seed="selection-material" variant="selection"><PencilText seed="selection-label">选中项连续彩铅铺色</PencilText></PencilSurface></div>
      </Tabs.Content>
      </Tabs.Root>
    </article>
  );
}

