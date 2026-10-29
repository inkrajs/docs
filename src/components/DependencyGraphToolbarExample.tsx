import { useState } from 'react';
import { Button, Checkbox, DependencyGraph, type DependencyGraphEdge } from '@inkra/react';
import { __iconData as percentIcon } from 'lucide-react/dist/esm/icons/percent.mjs';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { DocsIcon, iconPaths } from './DocsIcon';
import { iconFilledPaths } from './iconFilledPaths';
import './DependencyGraphToolbarExample.css';

const edges: DependencyGraphEdge[] = [
  { id: 'a-b', source: 'a', target: 'b' },
  { id: 'b-c', source: 'b', target: 'c' },
];

export function DependencyGraphToolbarExample() {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(true);
  const [buttons, setButtons] = useState({ zoomIn: true, zoomOut: true, fitView: true });
  const [showExtra, setShowExtra] = useState(true);
  const [percentage, setPercentage] = useState<number | null>(null);
  const nodes = [
    { id: 'a', label: t('准备', 'Prepare') },
    { id: 'b', label: t('制作', 'Create') },
    { id: 'c', label: t('完成', 'Finish') },
  ];
  const extraLabel = t('显示缩放比例', 'Show zoom percentage');
  const options = [
    ['zoomIn', t('放大', 'Zoom in')],
    ['zoomOut', t('缩小', 'Zoom out')],
    ['fitView', t('适应视图', 'Fit view')],
  ] as const;
  const code = `import { useState } from 'react';
import { Button, Checkbox, DependencyGraph, PencilIcon } from '@inkra/react';

const nodes = ${JSON.stringify(nodes, null, 2)};
const edges = ${JSON.stringify(edges, null, 2)};
const options = ${JSON.stringify(options)} as const;

export function GraphToolbarDemo() {
  const [enabled, setEnabled] = useState(${enabled});
  const [buttons, setButtons] = useState(${JSON.stringify(buttons)});
  const [showExtra, setShowExtra] = useState(${showExtra});
  const [percentage, setPercentage] = useState<number | null>(null);

  return <>
    <Checkbox label=${JSON.stringify(t('显示工具栏', 'Show toolbar'))}
      checked={enabled} onCheckedChange={setEnabled} />
    {options.map(([key, label]) =>
      <Checkbox key={key} label={label} checked={buttons[key]} disabled={!enabled}
        onCheckedChange={checked => setButtons(previous => ({ ...previous, [key]: checked }))} />
    )}
    <Checkbox label=${JSON.stringify(t('自定义按钮', 'Custom button'))}
      checked={showExtra} disabled={!enabled} onCheckedChange={setShowExtra} />
    <DependencyGraph.Root nodes={nodes} edges={edges}
      controls={enabled ? { ...buttons, position: 'bottom-left' } : false}
      extraControls={showExtra ? api =>
        <Button size="icon-sm" variant="outline" aria-label=${JSON.stringify(extraLabel)}
          onClick={() => setPercentage(Math.round(api.getViewport().zoom * 100))}>
          <PencilIcon decorative size={20} paths={${JSON.stringify(iconPaths(percentIcon))}}
            filledPaths={${JSON.stringify(iconFilledPaths(percentIcon))}} />
        </Button> : undefined}
    />
    <output>{percentage === null ? '—' : percentage + '%'}</output>
  </>;
}`;
  return <ComponentExample id="dependency-graph-toolbar" title={t('可配置画布工具栏', 'Configurable graph toolbar')} code={code}>
    <div className="dependency-graph-toolbar-example__options">
      <Checkbox label={t('显示工具栏', 'Show toolbar')} checked={enabled} onCheckedChange={setEnabled} />
      {options.map(([key, label]) => <Checkbox key={key} label={label} checked={buttons[key]} disabled={!enabled}
        onCheckedChange={checked => setButtons(previous => ({ ...previous, [key]: checked }))} />)}
      <Checkbox label={t('自定义按钮', 'Custom button')} checked={showExtra} disabled={!enabled} onCheckedChange={setShowExtra} />
    </div>
    <DependencyGraph.Root nodes={nodes} edges={edges} aria-label={t('可配置工具栏依赖图', 'Dependency graph with configurable toolbar')}
      controls={enabled ? { ...buttons, position: 'bottom-left' } : false}
      extraControls={showExtra ? api => <Button size="icon-sm" variant="outline" aria-label={extraLabel} title={extraLabel}
        onClick={() => setPercentage(Math.round(api.getViewport().zoom * 100))}><DocsIcon data={percentIcon} size={20} /></Button> : undefined} />
    <output className="dependency-graph-toolbar-example__output" aria-live="polite">
      <PencilText>{percentage === null
        ? t('点击自定义百分比按钮，读取当前缩放比例。', 'Use the custom percentage button to read the current zoom.')
        : `${t('当前缩放', 'Current zoom')}: ${percentage}%`}</PencilText>
    </output>
  </ComponentExample>;
}
