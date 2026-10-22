import { useState } from 'react';
import { Button, Resizable, Switch, useResizablePanelRef } from '@inkra/react';
import type { ResizableLayout, ResizableOrientation } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './ResizableExamples.css';

const orientationOptions = [['horizontal', '横向'], ['vertical', '纵向']] as const;

function PanelContent({ title, detail }: { title: string; detail: string }) {
  return <div className="resizable-examples__panel-content">
    <strong>{title}</strong>
    <span>{detail}</span>
  </div>;
}

export function ResizableExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'en' ? en : zh;
  const [orientation, setOrientation] = useState<ResizableOrientation>('horizontal');
  const [disabled, setDisabled] = useState(false);
  const [layout, setLayout] = useState<ResizableLayout>({ navigation: 32, workspace: 68 });
  const navigationRef = useResizablePanelRef();
  const code = `<Resizable.Root
  orientation="${orientation}"
  layout={layout}
  onLayoutChange={setLayout}
  onLayoutCommit={(next, meta) => save(meta.requestedLayout ?? next)}
  disabled={${disabled}}
>
  <Resizable.Panel id="navigation" minSize="20%" maxSize="55%" collapsible>
    <Navigation />
  </Resizable.Panel>
  <Resizable.Handle label="${text('调整导航与工作区', 'Resize navigation and workspace')}" />
  <Resizable.Panel id="workspace" minSize="35%">
    <Workspace />
  </Resizable.Panel>
</Resizable.Root>`;

  return <div className="resizable-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label="方向" value={orientation} onValueChange={value => setOrientation(value as ResizableOrientation)} options={orientationOptions} />
        <p className="resizable-examples__layout-value">{text('受控布局', 'Controlled layout')}: {Math.round(layout.navigation ?? 0)} / {Math.round(layout.workspace ?? 0)}</p>
        <Button size="sm" variant="outline" onClick={() => setLayout({ navigation: 32, workspace: 68 })}>{text('恢复布局', 'Reset layout')}</Button>
      </> },
      { label: '交互', content: <>
        <Switch label={text('禁用调整', 'Disable resizing')} checked={disabled} onCheckedChange={setDisabled} />
        <div className="resizable-examples__actions">
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => navigationRef.current?.collapse()}>{text('折叠导航', 'Collapse navigation')}</Button>
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => navigationRef.current?.expand()}>{text('恢复导航', 'Restore navigation')}</Button>
        </div>
      </> },
    ]} />}>
      <div className="resizable-examples__playground" data-orientation={orientation}>
        <Resizable.Root
          data-testid="resizable-playground"
          disabled={disabled}
          layout={layout}
          onLayoutChange={setLayout}
          orientation={orientation}
        >
          <Resizable.Panel id="navigation" minSize="20%" maxSize="55%" collapsible panelRef={navigationRef}>
            <PanelContent title={text('导航', 'Navigation')} detail={text('最小 20%，最大 55%', 'Minimum 20%, maximum 55%')} />
          </Resizable.Panel>
          <Resizable.Handle label={text('调整导航与工作区', 'Resize navigation and workspace')} />
          <Resizable.Panel id="workspace" minSize="35%">
            <PanelContent title={text('工作区', 'Workspace')} detail={text('布局状态由外部控制', 'Layout state is externally controlled')} />
          </Resizable.Panel>
        </Resizable.Root>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('纵向检查区', 'Vertical inspector')} code={`<Resizable.Root orientation="vertical" defaultLayout={{ preview: 62, details: 38 }}>
  <Resizable.Panel id="preview" minSize="35%"><Preview /></Resizable.Panel>
  <Resizable.Handle label="${text('调整预览与详情', 'Resize preview and details')}" />
  <Resizable.Panel id="details" minSize="24%" maxSize="55%"><Details /></Resizable.Panel>
</Resizable.Root>`}>
      <div className="resizable-examples__vertical">
        <Resizable.Root orientation="vertical" defaultLayout={{ preview: 62, details: 38 }}>
          <Resizable.Panel id="preview" minSize="35%"><PanelContent title={text('预览', 'Preview')} detail={text('内容保持可选择', 'Content remains selectable')} /></Resizable.Panel>
          <Resizable.Handle label={text('调整预览与详情', 'Resize preview and details')} />
          <Resizable.Panel id="details" minSize="24%" maxSize="55%"><PanelContent title={text('详情', 'Details')} detail={text('方向键也可调整', 'Arrow keys resize too')} /></Resizable.Panel>
        </Resizable.Root>
      </div>
    </ComponentExample>
  </div>;
}
