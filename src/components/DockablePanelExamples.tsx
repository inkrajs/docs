import { useState } from 'react';
import {
  Badge,
  Button,
  DockablePanel,
  DockablePanelWorkspace,
  PencilText,
  Switch,
  type DockablePanelPosition,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './DockablePanelExamples.css';

const panelLabels = (t: (value: string) => string) => ({
  move: t('移动面板'),
  collapse: t('收起面板'),
  expand: t('展开面板'),
  reset: t('恢复面板位置'),
  keyboardInstructions: t('使用方向键移动面板，按住 Shift 加速，按 Home 恢复位置。'),
});

function InspectorContent({ t }: { t: (value: string) => string }) {
  return <div className="dockable-panel-example__content">
    <PencilText>{t('选择一个图层，快速调整它的显示状态。')}</PencilText>
    <div className="dockable-panel-example__row"><Badge size="sm">hero.png</Badge><Switch label={t('可见')} defaultChecked /></div>
    <Button size="sm" variant="outline" data-dockable-panel-no-drag>{t('打开设置')}</Button>
  </div>;
}

export function DockablePanelExamples() {
  const { t } = useLocale();
  const [snap, setSnap] = useState(true);
  const [collapsible, setCollapsible] = useState(true);
  const [activeId, setActiveId] = useState('notes');
  const [controlledPosition, setControlledPosition] = useState<DockablePanelPosition>({ x: 164, y: 72 });
  const code = `<DockablePanelWorkspace snapThreshold={${snap ? 16 : 0}} defaultActiveId="notes">
  <DockablePanel id="notes" title="${t('便笺')}" defaultPosition={{ x: 20, y: 24 }}>
    <Notes />
  </DockablePanel>
  <DockablePanel id="inspector" title="${t('检查器')}" defaultPosition={{ x: 184, y: 86 }}>
    <Inspector />
  </DockablePanel>
</DockablePanelWorkspace>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={t('边缘吸附')} checked={snap} onCheckedChange={setSnap} />
        <Switch label={t('允许收起')} checked={collapsible} onCheckedChange={setCollapsible} />
      </> },
      { label: '状态', content: <PencilText>{`${t('当前面板')}: ${t(activeId === 'notes' ? '便笺' : '检查器')}`}</PencilText> },
    ]} />}>
      <DockablePanelWorkspace
        aria-label={t('浮动面板工作区')}
        className="dockable-panel-example__workspace"
        defaultActiveId="notes"
        onActiveChange={setActiveId}
        snapThreshold={snap ? 16 : 0}
        data-testid="dockable-panel-workspace"
      >
        <DockablePanel
          id="notes"
          title={t('便笺')}
          defaultPosition={{ x: 20, y: 24 }}
          collapsible={collapsible}
          labels={panelLabels(t)}
        >
          <div className="dockable-panel-example__content">
            <PencilText>{t('拖动标题栏，把便笺放到顺手的位置。')}</PencilText>
            <Button size="sm" variant="secondary" data-dockable-panel-no-drag>{t('完成')}</Button>
          </div>
        </DockablePanel>
        <DockablePanel
          id="inspector"
          title={t('检查器')}
          defaultPosition={{ x: 184, y: 86 }}
          collapsible={collapsible}
          labels={panelLabels(t)}
        >
          <InspectorContent t={t} />
        </DockablePanel>
      </DockablePanelWorkspace>
    </ComponentPlayground>

    <ComponentExample id="dockable-panel-controlled-position" title={t('受控位置')} code={`const [position, setPosition] = useState({ x: 164, y: 72 });

<DockablePanelWorkspace activeId="tools">
  <DockablePanel
    id="tools"
    title="${t('工具')}"
    position={position}
    onPositionChange={setPosition}
  >
    <ToolOptions />
  </DockablePanel>
</DockablePanelWorkspace>`}>
      <div className="dockable-panel-example__controlled-layout">
        <DockablePanelWorkspace activeId="tools" className="dockable-panel-example__workspace dockable-panel-example__workspace--compact">
          <DockablePanel
            id="tools"
            title={t('工具')}
            position={controlledPosition}
            onPositionChange={setControlledPosition}
            labels={panelLabels(t)}
          >
            <InspectorContent t={t} />
          </DockablePanel>
        </DockablePanelWorkspace>
        <PencilText as="output">{`${t('位置')}: ${Math.round(controlledPosition.x)}, ${Math.round(controlledPosition.y)}`}</PencilText>
      </div>
    </ComponentExample>
  </>;
}
