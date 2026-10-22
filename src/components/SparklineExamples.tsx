import { useState } from 'react';
import { Button, Sparkline, Switch } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './SparklineExamples.css';

export function SparklineExamples() {
  const { locale } = useLocale();
  const zh = locale !== 'en';
  const text = (cn: string, en: string) => zh ? cn : en;
  const [type, setType] = useState<'line' | 'bar'>('line');
  const [showArea, setShowArea] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [dataset, setDataset] = useState<'sales' | 'negative' | 'empty'>('sales');
  const data = dataset === 'sales' ? [12, 18, 15, null, 25, 22, 31, 28] : dataset === 'negative' ? [-4, -8, -3, 2, -1, 5] : [];
  const code = `<Sparkline\n  data={${JSON.stringify(data)}}\n  type="${type}"\n  showArea={${showArea}}\n  showPoints={${showPoints}}\n  label="${text('销售趋势', 'Sales trend')}"\n/>`;
  return <div className="sparkline-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <DocsSelect label={text('数据集', 'Dataset')} value={dataset} onValueChange={value => setDataset(value as typeof dataset)} options={[['sales', text('销售', 'Sales')], ['negative', text('含负值', 'Negative values')], ['empty', text('空数据', 'Empty')]]} /> },
      { label: '样式', content: <><DocsSelect label={text('类型', 'Type')} value={type} onValueChange={value => setType(value as typeof type)} options={[['line', text('折线', 'Line')], ['bar', text('柱形', 'Bar')]]} /><Switch label={text('显示洗色', 'Show wash')} checked={showArea} onCheckedChange={setShowArea} /><Switch label={text('显示点', 'Show points')} checked={showPoints} onCheckedChange={setShowPoints} /></> },
      { label: '交互', content: <Button variant="ghost" onClick={() => setDataset('sales')}>{text('恢复示例', 'Reset example')}</Button> },
    ]} />}>
      <div className="sparkline-examples__preview"><Sparkline data={data} type={type} showArea={showArea} showPoints={showPoints} label={text('销售趋势', 'Sales trend')} /></div>
    </ComponentPlayground>
    <ComponentExample title={text('负值与缺失值', 'Negative and missing values')} code={`<Sparkline data={[-4, -8, null, 2, 5]} type="bar" label="${text('收益趋势', 'Revenue trend')}" />`}>
      <Sparkline data={[-4, -8, null, 2, 5]} type="bar" label={text('收益趋势', 'Revenue trend')} />
    </ComponentExample>
  </div>;
}
