import { useState } from 'react';
import { Heatmap, Switch } from '@inkra/react';
import type { HeatmapCell, HeatmapScaleType, HeatmapSelection } from '@inkra/react';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import { PencilText, useLocale } from '../i18n';
import './HeatmapExamples.css';

const rowMessages = [
  { id: 'research', label: '研究' },
  { id: 'design', label: '设计' },
  { id: 'engineering', label: '工程' },
  { id: 'support', label: '支持' },
];

const columnMessages = [
  { id: 'clarity', label: '清晰度' },
  { id: 'momentum', label: '推进力' },
  { id: 'quality', label: '质量' },
  { id: 'risk', label: '风险' },
];

const cells: HeatmapCell[] = [
  { rowId: 'research', columnId: 'clarity', value: 82 },
  { rowId: 'research', columnId: 'momentum', value: 64 },
  { rowId: 'research', columnId: 'quality', value: 91 },
  { rowId: 'research', columnId: 'risk', value: 18 },
  { rowId: 'design', columnId: 'clarity', value: 74 },
  { rowId: 'design', columnId: 'momentum', value: 57 },
  { rowId: 'design', columnId: 'quality', value: null },
  { rowId: 'design', columnId: 'risk', value: 33 },
  { rowId: 'engineering', columnId: 'clarity', value: 69 },
  { rowId: 'engineering', columnId: 'momentum', value: 88 },
  { rowId: 'engineering', columnId: 'quality', value: 78 },
  { rowId: 'engineering', columnId: 'risk', value: 46 },
  { rowId: 'support', columnId: 'clarity', value: 61 },
  { rowId: 'support', columnId: 'momentum', value: 0 },
  { rowId: 'support', columnId: 'quality', value: 72 },
  { rowId: 'support', columnId: 'risk', value: 39 },
];

const compactRowMessages = [
  { id: 'north', label: '北区' },
  { id: 'central', label: '中区' },
  { id: 'south', label: '南区' },
];

const compactColumnMessages = [
  { id: 'new', label: '新增' },
  { id: 'returning', label: '再次出现' },
  { id: 'resolved', label: '已解决' },
];

const compactCells: HeatmapCell[] = [
  { rowId: 'north', columnId: 'new', value: 28, data: { change: 6 } },
  { rowId: 'north', columnId: 'returning', value: 17, data: { change: -2 } },
  { rowId: 'north', columnId: 'resolved', value: 36, data: { change: 4 } },
  { rowId: 'central', columnId: 'new', value: 42, data: { change: 9 } },
  { rowId: 'central', columnId: 'returning', value: 24, data: { change: 0 } },
  { rowId: 'central', columnId: 'resolved', value: 31, data: { change: -1 } },
  { rowId: 'south', columnId: 'new', value: 19, data: { change: -3 } },
  { rowId: 'south', columnId: 'returning', value: null },
  { rowId: 'south', columnId: 'resolved', value: 27, data: { change: 5 } },
];

export function HeatmapExamples() {
  const { locale, t } = useLocale();
  const localizeLabels = (items: { id: string; label: string }[]) => items.map(item => ({ ...item, label: t(item.label) }));
  const rows = localizeLabels(rowMessages);
  const columns = localizeLabels(columnMessages);
  const compactRows = localizeLabels(compactRowMessages);
  const compactColumns = localizeLabels(compactColumnMessages);
  const text = locale === 'en' ? {
    title: 'Team health matrix',
    description: 'Arrow keys move through cells. Enter or Space selects one.',
    scale: 'Scale',
    continuous: 'Continuous',
    quantize: 'Quantized',
    bins: 'Bins',
    values: 'Show values',
    legend: 'Show legend',
    intensity: 'Health score',
    missing: 'Not measured',
    selected: 'Selected cell',
    none: 'None',
    custom: 'Custom cell content',
    customTitle: 'Regional workload',
    customDescription: 'The arrow is visible context; the numeric value remains in each cell and its accessible name.',
    tasks: 'tasks',
  } : {
    title: '团队健康矩阵',
    description: '方向键移动单元格，Enter 或空格选择。',
    scale: '色阶',
    continuous: '连续',
    quantize: '离散分箱',
    bins: '分箱数',
    values: '显示数值',
    legend: '显示图例',
    intensity: '健康分数',
    missing: '未测量',
    selected: '已选单元格',
    none: '无',
    custom: '自定义单元格内容',
    customTitle: '区域工作量',
    customDescription: '箭头提供可见趋势，数值仍显示在单元格和无障碍名称中。',
    tasks: '项任务',
  };
  const [scaleType, setScaleType] = useState<HeatmapScaleType>('continuous');
  const [binCount, setBinCount] = useState(5);
  const [showValues, setShowValues] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedCell, setSelectedCell] = useState<HeatmapSelection | null>({ rowId: 'engineering', columnId: 'momentum' });
  const code = `const [selectedCell, setSelectedCell] = useState({
  rowId: "${selectedCell?.rowId ?? 'engineering'}",
  columnId: "${selectedCell?.columnId ?? 'momentum'}"
});

<Heatmap
  label="${text.title}"
  rows={rows}
  columns={columns}
  cells={cells}
  scaleType="${scaleType}"
  binCount={${binCount}}
  domain={[0, 100]}
  showValues={${showValues}}
  showLegend={${showLegend}}
  selectedCell={selectedCell}
  onSelectedCellChange={setSelectedCell}
  getValueLabel={(value) => \`${'${value}%'}\`}
  missingValueLabel="${text.missing}"
/>`;

  const selectedRow = rows.find(row => row.id === selectedCell?.rowId)?.label;
  const selectedColumn = columns.find(column => column.id === selectedCell?.columnId)?.label;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: locale === 'en' ? 'Scale' : '色阶', content: <>
        <DocsSelect label={text.scale} value={scaleType} onValueChange={next => setScaleType(next as HeatmapScaleType)} options={[
          ['continuous', text.continuous],
          ['quantize', text.quantize],
        ]} />
        {scaleType === 'quantize' ? <DocsSelect label={text.bins} value={String(binCount)} onValueChange={next => setBinCount(Number(next))} options={[
          ['3', '3'], ['5', '5'], ['7', '7'],
        ]} /> : null}
      </> },
      { label: locale === 'en' ? 'Display' : '显示', content: <>
        <Switch label={text.values} checked={showValues} onCheckedChange={setShowValues} />
        <Switch label={text.legend} checked={showLegend} onCheckedChange={setShowLegend} />
      </> },
    ]} />}>
      <div className="heatmap-demo">
        <Heatmap
          label={text.title}
          description={text.description}
          rows={rows}
          columns={columns}
          cells={cells}
          scaleType={scaleType}
          binCount={binCount}
          domain={[0, 100]}
          showValues={showValues}
          showLegend={showLegend}
          legendLabel={text.intensity}
          missingValueLabel={text.missing}
          rowHeaderLabel={locale === 'en' ? 'Teams' : '团队'}
          selectedCell={selectedCell}
          onSelectedCellChange={setSelectedCell}
          getValueLabel={value => `${value}%`}
        />
        <output aria-live="polite" className="heatmap-demo__selection">
          <PencilText>{text.selected}</PencilText>: {selectedRow && selectedColumn ? `${selectedRow} · ${selectedColumn}` : text.none}
        </output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text.custom} code={`<Heatmap
  label="${text.customTitle}"
  rows={compactRows}
  columns={compactColumns}
  cells={compactCells}
  scaleType="quantize"
  domain={[0, 50]}
  renderCell={(cell, { missing }) => missing ? "·" : (
    <span>{cell.value} <b>{cell.data.change > 0 ? "↑" : cell.data.change < 0 ? "↓" : "→"}</b></span>
  )}
/>`}>
      <div className="heatmap-demo heatmap-demo--compact">
        <Heatmap
          label={text.customTitle}
          description={text.customDescription}
          rows={compactRows}
          columns={compactColumns}
          cells={compactCells}
          scaleType="quantize"
          domain={[0, 50]}
          binCount={4}
          legendLabel={text.tasks}
          missingValueLabel={text.missing}
          rowHeaderLabel={locale === 'en' ? 'Regions' : '区域'}
          getValueLabel={value => `${value} ${text.tasks}`}
          renderCell={(cell, { missing }) => {
            if (missing) return '·';
            const change = Number((cell.data as { change?: number } | undefined)?.change ?? 0);
            const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            return <span className="heatmap-demo__custom-cell"><span>{cell.value}</span><b aria-hidden="true" data-direction={change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}>{arrow}</b></span>;
          }}
        />
      </div>
    </ComponentExample>
  </>;
}
