import { useState } from 'react';
import { Radar, Switch } from '@inkra/react';
import type { RadarKey } from '@inkra/react';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import { useLocale } from '../i18n';
import './RadarExamples.css';

const axes = [
  { id: 'speed', label: 'Speed', min: -10, max: 10 },
  { id: 'quality', label: 'Quality', min: 0, max: 100 },
  { id: 'clarity', label: 'Clarity', min: 0, max: 10 },
  { id: 'reach', label: 'Reach', min: 0, max: 100 },
  { id: 'care', label: 'Care', min: 0, max: 10 },
] as const;

const series = [
  { id: 'alpha', label: 'Alpha', data: [{ axisId: 'speed', value: 5 }, { axisId: 'quality', value: 82 }, { axisId: 'clarity', value: 7 }, { axisId: 'reach', value: 48 }, { axisId: 'care', value: 8 }] },
  { id: 'beta', label: 'Beta', pattern: 'dash' as const, data: [{ axisId: 'speed', value: -4 }, { axisId: 'quality', value: 68 }, { axisId: 'clarity', value: 5 }, { axisId: 'reach', value: 76 }, { axisId: 'care', value: 6 }] },
  { id: 'gamma', label: 'Gamma', pattern: 'dot' as const, data: [{ axisId: 'speed', value: 2 }, { axisId: 'quality', value: 54 }, { axisId: 'clarity', value: null }, { axisId: 'reach', value: 61 }, { axisId: 'care', value: 4 }] },
];

const quote = (value: string) => JSON.stringify(value);

export function RadarExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (cn: string, en: string) => zh ? cn : en;
  const [selected, setSelected] = useState<RadarKey | null>('alpha');
  const [showLabels, setShowLabels] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const [levels, setLevels] = useState('4');
  const code = `<Radar\n  label=${quote(text('能力画像', 'Capability profile'))}\n  axes={axes}\n  series={series}\n  levels={${levels}}\n  showLabels={${showLabels}}\n  showValues={${showValues}}\n  showTable={${showTable}}\n  selectedSeries=${JSON.stringify(selected)}\n  onSelectedSeriesChange={setSelected}\n/>`;
  return <div className="radar-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('图表', 'Chart'), content: <>
        <DocsSelect label={text('网格层级', 'Grid levels')} value={levels} onValueChange={setLevels} options={[['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']]} />
        <Switch label={text('显示轴标签', 'Show axis labels')} checked={showLabels} onCheckedChange={setShowLabels} />
        <Switch label={text('显示数值', 'Show values')} checked={showValues} onCheckedChange={setShowValues} />
        <Switch label={text('显示数据表', 'Show data table')} checked={showTable} onCheckedChange={setShowTable} />
      </> },
    ]} />}>
      <Radar axes={axes} series={series} label={text('能力画像', 'Capability profile')} description={text('每条线都有独立线型和可读数据摘要。', 'Each series has its own line pattern and readable data summary.')} levels={Number(levels)} showLabels={showLabels} showValues={showValues} showTable={showTable} selectedSeries={selected} onSelectedSeriesChange={setSelected} getValueLabel={value => `${value}`} />
    </ComponentPlayground>
    <ComponentExample title={text('缺失值与负值', 'Missing and negative values')} code={'<Radar axes={axes} series={[{ id: "beta", label: "Beta", data: [{ axisId: "speed", value: -4 }, { axisId: "clarity", value: null }] }]} label="Boundary values" />'}>
      <Radar axes={axes.slice(0, 3)} series={[{ id: 'boundary', label: text('边界样本', 'Boundary sample'), data: [{ axisId: 'speed', value: -4 }, { axisId: 'quality', value: 0 }, { axisId: 'clarity', value: null }] }]} label={text('边界样本', 'Boundary sample')} description={text('0 是有效数值，空值显示为缺失。', 'Zero is measured; null is missing.')} showLegend={false} />
    </ComponentExample>
  </div>;
}
