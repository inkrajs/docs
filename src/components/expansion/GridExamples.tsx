import { useState } from 'react';
import { Badge, Button, Grid, PencilText, Progress, Sparkline, Switch } from '@inkra/react';
import type { GridBoardLayout, LayoutSpace, ResizableLayout } from '@inkra/react';
import { useLocale } from '../../i18n';
import { ComponentPlayground } from '../ComponentPlayground';
import { ComponentExample } from '../ComponentExample';
import { DocsSelect } from '../DocsSelect';
import { DocsSlider } from '../DocsSlider';
import { PropertyTabs } from '../PropertyTabs';
import './GridExamples.css';

const initialBoard: GridBoardLayout = [
  { i: 'activity', x: 0, y: 0, w: 7, h: 4, minW: 3, minH: 3 },
  { i: 'tasks', x: 7, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
  { i: 'review', x: 0, y: 4, w: 5, h: 3, minW: 3, minH: 3 },
  { i: 'notes', x: 5, y: 4, w: 7, h: 3, minW: 3, minH: 3 },
];
const columns = [{ id: 'first', minSize: '15%' }, { id: 'second', minSize: '15%' }, { id: 'third', minSize: '15%' }];
const rows = [{ id: 'top', minSize: '25%' }, { id: 'bottom', minSize: '25%' }];
const values = [12, 18, 14, 25, 22, 32, 29, 41, 37, 48];

export function GridExamples() {
  const { t } = useLocale();
  const [mode, setMode] = useState('basic');
  const [count, setCount] = useState(3);
  const [gap, setGap] = useState(12);
  const [rowHeight, setRowHeight] = useState(40);
  const [responsive, setResponsive] = useState(true);
  const [draggable, setDraggable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [resizeRows, setResizeRows] = useState(true);
  const [resizeColumns, setResizeColumns] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [board, setBoard] = useState(initialBoard);
  const [columnSizes, setColumnSizes] = useState<ResizableLayout>({ first: 34, second: 33, third: 33 });
  const [rowSizes, setRowSizes] = useState<ResizableLayout>({ top: 50, bottom: 50 });
  const [saved, setSaved] = useState(false);
  const names = [
    ['草图', 'Sketches'], ['图标', 'Icons'], ['色彩', 'Colors'],
    ['文字', 'Text'], ['布局', 'Layout'], ['交互', 'Interaction'],
  ].map(([source, english]) => t(source, english));
  const labels: Record<string, string> = {
    activity: t('工作动态', 'Activity'), tasks: t('本周任务', 'Weekly tasks'),
    review: t('待审核', 'In review'), notes: t('快速笔记', 'Quick notes'),
  };
  const boardCode = `<Grid.Board\n  layout={layout}\n  onLayoutChange={setLayout}\n  columns={12}\n  rowHeight={${rowHeight}}\n  gap={${gap}}\n  draggable={${draggable}}\n  resizable={${resizable}}\n  disabled={${disabled}}\n  stackAt={${responsive ? 480 : 0}}\n  getItemLabel={id => labels[id]}\n>\n  {item => <Panel id={item.i} />}\n</Grid.Board>`;
  const trackCode = `<Grid.Resizable\n  columns={${JSON.stringify(columns)}}\n  rows={${JSON.stringify(rows)}}\n  columnSizes={columnSizes}\n  rowSizes={rowSizes}\n  onColumnSizesChange={setColumnSizes}\n  onRowSizesChange={setRowSizes}\n  resizeColumns={${resizeColumns}}\n  resizeRows={${resizeRows}}\n  disabled={${disabled}}\n  style={{ height: 320 }}\n>\n  {({ row, column }) => <Cell row={row} column={column} />}\n</Grid.Resizable>`;
  const code = mode === 'board' ? `const initialLayout = ${JSON.stringify(initialBoard, null, 2)};\nconst [layout, setLayout] = useState(initialLayout);\n\n${boardCode}`
    : mode === 'tracks' ? trackCode
      : `<Grid columns={${responsive ? `{ base: 1, sm: 2, lg: ${count} }` : count}} gap={${Number(gap) / 4}}>\n  {items.map(item => <PencilText key={item}>{item}</PencilText>)}\n</Grid>`;

  const tracks = <Grid.Resizable className="grid-examples__tracks" columns={columns} rows={rows}
    columnSizes={columnSizes} onColumnSizesChange={setColumnSizes} rowSizes={rowSizes} onRowSizesChange={setRowSizes}
    resizeColumns={resizeColumns} resizeRows={resizeRows} disabled={disabled}
    getHandleLabel={(axis, before, after) => {
      const tracks = axis === 'row' ? rows : columns;
      const label = axis === 'row' ? t('调整行', 'Resize row') : t('调整列', 'Resize column');
      return `${label}: ${tracks.findIndex(track => track.id === before) + 1} / ${tracks.findIndex(track => track.id === after) + 1}`;
    }}>
    {({ rowIndex, columnIndex }) => <div className="grid-examples__cell"><PencilText>{names[rowIndex * 3 + columnIndex]}</PencilText></div>}
  </Grid.Resizable>;

  const dashboard = <Grid.Board layout={board} onLayoutChange={setBoard} rowHeight={rowHeight} gap={gap}
        draggable={draggable} resizable={resizable} disabled={disabled} stackAt={responsive ? 480 : 0} getItemLabel={id => labels[id]}>
        {item => item.i === 'activity' ? <div className="grid-examples__metric"><PencilText as="strong">48</PencilText><Sparkline data={values} height={64} width={220} showSummary={false} label={labels.activity} /></div>
          : item.i === 'tasks' ? <div className="grid-examples__metric"><PencilText as="strong">12 / 18</PencilText><Progress value={12} max={18} aria-label={labels.tasks} /></div>
            : item.i === 'review' ? <div className="grid-examples__review"><Badge>{t('图标', 'Icons')}</Badge><Badge variant="warning">{t('布局', 'Layout')}</Badge></div>
              : <Button variant="ghost" onClick={() => setSaved(value => !value)}>{saved ? t('已保存', 'Saved') : t('保存草稿', 'Save draft')}</Button>}
      </Grid.Board>;

  return <div className="grid-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label={t('模式', 'Mode')} value={mode} onValueChange={setMode} options={[
          ['basic', t('基础网格', 'Basic grid')], ['tracks', t('行列调整', 'Resizable tracks')], ['board', t('拖拽看板', 'Dashboard')],
        ]} />
        {mode !== 'tracks' && <DocsSlider label={t('间距', 'Gap')} value={gap} onValueChange={setGap}
          min={0} max={24} step={4} unit=" px" />}
        {mode === 'board' && <DocsSlider label={t('行高', 'Row height')} value={rowHeight} onValueChange={setRowHeight}
          min={24} max={96} step={4} unit=" px" />}
        {mode === 'basic' && <DocsSlider label={t('列数', 'Columns')} value={count} onValueChange={setCount}
          min={1} max={12} step={1} />}
        {mode !== 'tracks' && <Switch label={t('窄屏自动换行', 'Responsive stacking')} checked={responsive} onCheckedChange={setResponsive} />}
      </> },
      { label: '交互', content: <>
        {mode === 'board' && <><Switch label={t('拖拽位置', 'Move cards')} checked={draggable} onCheckedChange={setDraggable} />
          <Switch label={t('调整卡片大小', 'Resize cards')} checked={resizable} onCheckedChange={setResizable} /></>}
        {mode === 'tracks' && <><Switch label={t('调整列宽', 'Resize columns')} checked={resizeColumns} onCheckedChange={setResizeColumns} />
          <Switch label={t('调整行高', 'Resize rows')} checked={resizeRows} onCheckedChange={setResizeRows} /></>}
        <Button variant="ghost" onClick={() => { setBoard(initialBoard); setColumnSizes({ first: 34, second: 33, third: 33 }); setRowSizes({ top: 50, bottom: 50 }); }}>{t('恢复布局', 'Reset layout')}</Button>
      </> },
      { label: '状态', content: <Switch label={t('禁用调整', 'Disable editing')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      {mode === 'board' ? dashboard : mode === 'tracks' ? tracks
        : <Grid className="grid-examples__basic" columns={responsive ? { base: 1, sm: 2, lg: Number(count) } : Number(count)} gap={Number(gap) / 4 as LayoutSpace}>
          {names.map(name => <div className="grid-examples__cell" key={name}><PencilText>{name}</PencilText></div>)}
        </Grid>}
    </ComponentPlayground>
    {mode !== 'tracks' && <ComponentExample id="grid-resize-shared-columns-and-rows" title={t('同步调整整列与整行', 'Resize shared columns and rows')} code={trackCode}>{tracks}</ComponentExample>}
    {mode !== 'board' && <ComponentExample id="grid-dashboard" title={t('拖拽看板', 'Dashboard')} code={`const [layout, setLayout] = useState(${JSON.stringify(initialBoard, null, 2)});\n\n${boardCode}`}>{dashboard}</ComponentExample>}
  </div>;
}
